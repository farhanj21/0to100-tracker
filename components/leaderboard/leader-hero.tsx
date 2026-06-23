"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CarThumb } from "@/components/car-thumb";
import { CountUp } from "@/components/count-up";
import { formatEngine } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/** Cover-story treatment of the single globally quickest car. */
export function LeaderHero({
  car,
  marginToNext,
}: {
  car: CarDTO;
  /** Seconds the leader is clear of P2 (0 if it's the only car). */
  marginToNext: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border-t-2 border-foreground"
    >
      <Link
        href={`/cars/${car.id}`}
        className="group grid sm:grid-cols-[1.05fr_1fr]"
      >
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <CarThumb
            car={car}
            className="h-full w-full rounded-none ring-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col py-6 sm:border-l sm:border-border sm:py-7 sm:pl-8">
          <span className="self-start bg-primary px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground">
            No.01 — Fastest
          </span>

          <h2 className="mt-4 font-display text-4xl leading-none tracking-tight sm:text-5xl">
            {car.manufacturer}{" "}
            <span className="text-muted-foreground">{car.carModel}</span>
          </h2>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {car.modelYear} · {car.powertrainType}
          </p>

          <div className="mt-auto pt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              0–100 km/h
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <CountUp
                value={car.zeroToHundred}
                className="font-mono text-7xl font-bold leading-[0.82] tracking-tighter sm:text-8xl"
              />
              <span className="font-mono text-xl text-muted-foreground">s</span>
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Fastest
              {marginToNext > 0.0001 && (
                <>
                  {" — "}
                  <span className="font-bold text-primary">
                    {marginToNext.toFixed(2)} s
                  </span>{" "}
                  clear of P2
                </>
              )}
            </p>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            {formatEngine(car.engineSize)} · {car.induction} · {car.transmission}{" "}
            · {car.powertrainType}
          </p>
        </div>
      </Link>
    </motion.section>
  );
}
