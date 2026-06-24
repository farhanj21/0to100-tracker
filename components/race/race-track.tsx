"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Flag,
  RotateCcw,
  Trophy,
  BarChart2,
  AlignLeft,
  ListChecks,
  Check,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { cn, formatTime, carTitle } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/**
 * Lane colours for a small field (≤3), assigned by selection order. Lane 0 takes
 * the app's primary accent (the recurring "best/leader" colour); the rest are
 * fixed hues that stay legible in both themes. The "race all" graph spreads hues
 * evenly across the field instead (see `laneColor`).
 */
const LANE_COLORS = [
  "hsl(var(--primary))",
  "hsl(28 85% 52%)",
  "hsl(160 60% 42%)",
];

function laneColor(i: number, count: number, spread: boolean): string {
  if (!spread) return LANE_COLORS[i % LANE_COLORS.length];
  // Even hue ramp so dozens of bars stay distinguishable at a glance.
  const hue = Math.round((i * 320) / Math.max(1, count));
  return `hsl(${hue} 70% 50%)`;
}

/**
 * Drag-race launch physics. The rAF clock gives each dot a time fraction
 * `t = elapsed / T` (T = the car's real 0–100 time). We don't move the dot by
 * `t` directly — that's constant speed. Instead a concave velocity curve
 * `v(t) = 1 − (1−t)^LAUNCH` models a hard launch easing toward 100 km/h, and the
 * dot's screen position is the integral of that velocity (distance covered).
 * Both are 0 at t=0 and exactly 1 at t=1, so every real 0–100 time is preserved
 * and `distFrac′ ∝ speedFrac` — the dot's on-screen speed IS its velocity.
 */
const LAUNCH = 2.2; // launch accel ≈ LAUNCH× the average; >1 = harder off the line

/** Instantaneous speed as a fraction of 100 km/h at time-fraction t (0..1). */
function speedFrac(t: number): number {
  return 1 - Math.pow(1 - t, LAUNCH);
}

/** Distance covered as a fraction of the whole run at time-fraction t (0..1). */
function distFrac(t: number): number {
  const k = LAUNCH;
  return ((k + 1) * t + Math.pow(1 - t, k + 1) - 1) / k;
}

type Phase = "idle" | "running" | "done";

/**
 * Watches a set of cars run 0–100 km/h in real time. All lanes share one clock
 * and launch together, so the quicker car visibly finishes first. Honours
 * reduced-motion by rendering the finished state outright.
 *
 * Two layouts:
 *  - default (1–3 cars): horizontal lanes, a dot crossing left→right.
 *  - `minimal` ("Race all"): a time-vs-car graph — time on the Y axis, one car
 *    per column on the X axis — sized to fit the whole field on screen with no
 *    scrolling. A sweep descends in real time; each bar locks when it's reached
 *    its car's 0–100 time, so the shortest bar is the quickest car.
 */
