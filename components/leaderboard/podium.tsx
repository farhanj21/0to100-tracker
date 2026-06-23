"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime, carTitle } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

const STYLES = [
  { ring: "ring-gold/40", glow: "shadow-[0_0_40px_-12px_hsl(45_90%_55%/0.6)]", text: "text-gold", label: "1st" },
  { ring: "ring-silver/40", glow: "shadow-[0_0_36px_-14px_hsl(220_9%_70%/0.5)]", text: "text-silver", label: "2nd" },
  { ring: "ring-bronze/40", glow: "shadow-[0_0_36px_-14px_hsl(28_70%_52%/0.5)]", text: "text-bronze", label: "3rd" },
];

/** Headline podium of the three globally fastest cars. */
export function Podium({ cars }: { cars: CarDTO[] }) {
  const top3 = cars.slice(0, 3);
  if (top3.length === 0) return null;

  // Render in natural order (1st, 2nd, 3rd) so mobile stacks them correctly;
  // CSS `order` rearranges to 2nd / 1st / 3rd (1st raised) only on sm+.
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-bold tracking-tight">Podium</h2>
        <span className="text-sm text-muted-foreground">— the three quickest</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {top3.map((car, idx) => {
          const s = STYLES[idx];
          const raised = idx === 0;
          // Desktop visual placement: 2nd | 1st | 3rd.
          const desktopOrder =
            idx === 0 ? "sm:order-2" : idx === 1 ? "sm:order-1" : "sm:order-3";
          return (
            <motion.div
              key={car.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, type: "spring", stiffness: 260, damping: 26 }}
              className={cn(desktopOrder, raised && "sm:-mt-4")}
            >
              <Link
                href={`/cars/${car.id}`}
                className={cn(
                  "group block overflow-hidden rounded-xl border border-border bg-card ring-1 transition-transform hover:-translate-y-1",
                  s.ring,
                  s.glow,
                  raised && "sheen"
                )}
              >
                <div className="relative aspect-[16/10] w-full">
                  <CarThumb car={car} className="h-full w-full rounded-none ring-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <span
                    className={cn(
                      "absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs font-bold ring-1 backdrop-blur",
                      s.text,
                      s.ring
                    )}
                  >
                    <Trophy className="h-3.5 w-3.5" /> {s.label}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{car.modelYear}</p>
                  <h3 className="truncate font-semibold">
                    {car.manufacturer}{" "}
                    <span className="text-muted-foreground">{car.carModel}</span>
                  </h3>
                  <div className="mt-3 flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className={cn("font-mono text-3xl font-bold tabular-nums", s.text)}>
                        {formatTime(car.zeroToHundred)}
                      </span>
                      <span className="text-xs text-muted-foreground">s 0–100</span>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Zap className="h-3 w-3" /> {car.powertrainType}
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
