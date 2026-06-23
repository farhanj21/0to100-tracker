"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CarThumb } from "@/components/car-thumb";
import { AccelBar } from "@/components/accel-bar";
import { cn, formatTime } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/** Headline trio of the three globally quickest cars, editorial treatment. */
export function Podium({ cars }: { cars: CarDTO[] }) {
  const top3 = cars.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          The Podium
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Three that get there first
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {top3.map((car, idx) => {
          const first = idx === 0;
          // Visual placement on sm+: 2nd | 1st | 3rd, with 1st raised.
          const desktopOrder =
            idx === 0 ? "sm:order-2" : idx === 1 ? "sm:order-1" : "sm:order-3";
          return (
            <motion.div
              key={car.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: idx * 0.06,
                type: "spring",
                stiffness: 260,
                damping: 26,
              }}
              className={cn(desktopOrder, first && "sm:-mt-4")}
            >
              <Link
                href={`/cars/${car.id}`}
                className={cn(
                  "group block overflow-hidden border bg-card transition-colors hover:border-primary",
                  first ? "border-primary/50" : "border-border"
                )}
              >
                <div className="relative aspect-[16/10] w-full">
                  <CarThumb car={car} className="h-full w-full rounded-none ring-0" />
                  <span
                    className={cn(
                      "absolute left-3 top-3 font-mono font-semibold tabular-nums leading-none",
                      first ? "text-primary text-2xl" : "text-foreground text-xl"
                    )}
                  >
                    <span className="mr-0.5 text-[0.55em] uppercase tracking-wide opacity-70">
                      No.
                    </span>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {car.modelYear}
                  </p>
                  <h3 className="mt-0.5 truncate font-display text-lg font-semibold">
                    {car.manufacturer}{" "}
                    <span className="text-muted-foreground">{car.carModel}</span>
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span
                      className={cn(
                        "font-mono font-bold tabular-nums",
                        first ? "text-primary text-4xl" : "text-foreground text-3xl"
                      )}
                    >
                      {formatTime(car.zeroToHundred)}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      s · 0–100
                    </span>
                  </div>
                  <AccelBar seconds={car.zeroToHundred} accent={first} className="mt-3" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