export function RaceTrack({
  cars,
  minimal = false,
}: {
  cars: CarDTO[];
  minimal?: boolean;
}) {
  const reduce = useReducedMotion();
  const roRef = useRef<ResizeObserver | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // Callback ref so the observer (re)attaches whenever the measured track
  // mounts. This matters when toggling into the Lanes view: that element
  // doesn't exist until the user switches to it, so a mount-only effect would
  // never measure it and the dots would sit at travel = 0.
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    setTrackWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    ro.observe(el);
    roRef.current = ro;
  }, []);

  // 0→1 per lane, plus a shared elapsed clock (seconds). Driven by one rAF loop.
  const [progress, setProgress] = useState<number[]>(() => cars.map(() => 0));
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  // Bumping this re-arms the effect below, restarting the run. Starts at 1 so the
  // race auto-plays on mount — landing on the page shows the dots travelling.
  const [runId, setRunId] = useState(1);
  // "Race all" can be experienced two ways; the dense lanes lead (the dot's
  // motion is true velocity, so it keeps accelerating), with the speed-vs-time
  // graph a click away.
  const [graphView, setGraphView] = useState(false);
  // "Race all" only: ids the user has unchecked, so they sit out the race.
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [pickerOpen, setPickerOpen] = useState(false);

  // The cars actually on the grid. In "Race all" the picker can drop some;
  // otherwise it's the full passed-in set.
  const racedCars = useMemo(
    () => (minimal ? cars.filter((c) => !excluded.has(c.id)) : cars),
    [cars, excluded, minimal]
  );
  // Identity of the current grid — toggling a car restarts the run (see effect).
  const racedKey = useMemo(() => racedCars.map((c) => c.id).join(","), [racedCars]);

  const times = useMemo(() => racedCars.map((c) => c.zeroToHundred), [racedCars]);
  const slowest = useMemo(() => Math.max(...times), [times]);
  // The quickest car (lowest time) reaches the finish first — the winner.
  const winnerIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < times.length; i++) if (times[i] < times[best]) best = i;
    return best;
  }, [times]);

  const toggleCar = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAll = () => setExcluded(new Set());
  const selectNone = () => setExcluded(new Set(cars.map((c) => c.id)));

  // The run itself. Re-runs whenever runId changes (Replay) or motion pref flips.
  useEffect(() => {
    if (runId === 0) return; // don't auto-play on mount; wait for Start/Replay

    if (racedCars.length === 0) {
      // Nothing selected — clear the grid and idle.
      setProgress([]);
      setElapsed(0);
      setPhase("idle");
      return;
    }

    if (reduce) {
      // Snap everything to the finish — no animation, but the result is shown.
      setProgress(racedCars.map(() => 1));
      setElapsed(slowest);
      setPhase("done");
      return;
    }

    let raf = 0;
    let start = 0;
    setProgress(racedCars.map(() => 0));
    setElapsed(0);
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
    // racedKey makes toggling a car restart the run with the new grid.
  }, [runId, reduce, racedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const single = racedCars.length === 1;

  const title = minimal
    ? `The Race · ${racedCars.length} cars`
    : single
      ? "0–100 visualized"
      : "The Race";

  return (
    <div className="space-y-5">
      {/* Header: title + live clock + controls */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-2">
        <h2 className="hidden font-display text-2xl sm:block sm:text-3xl">{title}</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {minimal && (
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              aria-pressed={pickerOpen}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                pickerOpen
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <ListChecks className="h-3 w-3" />
              Cars {racedCars.length}/{cars.length}
            </button>
          )}
          {minimal && (
            <RaceViewToggle graph={graphView} onChange={setGraphView} />
          )}
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {elapsed.toFixed(2)}s
          </span>
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex shrink-0 items-center gap-1.5 border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {phase !== "idle" ? (
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

      {minimal && pickerOpen && (
        <CarPicker
          cars={cars}
          excluded={excluded}
          onToggle={toggleCar}
          onAll={selectAll}
          onNone={selectNone}
        />
      )}

      {minimal ? (
        racedCars.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 border border-dashed border-border bg-card py-16 text-center">
            <ListChecks className="mb-1 h-6 w-6 text-muted-foreground" />
            <p className="font-display text-xl">No cars selected</p>
            <p className="text-sm text-muted-foreground">
              Open{" "}
              <span className="font-medium text-foreground">Cars</span> and pick at
              least one to race.
            </p>
          </div>
        ) : graphView ? (
          <RaceGraph
            cars={racedCars}
            times={times}
            progress={progress}
            winnerIdx={winnerIdx}
          />
        ) : (
          <RaceLanesMini
            cars={racedCars}
            times={times}
            progress={progress}
            winnerIdx={winnerIdx}
            trackWidth={trackWidth}
            measureRef={measureRef}
          />
        )
      ) : (
        <Lanes
          cars={racedCars}
          times={times}
          progress={progress}
          phase={phase}
          single={single}
          winnerIdx={winnerIdx}
          trackWidth={trackWidth}
          measureRef={measureRef}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graph layout — time (Y) vs cars (X), the whole field on one screen */
/* ------------------------------------------------------------------ */

function RaceGraph({
  cars,
  times,
  progress,
  winnerIdx,
}: {
  cars: CarDTO[];
  times: number[];
  progress: number[];
  winnerIdx: number;
}) {
  // Y axis is SPEED (km/h): 0 at the bottom → 100 at the top. Encoding speed
  // (not elapsed time) is what restores the race — each dot climbs at its own
  // rate, so the quicker car visibly pulls away and tops out first.
  const ticks = [0, 25, 50, 75, 100];
  const slowestIdx = useMemo(() => {
    let w = 0;
    for (let i = 1; i < times.length; i++) if (times[i] > times[w]) w = i;
    return w;
  }, [times]);
  const DOT = cars.length > 18 ? 8 : 11;
  // Short label (with the result time) that survives the narrow, rotated cells.
  const label = (car: CarDTO, i: number) =>
    `${car.manufacturer} ${car.carModel} · ${formatTime(times[i])}s`;

  return (
    <div className="space-y-2">
      <div
        className="flex w-full"
        // Bounded so the chart + labels + page chrome fit without scrolling.
        style={{ height: "min(52vh, 480px)" }}
      >
        {/* Y axis (speed) labels — 0 at the bottom, 100 at the top */}
        <div className="relative w-10 shrink-0">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-1.5 translate-y-1/2 font-mono text-[10px] tabular-nums text-muted-foreground"
              style={{ bottom: `${t}%` }}
            >
              {t}
            </span>
          ))}
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            km/h
          </span>
        </div>

        {/* Plot area — bottom border is the 0 km/h baseline */}
        <div className="relative flex-1 border-b border-l border-foreground/60">
          {/* Gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className="absolute inset-x-0 border-t border-border/50"
              style={{ bottom: `${t}%` }}
            />
          ))}

          {/* Columns — one car each; the dot climbs from 0 → 100 km/h */}
          <div className="absolute inset-0 flex items-stretch">
            {cars.map((car, i) => {
              const p = progress[i] ?? 0; // time fraction (0–1)
              const finished = p >= 1;
              const isWinner = i === winnerIdx;
              const color = laneColor(i, cars.length, true);
              // Y is the car's instantaneous speed (concave launch curve).
              const at = `${speedFrac(p) * 100}%`;

              return (
                <div
                  key={car.id}
                  title={`${carTitle(car)} — ${formatTime(times[i])}s`}
                  className="group relative h-full flex-1"
                >
                  {/* Trail: from the 0 km/h baseline up to the dot */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-sm transition-opacity"
                    style={{
                      height: at,
                      width: cars.length > 24 ? 3 : 5,
                      backgroundColor: color,
                      opacity: finished ? 0.85 : 0.5,
                    }}
                  />
                  {/* Climbing dot — its rate of climb IS the car's speed */}
                  <div
                    className="absolute left-1/2 rounded-full ring-1 ring-background"
                    style={{
                      bottom: at,
                      width: DOT,
                      height: DOT,
                      backgroundColor: color,
                      transform: "translate(-50%, 50%)",
                    }}
                  />
                  {/* Winner marker, planted at 100 km/h when it tops out first */}
                  {finished && isWinner && (
                    <Trophy className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-[130%] text-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis — a rotated car label (with its 0–100 time) under each column */}
      <div className="flex">
        <div className="w-10 shrink-0" />
        <div className="flex flex-1">
          {cars.map((car, i) => (
            <div
              key={car.id}
              className="flex h-20 min-w-0 flex-1 justify-center overflow-hidden"
            >
              <span
                title={`${carTitle(car)} — ${formatTime(times[i])}s`}
                style={{ writingMode: "vertical-rl" }}
                className={cn(
                  "max-h-20 overflow-hidden text-ellipsis whitespace-nowrap pt-1 text-[10px] leading-none",
                  i === winnerIdx
                    ? "font-semibold text-primary"
                    : "text-muted-foreground"
                )}
              >
                {label(car, i)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="pl-10 text-sm text-muted-foreground">
        Each dot climbs to 100 km/h in real time — quickest{" "}
        <span className="font-semibold text-foreground">
          {carTitle(cars[winnerIdx])}
        </span>{" "}
        at {formatTime(times[winnerIdx])}s · slowest{" "}
        <span className="font-medium text-foreground">
          {carTitle(cars[slowestIdx])}
        </span>{" "}
        at {formatTime(times[slowestIdx])}s
      </p>
    </div>
  );
}

/** Segmented Graph / Lanes switch for the "Race all" view. */
function RaceViewToggle({
  graph,
  onChange,
}: {
  graph: boolean;
  onChange: (graph: boolean) => void;
}) {
  const options: { graph: boolean; label: string; icon: typeof BarChart2 }[] = [
    { graph: true, label: "Graph", icon: BarChart2 },
    { graph: false, label: "Lanes", icon: AlignLeft },
  ];
  return (
    <div className="inline-flex shrink-0 divide-x divide-border border border-border bg-card">
      {options.map((opt) => {
        const active = graph === opt.graph;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.graph)}
            aria-pressed={active}
            title={opt.label}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Checklist of every car in the field — toggle which ones are on the grid. */
function CarPicker({
  cars,
  excluded,
  onToggle,
  onAll,
  onNone,
}: {
  cars: CarDTO[];
  excluded: Set<string>;
  onToggle: (id: string) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  const active = cars.length - excluded.size;
  return (
    <div className="space-y-2 border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {active} of {cars.length} racing
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAll}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            All
          </button>
          <span aria-hidden className="text-border">
            |
          </span>
          <button
            type="button"
            onClick={onNone}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            None
          </button>
        </div>
      </div>
      <div className="max-h-60 divide-y divide-border/60 overflow-y-auto border-y border-border/60">
        {cars.map((car) => {
          const on = !excluded.has(car.id);
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => onToggle(car.id)}
              aria-pressed={on}
              className={cn(
                "flex w-full items-center gap-2.5 px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-secondary/40",
                !on && "opacity-55"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center border",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                )}
              >
                {on && <Check className="h-3 w-3" />}
              </span>
              <span className={cn("min-w-0 flex-1 truncate", on && "font-medium")}>
                {carTitle(car)}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {formatTime(car.zeroToHundred)}s
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dense lanes — horizontal dot race for the whole "Race all" field    */
/* ------------------------------------------------------------------ */

function RaceLanesMini({
  cars,
  times,
  progress,
  winnerIdx,
  trackWidth,
  measureRef,
}: {
  cars: CarDTO[];
  times: number[];
  progress: number[];
  winnerIdx: number;
  trackWidth: number;
  measureRef: (el: HTMLDivElement | null) => void;
}) {
  const DOT = 13;
  const travel = Math.max(0, trackWidth - DOT);

  return (
    <div className="space-y-2">
      <div className="divide-y divide-border/60 border-y border-border">
        {cars.map((car, i) => {
          const p = progress[i] ?? 0;
          // Cap at 99 while running: the curve nears 100 asymptotically, so a
          // plain round would read "100" well before the dot reaches the line.
          // 100 is implied by the finish (which swaps the readout to the time).
          const speed = Math.min(99, Math.floor(speedFrac(p) * 100));
          const finished = p >= 1;
          const isWinner = i === winnerIdx;
          const color = laneColor(i, cars.length, true);

          return (
            <div
              key={car.id}
              className="grid grid-cols-[7rem_1fr_2.75rem] items-center gap-2 py-1 sm:grid-cols-[13rem_1fr_3.25rem] sm:gap-3"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {isWinner && <Trophy className="h-3 w-3 shrink-0 text-primary" />}
                <span
                  className={cn("truncate text-xs", isWinner && "font-semibold")}
                >
                  {carTitle(car)}
                </span>
              </div>

              {/* Track */}
              <div
                ref={i === 0 ? measureRef : undefined}
                className="relative h-6"
              >
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />
                <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />
                <div className="absolute bottom-0 right-0 top-0 w-px bg-foreground" />
                <div
                  className="absolute top-1/2 rounded-full ring-1 ring-background"
                  style={{
                    left: 0,
                    width: DOT,
                    height: DOT,
                    backgroundColor: color,
                    transform: `translate(${distFrac(p) * travel}px, -50%)`,
                  }}
                />
              </div>

              <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                {finished ? `${formatTime(times[i])}s` : `${speed}`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Every car launches together in real time — the leading dot is quickest to 100 km/h.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lane layout — horizontal dot race, for a small (1–3 car) field      */
/* ------------------------------------------------------------------ */

function Lanes({
  cars,
  times,
  progress,
  phase,
  single,
  winnerIdx,
  trackWidth,
  measureRef,
}: {
  cars: CarDTO[];
  times: number[];
  progress: number[];
  phase: Phase;
  single: boolean;
  winnerIdx: number;
  trackWidth: number;
  measureRef: (el: HTMLDivElement | null) => void;
}) {
  const DOT = 18;
  const travel = Math.max(0, trackWidth - DOT);

  return (
    <>
      <div className="space-y-3">
        {cars.map((car, i) => {
          const p = progress[i] ?? 0;
          // Cap at 99 while running: the curve nears 100 asymptotically, so a
          // plain round would read "100" well before the dot reaches the line.
          // 100 is implied by the finish (which swaps the readout to the time).
          const speed = Math.min(99, Math.floor(speedFrac(p) * 100));
          const finished = p >= 1;
          const isWinner = !single && finished && i === winnerIdx;
          const color = laneColor(i, cars.length, false);

          return (
            <div key={car.id} className="border border-border bg-card p-3 sm:p-4">
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
                      {formatTime(times[i])}s
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {speed} km/h
                    </span>
                  )}
                </div>
              </div>

              {/* Track */}
              <div
                ref={i === 0 ? measureRef : undefined}
                className="relative h-9"
              >
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />
                <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />
                <div className="absolute bottom-0 right-0 top-0 flex w-px items-center bg-foreground">
                </div>
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 rounded-full ring-2 ring-background",
                    phase === "running" && "shadow-lg"
                  )}
                  style={{
                    left: 0,
                    width: DOT,
                    height: DOT,
                    backgroundColor: color,
                    transform: `translate(${distFrac(p) * travel}px, -50%)`,
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
    </>
  );
}
