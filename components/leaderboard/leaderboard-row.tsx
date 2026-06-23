"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Gauge, Cog, Wind } from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { RankBadge } from "@/components/leaderboard/rank-badge";
import { cn, formatTime, formatEngine } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

export function LeaderboardRow({ car }: { car: CarDTO }) {
  const isPodium = car.position <= 3;

  return (
    <motion.div
      layout
      layoutId={car.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <Link
        href={`/cars/${car.id}`}
        className={cn(
          "group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:gap-5 sm:p-4",
          isPodium ? "border-border" : "border-border/60"
        )}
      >
        {/* Rank + thumbnail */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <RankBadge position={car.position} />
          <CarThumb
            car={car}
            className="h-12 w-16 shrink-0 sm:h-16 sm:w-24"
          />
        </div>

        {/* Identity + specs */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {car.modelYear}
            </span>
          </div>
          <h3 className="truncate text-base font-semibold sm:text-lg">
            {car.manufacturer}{" "}
            <span className="text-muted-foreground">{car.carModel}</span>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3 w-3" /> {formatEngine(car.engineSize)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="h-3 w-3" /> {car.induction}
            </span>
            <span className="inline-flex items-center gap-1">
              <Cog className="h-3 w-3" /> {car.transmission}
            </span>
            <span className="hidden sm:inline">· {car.powertrainType}</span>
          </div>
        </div>

        {/* 0–100 time */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums sm:text-3xl",
                  isPodium ? "text-primary" : "text-foreground"
                )}
              >
                {formatTime(car.zeroToHundred)}
              </span>
              <span className="text-xs text-muted-foreground">s</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              0–100 km/h
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}
