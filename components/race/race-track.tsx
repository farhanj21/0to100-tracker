"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Flag, RotateCcw, Trophy, BarChart2, AlignLeft } from "lucide-react";
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // 0→1 per lane, plus a shared elapsed clock (seconds). Driven by one rAF loop.
  const [progress, setProgress] = useState<number[]>(() => cars.map(() => 0));
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  // Bumping this re-arms the effect below, restarting the run. Starts at 1 so the
  // race auto-plays on mount — landing on the page shows the dots travelling.
  const [runId, setRunId] = useState(1);
  // "Race all" can be experienced two ways; the graph leads since it conveys
  // speed best, but the dense lanes give the familiar side-by-side dot race.
  const [graphView, setGraphView] = useState(true);

  const times = useMemo(() => cars.map((c) => c.zeroToHundred), [cars]);
  const slowest = useMemo(() => Math.max(...times), [times]);
  // The quickest car (lowest time) reaches the finish first — the winner.
  const winnerIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < times.length; i++) if (times[i] < times[best]) best = i;
    return best;
  }, [times]);

  // Responsive track width for the horizontal lanes (graph mode uses CSS % and
  // doesn't need it). Measured on the first lane's track — all lanes match.
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

  const title = minimal
    ? `The Race · ${cars.length} cars`
    : single
      ? "0–100 visualized"
      : "The Race";

  return (
    <div className="space-y-5">
      {/* Header: title + live clock + controls */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-2">
        <h2 className="font-display text-3xl">{title}</h2>
        <div className="flex items-center gap-3">
          {minimal && (
            <RaceViewToggle graph={graphView} onChange={setGraphView} />
          )}
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {elapsed.toFixed(2)}s
          </span>
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
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

      {minimal ? (
        graphView ? (
          <RaceGraph
            cars={cars}
            times={times}
            progress={progress}
            winnerIdx={winnerIdx}
          />
        ) : (
          <RaceLanesMini
            cars={cars}
            times={times}
            progress={progress}
            winnerIdx={winnerIdx}
            trackWidth={trackWidth}
            trackRef={trackRef}
          />
        )
      ) : (
        <Lanes
          cars={cars}
          times={times}
          progress={progress}
          phase={phase}
          single={single}
          winnerIdx={winnerIdx}
          trackWidth={trackWidth}
          trackRef={trackRef}
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
              const p = progress[i] ?? 0; // also the speed fraction (0–1)
              const finished = p >= 1;
              const isWinner = i === winnerIdx;
              const color = laneColor(i, cars.length, true);
              const at = `${p * 100}%`;

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
              className="flex h-20 min-w-0 flex-1 justify-center"
            >
              <span
                title={`${carTitle(car)} — ${formatTime(times[i])}s`}
                style={{ writingMode: "vertical-rl" }}
                className={cn(
                  "max-h-20 overflow-hidden text-ellipsis whitespace-nowrap pt-1 text-[10px]",
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
    <div className="inline-flex divide-x divide-border border border-border bg-card">
      {options.map((opt) => {
        const active = graph === opt.graph;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.graph)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="h-3 w-3" />
            {opt.label}
          </button>
        );
      })}
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
  trackRef,
}: {
  cars: CarDTO[];
  times: number[];
  progress: number[];
  winnerIdx: number;
  trackWidth: number;
  trackRef: React.RefObject<HTMLDivElement>;
}) {
  const DOT = 13;
  const travel = Math.max(0, trackWidth - DOT);

  return (
    <div className="space-y-2">
      <div className="divide-y divide-border/60 border-y border-border">
        {cars.map((car, i) => {
          const p = progress[i] ?? 0;
          const speed = Math.round(p * 100);
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
                ref={i === 0 ? trackRef : undefined}
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
                    transform: `translate(${p * travel}px, -50%)`,
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
  trackRef,
}: {
  cars: CarDTO[];
  times: number[];
  progress: number[];
  phase: Phase;
  single: boolean;
  winnerIdx: number;
  trackWidth: number;
  trackRef: React.RefObject<HTMLDivElement>;
}) {
  const DOT = 18;
  const travel = Math.max(0, trackWidth - DOT);

  return (
    <>
      <div className="space-y-3">
        {cars.map((car, i) => {
          const p = progress[i] ?? 0;
          const speed = Math.round(p * 100);
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
                ref={i === 0 ? trackRef : undefined}
                className="relative h-9"
              >
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />
                <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />
                <div className="absolute bottom-0 right-0 top-0 flex w-px items-center bg-foreground">
                  <Flag className="absolute -right-0.5 -top-3 h-3.5 w-3.5 text-foreground" />
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
    </>
  );
}
