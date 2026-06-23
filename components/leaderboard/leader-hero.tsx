"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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
  const reduce = useReducedMotion();

  const list = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.08,
        delayChildren: reduce ? 0 : 0.12,
      },
    },
  };
  const item = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={`/cars/${car.id}`}
        className="group grid sm:grid-cols-[1.05fr_1fr]"
      >
        {/* Photo */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/3] overflow-hidden bg-secondary"
        >
          <CarThumb
            car={car}
            transform={{ w: 720, h: 540 }}
            className="h-full w-full rounded-none ring-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </motion.div>

        {/* Info — vertically centred so the time fills the column, not a gap. */}
        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-center py-6 sm:border-l sm:border-border sm:py-8 sm:pl-8"
        >
          <motion.span
            variants={item}
            className="self-start bg-primary px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            No.01 · Fastest
          </motion.span>

          <motion.h2
            variants={item}
            className="mt-4 font-display text-4xl leading-none tracking-tight sm:text-5xl"
          >
            {car.manufacturer}{" "}
            <span className="text-muted-foreground">{car.carModel}</span>
          </motion.h2>
          <motion.p
            variants={item}
            className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground"
          >
            {car.modelYear} · {car.powertrainType}
          </motion.p>

          <motion.div variants={item} className="mt-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              0–100 km/h
            </p>
            <div className="-ml-1 mt-1 flex items-baseline gap-2">
              <CountUp
                value={car.zeroToHundred}
                className="font-mono text-7xl font-bold leading-[0.78] tracking-tighter sm:text-[8.5rem]"
              />
              <span className="font-mono text-2xl text-muted-foreground">s</span>
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {marginToNext > 0.0001 ? (
                <>
                  <span className="font-bold text-primary">
                    {marginToNext.toFixed(2)} s
                  </span>{" "}
                  clear of P2
                </>
              ) : (
                "Fastest on the board"
              )}
            </p>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-7 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
          >
            {formatEngine(car.engineSize)} · {car.induction} · {car.transmission}
          </motion.p>
        </motion.div>
      </Link>
    </motion.section>
  );
}
