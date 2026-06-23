"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn, accelFill } from "@/lib/utils";

/** The 0→100 acceleration motif: a fill bar where quicker cars read fuller. */
export function AccelBar({
  seconds,
  accent = false,
  showScale = false,
  className,
}: {
  seconds: number;
  accent?: boolean;
  showScale?: boolean;
  className?: string;
}) {
  const fill = accelFill(seconds);
  const reduce = useReducedMotion();

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${fill * 100}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "h-full rounded-full",
            accent ? "bg-primary" : "bg-foreground/70"
          )}
        />
      </div>
      {showScale && (
        <div className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>0</span>
          <span>100 km/h</span>
        </div>
      )}
    </div>
  );
}
