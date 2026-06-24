"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn, formatTime } from "@/lib/utils";
import type { CategoryStat } from "@/lib/stats";

/**
 * A labelled "fastest by X" breakdown: each group is a row showing how many
 * cars fall in it (a bar sized by share) and that group's quickest time, which
 * links into the car. Columns are headed so the two numbers never read as the
 * cryptic "5 · 7.12s". The accent marks the group holding the field's leader.
 */
export function Breakdown({
  rows,
  leaderId,
}: {
  rows: CategoryStat[];
  /** The overall-quickest car's id — its group is highlighted. */
  leaderId?: string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-3 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="w-28 shrink-0 sm:w-44">Group</span>
        <span className="flex-1">Cars</span>
        <span className="w-24 shrink-0 text-right">Quickest</span>
      </div>

      {rows.map((r, i) => {
        const leads = r.quickest.id === leaderId;
        const pct = Math.max(3, (r.count / max) * 100);
        return (
          <div
            key={r.label}
            className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-0"
          >
            <span
              className={cn(
                "w-28 shrink-0 truncate text-sm sm:w-44",
                leads ? "font-medium text-foreground" : "text-foreground"
              )}
            >
              {r.label}
            </span>

            <div className="flex flex-1 items-center gap-2.5">
              <div className="relative h-2.5 flex-1 bg-secondary/60">
                <motion.div
                  className={cn(
                    "absolute inset-y-0 left-0 origin-left",
                    leads ? "bg-primary" : "bg-foreground/70"
                  )}
                  style={{ width: `${pct}%` }}
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={reduce ? undefined : { scaleX: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                    delay: Math.min(i * 0.05, 0.4),
                  }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {r.count}
              </span>
            </div>

            <Link
              href={`/cars/${r.quickest.slug}`}
              className="group w-24 shrink-0 text-right"
            >
              <span
                className={cn(
                  "font-mono text-sm tabular-nums underline-offset-2 group-hover:underline",
                  leads ? "font-bold text-primary" : "text-foreground"
                )}
              >
                {formatTime(r.quickest.zeroToHundred)}
                <span className="font-normal text-muted-foreground"> s</span>
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
