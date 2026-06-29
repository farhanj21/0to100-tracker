"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 4;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: CODE_LENGTH }, () => "")
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const passcode = digits.join("");

  function focusInput(index: number) {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }

  function setDigitsAndClearError(nextDigits: string[]) {
    setDigits(nextDigits);
    if (error) setError(null);
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigitsAndClearError(nextDigits);
    if (index < CODE_LENGTH - 1) focusInput(index + 1);
    maybeAutoSubmit(nextDigits);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const nextDigits = [...digits];
      if (nextDigits[index]) {
        nextDigits[index] = "";
        setDigitsAndClearError(nextDigits);
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        setDigitsAndClearError(nextDigits);
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const nextDigits = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? "");
    setDigitsAndClearError(nextDigits);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
    maybeAutoSubmit(nextDigits);
  }

  // Submit as soon as all four digits are present, without waiting for the
  // button. Reads the freshly-built digits (state updates are async) and guards
  // against firing while a request is already in flight.
  function maybeAutoSubmit(nextDigits: string[]) {
    const code = nextDigits.join("");
    if (code.length === CODE_LENGTH && !submitting) submitCode(code);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitCode(passcode);
  }

  async function submitCode(code: string) {
    if (code.length !== CODE_LENGTH || submitting) return;
    const passcode = code;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Login failed");
      }
      toast.success("Signed in");
      router.replace(next);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      setSubmitting(false);
      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      focusInput(0);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Restricted · 0–100
          </p>
          <h1 className="mt-1.5 font-display text-3xl tracking-tight">Admin Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the passcode to add, edit, or delete cars.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode-0">Passcode</Label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  id={`passcode-${index}`}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  autoFocus={index === 0}
                  aria-label={`Digit ${index + 1}`}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={(e) => e.target.select()}
                  className={cn(
                    "h-16 w-14 rounded-xl border border-input bg-background text-center text-2xl font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive"
                  )}
                  disabled={submitting}
                />
              ))}
            </div>
            {error && <p className="text-center text-xs text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || passcode.length !== CODE_LENGTH}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
