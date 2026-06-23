"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { Podium } from "@/components/leaderboard/podium";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import {
  Filters,
  EMPTY_FILTERS,
  type FilterState,
} from "@/components/leaderboard/filters";
import type { CarDTO } from "@/lib/types";

export function Leaderboard({ cars }: { cars: CarDTO[] }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

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

  return (
    <div className="space-y-8">
      {/* Podium always reflects the true global top 3, independent of filters. */}
      <Podium cars={cars} />

      <section className="space-y-4">
        <Filters
          value={filters}
          onChange={setFilters}
          manufacturers={manufacturers}
          resultCount={filtered.length}
          totalCount={cars.length}
        />

        {filtered.length === 0 ? (
          <EmptyResults />
        ) : (
          <motion.div layout className="space-y-2.5">
            <AnimatePresence initial={false}>
              {filtered.map((car) => (
                <LeaderboardRow key={car.id} car={car} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <SearchX className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">No cars match your filters</p>
      <p className="text-sm text-muted-foreground">
        Try widening the year range or clearing filters.
      </p>
    </div>
  );
}
