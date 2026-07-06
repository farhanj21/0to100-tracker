"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Floating site assistant. The server grounds Gemini (free tier) in a live
 * snapshot of the board and scopes it to board questions only — see
 * /api/chat + lib/chat.ts. The thread lives in sessionStorage, so it survives
 * page navigation but nothing persists beyond the tab.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Locally-injected failure bubble — rendered red, never re-sent as history. */
  error?: boolean;
}

const STORAGE_KEY = "ztoh-chat-v1";
/** Only the most recent turns ride along — keeps request payloads lean. */
const HISTORY_SENT = 12;
/** Mirrors the server's per-message cap (the server is the real gate). */
const MAX_INPUT_CHARS = 500;

const STARTERS = [
  "Which car is quickest?",
  "Compare the top two cars",
  "What's the average 0–100 time?",
  "Any manual cars on the board?",
];

/**
 * Internal paths the assistant is allowed to cite (see the SITE GUIDE in
 * lib/chat.ts). Anything matching becomes a navigable chip; everything else
 * stays plain text, so the model can never inject an arbitrary link.
 */
const INTERNAL_LINK_RE =
  /\/(?:cars\/[a-z0-9-]+|compare\?cars=[a-z0-9,-]+|numbers\b|race\b|login\b)/gi;

/** Human label for a cited path, e.g. "/cars/2026-chery-tiggo-8" → "2026 Chery Tiggo 8". */
function linkLabel(path: string): string {
  if (path.startsWith("/compare")) return "Compare side-by-side";
  if (path === "/cars/new") return "Add a car";
  if (path.startsWith("/cars/")) {
    return path
      .slice("/cars/".length)
      .split("-")
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(" ");
  }
  if (path === "/numbers") return "Numbers";
  if (path === "/race") return "Race";
  if (path === "/login") return "Login";
  return path;
}

/** Split an assistant reply so cited site paths render as clickable chips. */
function linkifyReply(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(INTERNAL_LINK_RE)) {
    // A compare list can legally contain commas, so a sentence comma right
    // after the URL gets swallowed by the match — hand it back to the text.
    const path = match[0].replace(/,+$/, "");
    const at = match.index ?? 0;
    if (at > cursor) nodes.push(text.slice(cursor, at));
    nodes.push(
      <Link
        key={`${at}-${path}`}
        href={path}
        className="mx-0.5 inline-flex translate-y-px items-center gap-0.5 rounded-sm border border-primary/40 bg-background/60 px-1.5 py-px align-baseline text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        {linkLabel(path)}
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
      </Link>
    );
    cursor = at + path.length; // trimmed commas re-enter as plain text
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function loadThread(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    );
  } catch {
    return [];
  }
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore the tab's thread after mount (sessionStorage isn't SSR-safe).
  useEffect(() => {
    setMessages(loadThread());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full/blocked — the thread just won't survive navigation.
    }
  }, [messages, hydrated]);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const history = next
        .filter((m) => !m.error)
        .slice(-HISTORY_SENT)
        .map(({ role, content: c }) => ({ role, content: c }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data: { reply?: string; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok || !data.reply) {
        throw new Error(data.error || "The assistant hit a snag. Please try again.");
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      // TypeError = fetch never reached the server; anything else carries the
      // API's own user-readable message.
      const message =
        err instanceof TypeError
          ? "Couldn't reach the assistant. Check your connection and try again."
          : err instanceof Error && err.message
            ? err.message
            : "The assistant hit a snag. Please try again.";
      setMessages([...next, { role: "assistant", content: message, error: true }]);
    } finally {
      setSending(false);
    }
  }

  function clearThread() {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <>
      {/* Launcher — hidden while the panel is open (the panel has its own ✕). */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-launcher"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ask about the cars on the board"
            title="Ask the board"
            className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            role="dialog"
            aria-label="Site assistant"
            className="fixed inset-x-3 bottom-3 z-50 flex h-[min(70dvh,32rem)] flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[24rem]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  0–100 · Assistant
                </p>
                <p className="truncate font-display text-lg tracking-tight">
                  Ask the board<span className="text-primary">.</span>
                </p>
              </div>
              <div className="flex items-center">
                {messages.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={clearThread}
                    aria-label="Clear conversation"
                    title="Clear conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col justify-end gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ask about the cars on the board — their 0–100 times, specs,
                    rankings, or how any two compare.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => void send(starter)}
                        disabled={sending}
                        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-md px-3 py-2 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-secondary/60 text-foreground",
                      message.error && "border-destructive/50 text-destructive"
                    )}
                  >
                    {message.role === "assistant" && !message.error
                      ? linkifyReply(message.content)
                      : message.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-3 py-2.5"
                    aria-label="The assistant is thinking"
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="border-t border-border p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about a car on the board…"
                  maxLength={MAX_INPUT_CHARS}
                  disabled={sending}
                  autoFocus
                  aria-label="Your question"
                  className="h-10 flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                Answers cover this board only
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
