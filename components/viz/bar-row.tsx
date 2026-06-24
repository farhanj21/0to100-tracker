"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A flat, tokenized horizontal bar — label · bar · value — shared by every
 * breakdown on the numbers page so they read as one family. Sharp, no track
 * rounding, accent reserved for the highlighted (leading) row. The fill sweeps
 * in from the left the first time it scrolls into view.
 */
export function BarRow({
  label,
  value,
  max,
  valueLabel,
  highlight = false,
  index = 0,
}: {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  highlight?: boolean;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const pct = max > 0 && value > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:w-40">
        {label}
      </span>
      <div className="relative h-2.5 flex-1 bg-secondary/60">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 origin-left",
            highlight ? "bg-primary" : "bg-foreground/70"
          )}
          style={{ width: `${pct}%` }}
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={reduce ? undefined : { scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: Math.min(index * 0.04, 0.4),
          }}
        />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums">
        {valueLabel}
      </span>
    </div>
  );
}
