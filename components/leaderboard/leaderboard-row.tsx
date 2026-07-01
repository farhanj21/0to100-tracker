"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Gauge, Wind, Cog, Fuel, Zap, Check } from "lucide-react";
import { Engine, Turbo } from "@/components/icons/automotive";
import { CarThumb } from "@/components/car-thumb";
import { cn, formatTime, formatEngine, formatGap } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/** Compact engine label for the cramped mobile row: a turbocharged car shows
 *  "1.5T" instead of "1.5L" + a separate "Turbocharged" field. */
function formatEngineMobile(car: CarDTO): string {
  if (car.engineSize && car.induction === "Turbocharged") {
    return `${car.engineSize.toFixed(1)}T`;
  }
  return formatEngine(car.engineSize);
}

export function LeaderboardRow({
  car,
  gap,
  selectable = false,
  selected = false,
  disabled = false,
  onToggleSelect,
  hovered = false,
  onHover,
}: {
  car: CarDTO;
  /** Seconds behind the global leader. */
  gap: number;
  /** When true, the row toggles compare selection instead of linking. */
  selectable?: boolean;
  selected?: boolean;
  /** Selection cap reached and this row isn't already selected. */
  disabled?: boolean;
  onToggleSelect?: (id: string) => void;
  /** Cross-highlighted from the distribution plot. */
  hovered?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const reduce = useReducedMotion();

  const wrapperClass = cn(
    "group relative grid grid-cols-[1.75rem_auto_1fr_auto] items-center gap-3 border-b border-border py-4 px-3 transition-colors hover:bg-secondary/40 sm:grid-cols-[2.25rem_auto_1fr_5rem_auto] sm:gap-5 sm:px-4",
    selectable &&
      "w-full text-left focus:outline-none focus-visible:bg-secondary/40",
    selected && "bg-primary/5",
    hovered && "bg-secondary/40",
    disabled && "cursor-not-allowed opacity-45"
  );

  const inner = (
    <>
      {/* Edge marker — hover when linking, solid when selected or cross-hovered */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 h-full w-[3px] origin-top bg-primary transition-transform duration-300 ease-out",
          selected || hovered
            ? "scale-y-100"
            : "scale-y-0 group-hover:scale-y-100 group-focus-visible:scale-y-100"
        )}
      />

      {/* Rank — top 3 (or the cross-hovered row) carry a quiet cobalt numeral,
          everyone else greys until hover. */}
      <span
        className={cn(
          "font-mono text-base font-bold tabular-nums transition-colors sm:text-xl",
          car.position <= 3 || hovered
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        )}
      >
        {String(car.position).padStart(2, "0")}
      </span>

      {/* Thumbnail — fill a tidy 4:3 box with a centre crop (cars are framed
          centrally), optimised. Fills edge to edge, no gaps. */}
      <CarThumb
        car={car}
        transform={{ w: 96, h: 72 }}
        interactive={!selectable}
        className="aspect-[4/3] w-20 shrink-0 rounded-none bg-secondary ring-1 ring-border sm:w-24"
      />

      {/* Identity + specs (icons + readable grotesk, not cramped mono caps) */}
      <div className="min-w-0">
        <h3 className="truncate font-display text-xl leading-none sm:text-2xl">
          {car.manufacturer}{" "}
          <span className="text-muted-foreground">{car.carModel}</span>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
          <span className="tabular-nums">{car.modelYear}</span>
          {/* Mobile: engine only, turbo folded into the value (e.g. "1.5T"). */}
          <span className="inline-flex items-center gap-1 sm:hidden">
            <Gauge className="h-3 w-3 shrink-0" /> {formatEngineMobile(car)}
          </span>
          {/* sm+: engine, then induction and transmission as their own fields. */}
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Gauge className="h-3 w-3 shrink-0" /> {formatEngine(car.engineSize)}
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            {car.induction === "Turbocharged" ? (
              <Turbo className="h-3 w-3 shrink-0" />
            ) : (
              <Wind className="h-3 w-3 shrink-0" />
            )}{" "}
            {car.induction}
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Cog className="h-3 w-3 shrink-0" /> {car.transmission}
          </span>
          {car.fuelType && (
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Fuel className="h-3 w-3 shrink-0" /> {car.fuelType}
            </span>
          )}
          <span className="hidden items-center gap-1 sm:inline-flex">
            {car.powertrainType === "ICE" ? (
              <Engine className="h-3 w-3 shrink-0" />
            ) : (
              <Zap className="h-3 w-3 shrink-0" />
            )}{" "}
            {car.powertrainType}
          </span>
        </div>
      </div>

      {/* Gap to leader (sm+) — fixed-width so the column stays tidy */}
      <span className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
        {formatGap(gap)}
        {gap > 0.0001 && <span className="text-[10px]"> s</span>}
      </span>

      {/* Time — number sits in a fixed-width right-aligned box so decimals
          line up across rows regardless of digit count. */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-baseline justify-end gap-1">
          <span className="w-[5ch] text-right font-mono text-2xl font-bold tabular-nums tracking-tight transition-transform group-hover:-translate-x-0.5 sm:text-3xl">
            {formatTime(car.zeroToHundred)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">s</span>
        </div>
        {selectable && (
          <span
            aria-hidden
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center border transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-transparent group-hover:border-primary"
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      transition={
        reduce ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 34 }
      }
    >
      {selectable ? (
        <button
          type="button"
          onClick={() => onToggleSelect?.(car.id)}
          disabled={disabled}
          aria-pressed={selected}
          onMouseEnter={() => onHover?.(car.id)}
          onMouseLeave={() => onHover?.(null)}
          className={wrapperClass}
        >
          {inner}
        </button>
      ) : (
        <Link
          href={`/cars/${car.slug}`}
          onMouseEnter={() => onHover?.(car.id)}
          onMouseLeave={() => onHover?.(null)}
          className={wrapperClass}
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
}
