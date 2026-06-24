"use client";

import Link from "next/link";
import { cn, formatTime, formatEngine } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/**
 * Compact, scannable table view of the leaderboard. Each row links to the car
 * detail page; the top 3 positions get medal-colored rank cells. Numbers are
 * monospaced and right-aligned for easy comparison.
 *
 * In compare mode a leading checkbox column appears and the rows toggle
 * selection instead of acting purely as links.
 */
export function LeaderboardTable({
  cars,
  selectable = false,
  selectedIds = [],
  maxReached = false,
  onToggleSelect,
}: {
  cars: CarDTO[];
  selectable?: boolean;
  selectedIds?: string[];
  /** Selection cap reached — unselected checkboxes are disabled. */
  maxReached?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-foreground/70 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {selectable && <th className="w-10 px-4 py-3 font-normal" />}
            <th className="w-14 px-4 py-3 font-normal">#</th>
            <th className="px-4 py-3 font-normal">Year</th>
            <th className="px-4 py-3 font-normal">Manufacturer</th>
            <th className="px-4 py-3 font-normal">Model</th>
            <th className="px-4 py-3 font-normal">Engine</th>
            <th className="px-4 py-3 font-normal">Powertrain</th>
            <th className="px-4 py-3 font-normal">Induction</th>
            <th className="px-4 py-3 font-normal">Trans.</th>
            <th className="px-4 py-3 text-right font-normal">0–100</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => {
            const selected = selectedIds.includes(car.id);
            return (
              <tr
                key={car.id}
                className={cn(
                  "group border-b border-border/60 transition-[background-color,box-shadow] last:border-0 hover:bg-secondary/40 hover:shadow-[inset_3px_0_0_hsl(var(--primary))]",
                  selected && "bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]"
                )}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selected && maxReached}
                      onChange={() => onToggleSelect?.(car.id)}
                      aria-label={`Compare ${car.manufacturer} ${car.carModel}`}
                      className="h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums transition-colors",
                      car.position <= 3
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  >
                    {String(car.position).padStart(2, "0")}
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
