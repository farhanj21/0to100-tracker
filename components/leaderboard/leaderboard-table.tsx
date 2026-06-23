"use client";

import Link from "next/link";
import { cn, formatTime, formatEngine } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/**
 * Compact, scannable table view of the leaderboard. Each row links to the car
 * detail page; the top 3 positions get medal-colored rank cells. Numbers are
 * monospaced and right-aligned for easy comparison.
 */
export function LeaderboardTable({ cars }: { cars: CarDTO[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="w-14 px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Year</th>
            <th className="px-4 py-3 font-medium">Manufacturer</th>
            <th className="px-4 py-3 font-medium">Model</th>
            <th className="px-4 py-3 font-medium">Engine</th>
            <th className="px-4 py-3 font-medium">Powertrain</th>
            <th className="px-4 py-3 font-medium">Induction</th>
            <th className="px-4 py-3 font-medium">Trans.</th>
            <th className="px-4 py-3 text-right font-medium">0–100</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => {
            const medal =
              car.position === 1
                ? "text-gold"
                : car.position === 2
                  ? "text-silver"
                  : car.position === 3
                    ? "text-bronze"
                    : "text-muted-foreground";
            return (
              <tr
                key={car.id}
                className="group border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums",
                      medal
                    )}
                  >
                    {car.position}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {car.modelYear}
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/cars/${car.id}`}
                    className="hover:text-primary"
                  >
                    {car.manufacturer}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <Link
                    href={`/cars/${car.id}`}
                    className="hover:text-primary"
                  >
                    {car.carModel}
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatEngine(car.engineSize)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {car.powertrainType}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {car.induction}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {car.transmission}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-mono text-base font-bold tabular-nums",
                      car.position <= 3 ? "text-primary" : "text-foreground"
                    )}
                  >
                    {formatTime(car.zeroToHundred)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">s</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
