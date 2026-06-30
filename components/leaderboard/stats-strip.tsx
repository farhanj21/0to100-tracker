import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { LeaderboardStats } from "@/lib/stats";

/**
 * The home "By the numbers" teaser: a few punchy figures touching each theme,
 * the whole band linking through to the full /numbers page.
 */
export function StatsStrip({ stats }: { stats: LeaderboardStats }) {
  const cells = [
    { label: "Quickest", value: formatTime(stats.quickest.zeroToHundred) },
    { label: "Average", value: formatTime(stats.mean) },
    { label: "Median", value: formatTime(stats.median) },
    { label: "Spread", value: formatTime(stats.spread) },
  ];

  return (
    <Link
      href="/numbers"
      className="group block border-y border-border py-5 transition-colors hover:border-foreground/30"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          By the numbers
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-primary">
          All the numbers
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="text-center">
            <div className="font-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
              {c.value}
              <span className="ml-0.5 text-base font-normal text-muted-foreground">
                s
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {stats.powertrains.map((p, i) => (
          <span key={p.type}>
            {i > 0 && <span className="mr-2 text-muted-foreground/40">·</span>}
            <span className="text-foreground">{p.count}</span> {p.type}
          </span>
        ))}
      </div>
    </Link>
  );
}
