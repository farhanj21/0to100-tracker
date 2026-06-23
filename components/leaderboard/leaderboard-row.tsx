"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { RankBadge } from "@/components/leaderboard/rank-badge";
import { AccelBar } from "@/components/accel-bar";
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
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border py-4 transition-colors hover:bg-secondary/40 sm:gap-5"
      >
        {/* Rank + thumbnail */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="w-12 text-center sm:w-14">
            <RankBadge position={car.position} />
          </span>
          <CarThumb car={car} className="h-12 w-16 shrink-0 sm:h-14 sm:w-24" />
        </div>

        {/* Identity + specs + bar */}
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {car.modelYear}
          </p>
          <h3 className="truncate font-display text-base font-semibold sm:text-lg">
            {car.manufacturer}{" "}
            <span className="text-muted-foreground">{car.carModel}</span>
          </h3>
          <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {formatEngine(car.engineSize)} · {car.induction} · {car.transmission}
            <span className="hidden sm:inline"> · {car.powertrainType}</span>
          </p>
          <AccelBar
            seconds={car.zeroToHundred}
            accent={isPodium}
            className="mt-2 max-w-xs"
          />
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
              <span className="font-mono text-xs text-muted-foreground">s</span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              0–100 km/h
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}
