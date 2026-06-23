"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Counts up from 0.00 to `value` once on mount — the "completed launch run"
 * motif for 0–100 times. Honors reduced-motion by snapping to the final value.
 */
export function CountUp({
  value,
  decimals = 2,
  durationMs = 1100,
  className,
}: {
  value: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let start = 0;
    setDisplay(0);
    // easeOutQuart — smooth deceleration that settles cleanly onto the value.
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);

    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(value * ease(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduce]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}
