"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Gauge, Wind, Cog, Fuel } from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { formatTime, formatEngine, formatGap } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

export function LeaderboardRow({
  car,
  gap,
  index = 0,
}: {
  car: CarDTO;
  /** Seconds behind the global leader. */
  gap: number;
  index?: number;
}) {
  return (
    <motion.div
      layout
      layoutId={car.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 30,
        delay: Math.min(index * 0.035, 0.45),
      }}
    >
      <Link
        href={`/cars/${car.id}`}
        className="group relative grid grid-cols-[1.75rem_auto_1fr_auto] items-center gap-3 border-b border-border py-4 pl-3 transition-colors hover:bg-secondary/40 sm:grid-cols-[2.25rem_auto_1fr_5rem_auto] sm:gap-5 sm:pl-4"
      >
        {/* Hover edge marker */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-y-100"
        />

        {/* Rank */}
        <span className="font-mono text-base font-bold tabular-nums text-muted-foreground transition-colors group-hover:text-primary sm:text-xl">
          {String(car.position).padStart(2, "0")}
        </span>

        {/* Thumbnail — fill a tidy 4:3 box with a centre crop (cars are framed
            centrally), optimised. Fills edge to edge, no gaps. */}
        <CarThumb
          car={car}
          transform={{ w: 96, h: 72 }}
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
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3 w-3 shrink-0" /> {formatEngine(car.engineSize)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="h-3 w-3 shrink-0" /> {car.induction}
            </span>
            <span className="inline-flex items-center gap-1">
              <Cog className="h-3 w-3 shrink-0" /> {car.transmission}
            </span>
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Fuel className="h-3 w-3 shrink-0" /> {car.powertrainType}
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
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}
