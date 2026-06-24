"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchX, LayoutList, Table2 } from "lucide-react";
import { LeaderHero } from "@/components/leaderboard/leader-hero";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import {
  Filters,
  EMPTY_FILTERS,
  type FilterState,
} from "@/components/leaderboard/filters";
import { cn } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

type View = "cards" | "table";

export function Leaderboard({ cars }: { cars: CarDTO[] }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<View>("cards");

  const manufacturers = useMemo(
    () =>
      Array.from(new Set(cars.map((c) => c.manufacturer))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [cars]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const min = filters.yearMin ? parseInt(filters.yearMin, 10) : null;
    const max = filters.yearMax ? parseInt(filters.yearMax, 10) : null;

    return cars.filter((car) => {
      if (q) {
        const haystack =
          `${car.manufacturer} ${car.carModel} ${car.modelYear}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.manufacturer !== "all" && car.manufacturer !== filters.manufacturer)
        return false;
      if (filters.powertrainType !== "all" && car.powertrainType !== filters.powertrainType)
        return false;
      if (filters.induction !== "all" && car.induction !== filters.induction)
        return false;
      if (filters.transmission !== "all" && car.transmission !== filters.transmission)
        return false;
      if (min !== null && car.modelYear < min) return false;
      if (max !== null && car.modelYear > max) return false;
      return true;
    });
    // Note: each car keeps its true global `position` (assigned server-side).
  }, [cars, filters]);

  // The cover hero is always the true global #1; the board lists the full
  // ranking, leader included, so the table/cards are a complete grid.
  const hero = cars[0];
  const leaderTime = hero.zeroToHundred;
  const marginToNext = cars[1] ? cars[1].zeroToHundred - leaderTime : 0;
  const boardCars = filtered;

  return (
    <div className="space-y-10">
      <LeaderHero car={hero} marginToNext={marginToNext} />

      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2">
          <h2 className="font-display text-3xl">The Board</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {cars.length} cars, quickest first
          </span>
        </div>

        <Filters
          value={filters}
          onChange={setFilters}
          manufacturers={manufacturers}
          resultCount={filtered.length}
          totalCount={cars.length}
        />

        <div className="flex justify-end">
          <ViewToggle view={view} onChange={setView} />
        </div>

        {boardCars.length === 0 ? (
          <EmptyResults />
        ) : view === "table" ? (
          <LeaderboardTable cars={boardCars} />
        ) : (
          <motion.div layout className="border-t border-border">
            <AnimatePresence initial={false}>
              {boardCars.map((car) => (
                <LeaderboardRow
                  key={car.id}
                  car={car}
                  gap={car.zeroToHundred - leaderTime}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const options: { value: View; label: string; icon: typeof LayoutList }[] = [
    { value: "cards", label: "Cards", icon: LayoutList },
    { value: "table", label: "Table", icon: Table2 },
  ];
  return (
    <div className="inline-flex divide-x divide-border border border-border bg-card">
      {options.map((opt) => {
        const active = view === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="h-3 w-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card py-16 text-center">
      <SearchX className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Nothing matches
      </p>
      <p className="font-display text-2xl">No cars on this grid</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Widen the year range or clear the filters to see more.
      </p>
    </div>
  );
}
