"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scaleLinear } from "d3-scale";
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import { cn, carTitle, formatTime } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

const HEIGHT = 116;
const PAD_X = 14;
const RADIUS = 4.5;
const HOVER_RADIUS = 6.5;

interface PlotNode extends SimulationNodeDatum {
  id: string;
  slug: string;
  time: number;
  title: string;
}

/**
 * A one-axis distribution (beeswarm) of the field's 0–100 times: slower on the
 * left, quicker on the right, the global leader marked in the accent. It mirrors
 * the board — hovering a dot lifts its row and vice-versa (shared `hoveredId`) —
 * and a dot is a shortcut into the car. The board/table is the accessible source
 * of truth, so the SVG itself is decorative (`aria-hidden`).
 */
export function DistributionPlot({
  cars,
  domain,
  leaderId,
  hoveredId,
  onHover,
}: {
  /** The currently-shown (filtered) cars. */
  cars: CarDTO[];
  /** [fastest, slowest] across the WHOLE field, so dots keep absolute positions. */
  domain: [number, number];
  leaderId: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nodes = useMemo(() => {
    if (width === 0 || cars.length === 0) return [];
    // Fastest (min time) sits on the RIGHT, slowest on the left.
    const x = scaleLinear().domain(domain).range([width - PAD_X, PAD_X]);
    const cy = HEIGHT / 2;
    const data: PlotNode[] = cars.map((c) => ({
      id: c.id,
      slug: c.slug,
      time: c.zeroToHundred,
      title: carTitle(c),
      x: x(c.zeroToHundred),
      y: cy,
    }));
    // Run the force layout to completion once, synchronously — no animation
    // loop, deterministic output, no layout shift.
    forceSimulation<PlotNode>(data)
      .force("x", forceX<PlotNode>((d) => x(d.time)).strength(0.95))
      .force("y", forceY<PlotNode>(cy).strength(0.05))
      .force("collide", forceCollide<PlotNode>(RADIUS + 1.2))
      .stop()
      .tick(220);
    return data.map((d) => ({
      id: d.id,
      slug: d.slug,
      time: d.time,
      title: d.title,
      x: d.x ?? 0,
      y: Math.max(RADIUS + 1, Math.min(HEIGHT - RADIUS - 1, d.y ?? cy)),
    }));
  }, [cars, domain, width]);

  if (cars.length < 2) return null;

  const hovered = nodes.find((n) => n.id === hoveredId) ?? null;

  // Pick the dot nearest the pointer (within a small radius). Beeswarm dots sit
  // close together, so per-dot hit areas overlap and fight each other; nearest-
  // point selection makes a tightly-packed cluster easy to target precisely.
  const nearestTo = (clientX: number, clientY: number, bounds: DOMRect) => {
    const px = clientX - bounds.left;
    const py = clientY - bounds.top;
    let best: (typeof nodes)[number] | null = null;
    let bestDist = Infinity;
    for (const n of nodes) {
      const d = (n.x - px) ** 2 + (n.y - py) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return best && bestDist <= 26 ** 2 ? best : null;
  };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Slower</span>
        <span aria-hidden className="mx-3 h-px flex-1 bg-border" />
        <span>Quicker</span>
      </div>

      <div ref={wrapRef} className="relative">
        <svg
          width={width || "100%"}
          height={HEIGHT}
          role="img"
          aria-hidden
          className="block overflow-visible"
        >
          <line
            x1={PAD_X}
            x2={Math.max(PAD_X, width - PAD_X)}
            y1={HEIGHT / 2}
            y2={HEIGHT / 2}
            stroke="hsl(var(--border))"
          />
          {nodes.map((n, i) => {
            const isLeader = n.id === leaderId;
            const isHovered = n.id === hoveredId;
            const active = isLeader || isHovered;
            return (
              <g
                key={n.id}
                className="pointer-events-none animate-in fade-in fill-mode-both duration-500 motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(i * 9, 320)}ms` }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isHovered ? HOVER_RADIUS : RADIUS}
                  fillOpacity={active ? 1 : 0.32}
                  className={cn(
                    "transition-[r,fill-opacity] duration-150 ease-out",
                    active
                      ? "fill-[hsl(var(--primary))]"
                      : "fill-[hsl(var(--foreground))]"
                  )}
                />
              </g>
            );
          })}

          {/* Pointer surface: resolves to the nearest dot so close-packed points
              stay easy to hover/tap; clicking opens that car. */}
          {width > 0 && (
            <rect
              x={0}
              y={0}
              width={width}
              height={HEIGHT}
              fill="transparent"
              className={hovered ? "cursor-pointer" : "cursor-default"}
              onPointerMove={(e) =>
                onHover(
                  nearestTo(
                    e.clientX,
                    e.clientY,
                    e.currentTarget.getBoundingClientRect()
                  )?.id ?? null
                )
              }
              onPointerLeave={() => onHover(null)}
              onClick={(e) => {
                const n = nearestTo(
                  e.clientX,
                  e.clientY,
                  e.currentTarget.getBoundingClientRect()
                );
                if (n) router.push(`/cars/${n.slug}`);
              }}
            />
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm border border-border bg-popover px-2.5 py-1.5 text-center"
            style={{ left: hovered.x, top: hovered.y - HOVER_RADIUS - 6 }}
          >
            <span className="block text-xs font-medium leading-tight text-popover-foreground">
              {hovered.title}
            </span>
            <span className="mt-0.5 block font-mono text-[11px] font-medium tabular-nums text-foreground">
              {formatTime(hovered.time)}
              <span className="text-muted-foreground"> s</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
