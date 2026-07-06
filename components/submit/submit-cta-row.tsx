import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The quiet public entry point at the bottom of the board: styled like a
 * leaderboard row that hasn't earned its place yet — dashed border, muted,
 * rank cell showing "—". Reads as "the next entry could be yours" rather
 * than an ad.
 */
export function SubmitCtaRow() {
  return (
    <Link
      href="/submit"
      className="group mt-3 flex items-center gap-3 border border-dashed border-border px-3 py-4 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:px-4"
    >
      <span
        aria-hidden
        className="w-8 shrink-0 text-center font-mono text-sm sm:w-10"
      >
        —
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.18em]">
        Think your car belongs here?
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors group-hover:text-primary">
        Submit a run
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
