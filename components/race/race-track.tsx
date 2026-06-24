"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Flag, RotateCcw, Trophy } from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { cn, formatTime, carTitle } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/**
 * Lane colours, assigned by selection order. Lane 0 takes the app's primary
 * accent (the recurring "best/leader" colour); the rest are fixed hues picked to
 * stay legible in both light and dark themes. Cars have no colour of their own,
 * so this is purely positional.
 */
const LANE_COLORS = [
  "hsl(var(--primary))",
  "hsl(28 85% 52%)",
  "hsl(160 60% 42%)",
];

type Phase = "idle" | "running" | "done";

/**
 * Watches a set of cars run 0–100 km/h in real time: one dot per lane travels
 * left→right, taking each car's true `zeroToHundred` seconds to reach the finish.
 * All lanes share a single clock and launch together, so the quicker car visibly
 * arrives first. Honours reduced-motion by rendering the finished state outright.
 */
export function RaceTrack({ cars }: { cars: CarDTO[] }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // 0→1 per lane, plus a shared elapsed clock (seconds). Driven by one rAF loop.
  const [progress, setProgress] = useState<number[]>(() => cars.map(() => 0));
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  // Bumping this re-arms the effect below, restarting the run. Starts at 1 so the
  // race auto-plays on mount — landing on the page shows the dots travelling.
  const [runId, setRunId] = useState(1);

  const times = useMemo(() => cars.map((c) => c.zeroToHundred), [cars]);
  const slowest = useMemo(() => Math.max(...times), [times]);
  // The quickest car (lowest time) reaches the finish first — the winner.
  const winnerIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < times.length; i++) if (times[i] < times[best]) best = i;
    return best;
  }, [times]);

  // Responsive track width — same ResizeObserver approach as the distribution plot.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setTrackWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // The run itself. Re-runs whenever runId changes (Replay) or motion pref flips.
  useEffect(() => {
    if (runId === 0) return; // don't auto-play on mount; wait for Start/Replay

    if (reduce) {
      // Snap everything to the finish — no animation, but the result is shown.
      setProgress(cars.map(() => 1));
      setElapsed(slowest);
      setPhase("done");
      return;
    }

    let raf = 0;
    let start = 0;
    setPhase("running");

    const tick = (now: number) => {
      if (!start) start = now;
      const secs = (now - start) / 1000;
      setElapsed(Math.min(secs, slowest));
      setProgress(times.map((t) => Math.min(1, secs / t)));
      if (secs < slowest) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(times.map(() => 1));
        setPhase("done");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // cars/times/slowest are stable for a given id set; runId drives re-runs.
  }, [runId, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const single = cars.length === 1;
  const started = phase !== "idle";
  // Dot travel distance: leave room so the dot's leading edge meets the finish.
  const DOT = 22;
  const travel = Math.max(0, trackWidth - DOT);

  return (
    <div className="space-y-5">
      {/* Header: title + live clock + controls */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-2">
        <h2 className="font-display text-3xl">
          {single ? "0–100 visualized" : "The Race"}
        </h2>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {elapsed.toFixed(2)}s
          </span>
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {started ? (
              <>
                <RotateCcw className="h-3 w-3" /> {single ? "Replay" : "Race again"}
              </>
            ) : (
              <>
                <Flag className="h-3 w-3" /> {single ? "Play" : "Start race"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lanes */}
      <div ref={trackRef} className="space-y-3">
        {cars.map((car, i) => {
          const p = progress[i] ?? 0;
          const speed = Math.round(p * 100);
          const finished = p >= 1;
          const isWinner = !single && finished && i === winnerIdx;
          const color = LANE_COLORS[i % LANE_COLORS.length];

          return (
            <div
              key={car.id}
              className="border border-border bg-card p-3 sm:p-4"
            >
              {/* Lane label row */}
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: color }}
                  />
                  <CarThumb
                    car={car}
                    transform={{ w: 80, h: 52 }}
                    className="hidden h-8 w-12 shrink-0 rounded-sm sm:block"
                  />
                  <span className="truncate font-medium">{carTitle(car)}</span>
                  {isWinner && (
                    <span className="inline-flex shrink-0 items-center gap-1 bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                      <Trophy className="h-3 w-3" /> Winner
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right font-mono tabular-nums">
                  {finished ? (
                    <span className="text-sm font-semibold">
                      {formatTime(car.zeroToHundred)}s
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {speed} km/h
                    </span>
                  )}
                </div>
              </div>

              {/* Track */}
              <div className="relative h-9">
                {/* Rail */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />
                {/* Start line */}
                <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />
                {/* Finish line */}
                <div className="absolute bottom-0 right-0 top-0 flex w-px items-center bg-foreground">
                  <Flag className="absolute -right-0.5 -top-3 h-3.5 w-3.5 text-foreground" />
                </div>
                {/* Travelling dot */}
                <div
                  className={cn(
                    "absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full ring-2 ring-background",
                    phase === "running" && "shadow-lg"
                  )}
                  style={{
                    left: 0,
                    backgroundColor: color,
                    transform: `translate(${p * travel}px, -50%)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {single
          ? "The dot crosses in the car's real 0–100 time."
          : "All cars launch together in real time — quickest to 100 km/h wins."}
      </p>
    </div>
  );
}
