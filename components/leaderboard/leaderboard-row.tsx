"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { AccelBar } from "@/components/accel-bar";
import { cn, formatTime, formatEngine } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

export function LeaderboardRow({ car }: { car: CarDTO }) {
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
        className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-border py-5 transition-colors hover:bg-secondary/50 sm:grid-cols-[3rem_1fr_minmax(120px,200px)_auto] sm:gap-6"
      >
        {/* Rank */}
        <span className="font-mono text-xl font-bold tabular-nums text-muted-foreground transition-colors group-hover:text-primary">
          {String(car.position).padStart(2, "0")}
        </span>

        {/* Identity */}
        <div className="min-w-0">
          <h3 className="truncate font-display text-2xl leading-none">
            {car.manufacturer}{" "}
            <span className="text-muted-foreground">{car.carModel}</span>
          </h3>
          <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {car.modelYear} · {formatEngine(car.engineSize)} · {car.induction} ·{" "}
            {car.transmission}
          </p>
          {/* Bar on mobile lives under the identity; on sm+ it gets its own column */}
          <AccelBar seconds={car.zeroToHundred} className="mt-3 sm:hidden" />
        </div>

        {/* Bar (sm+) */}
        <AccelBar
          seconds={car.zeroToHundred}
          className="hidden sm:block"
        />

        {/* Time */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-baseline justify-end gap-1">
            <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
              {formatTime(car.zeroToHundred)}
            </span>
            <span className="font-mono text-xs text-muted-foreground">s</span>
          </div>
          <ChevronRight
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            )}
          />
        </div>
      </Link>
    </motion.div>
  );
}
