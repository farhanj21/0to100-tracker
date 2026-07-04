import { NextResponse } from "next/server";
import { z } from "zod";
import { geminiChat, isGeminiConfigured, type GeminiTurn } from "@/lib/gemini";
import { buildChatSystemInstruction } from "@/lib/chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Hard caps on what a client may send. They exist to protect the free Gemini
// quota (and to keep prompts lean), so the server enforces them — the widget's
// own limits are just UX.
const MAX_TURNS = 16;
const MAX_MESSAGE_CHARS = 500;
const MAX_TOTAL_CHARS = 8_000;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
      })
    )
    .min(1)
    .max(MAX_TURNS),
});

/**
 * Best-effort, zero-infrastructure rate limiting: a sliding one-minute window
 * per client plus a global cap that shields the shared free-tier quota no
 * matter how many clients chat at once. In-memory on purpose — it costs
 * nothing, and resetting on redeploy/cold start is acceptable for a guard
 * whose real backstop is Gemini's own 429.
 */
const WINDOW_MS = 60_000;
const PER_CLIENT_MAX = 8;
const GLOBAL_MAX = 20;
const hits = new Map<string, number[]>();

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  let globalCount = 0;
  // Prune expired entries on every call so the map can't grow unbounded.
  for (const [key, times] of hits) {
    const fresh = times.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else {
      hits.set(key, fresh);
      globalCount += fresh.length;
    }
  }
  const mine = hits.get(clientKey) ?? [];
  if (mine.length >= PER_CLIENT_MAX || globalCount >= GLOBAL_MAX) return true;
  mine.push(now);
  hits.set(clientKey, mine);
  return false;
}

// POST /api/chat — the public site assistant. Grounds Gemini (free tier) in a
// fresh snapshot of the board and returns a plain-text reply. Read-only and
// public, like viewing the leaderboard itself.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Messages must be 1–${MAX_TURNS} turns of at most ${MAX_MESSAGE_CHARS} characters each.` },
        { status: 400 }
      );
    }

    const { messages } = parsed.data;
    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "The last message must be from the user." },
        { status: 400 }
      );
    }
    const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: "This conversation is too long — clear the chat and start fresh." },
        { status: 400 }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error:
            "The assistant isn't configured. Add a free GEMINI_API_KEY to .env.local (no card needed — https://aistudio.google.com/apikey).",
        },
        { status: 503 }
      );
    }

    const clientKey = (request.headers.get("x-forwarded-for") ?? "local")
      .split(",")[0]
      .trim();
    if (isRateLimited(clientKey)) {
      return NextResponse.json(
        { error: "Taking a quick breather to stay inside the free tier — try again in a minute." },
        { status: 429 }
      );
    }

    // Gemini conversations must open with a user turn; drop any stray leading
    // assistant bubbles a client might send. (The last turn is user-validated,
    // so a first user turn always exists.)
    const firstUser = messages.findIndex((m) => m.role === "user");
    const turns: GeminiTurn[] = messages.slice(firstUser).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      text: m.content,
    }));

    const system = await buildChatSystemInstruction();
    const reply = await geminiChat(system, turns);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("POST /api/chat failed:", err);
    const message =
      err instanceof Error ? err.message : "The assistant hit a snag. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
