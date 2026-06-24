"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { SearchX, LayoutList, Table2, GitCompareArrows, X } from "lucide-react";
import { LeaderHero } from "@/components/leaderboard/leader-hero";
import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import {
  Filters,
  EMPTY_FILTERS,
  type FilterState,
} from "@/components/leaderboard/filters";
import { Button } from "@/components/ui/button";
import { cn, carTitle } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

type View = "cards" | "table";

/** Maximum cars in a single comparison (keeps the compare table readable). */
const MAX_COMPARE = 3;

export function Leaderboard({ cars }: { cars: CarDTO[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<View>("cards");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const selectedCars = useMemo(
    () =>
      selectedIds
        .map((id) => cars.find((c) => c.id === id))
        .filter(Boolean) as CarDTO[],
    [selectedIds, cars]
  );
  const maxReached = selectedIds.length >= MAX_COMPARE;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) {
        toast.error(`Compare up to ${MAX_COMPARE} cars at a time.`);
        return prev;
      }
      return [...prev, id];
    });
  }

  function toggleCompareMode() {
    setCompareMode((on) => {
      if (on) setSelectedIds([]); // leaving compare mode clears the picks
      return !on;
    });
  }

  function goCompare() {
    if (selectedIds.length < 2) return;
    router.push(`/compare?ids=${selectedIds.join(",")}`);
  }

  return (
    <div className={cn("space-y-10", compareMode && selectedIds.length > 0 && "pb-24")}>
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

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleCompareMode}
            aria-pressed={compareMode}
            className={cn(
              "inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              compareMode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <GitCompareArrows className="h-3 w-3" />
            {compareMode ? "Comparing" : "Compare"}
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {compareMode && (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Pick 2–3 cars to compare.
          </p>
        )}

        {boardCars.length === 0 ? (
          <EmptyResults />
        ) : view === "table" ? (
          <LeaderboardTable
            cars={boardCars}
            selectable={compareMode}
            selectedIds={selectedIds}
            maxReached={maxReached}
            onToggleSelect={toggleSelect}
          />
        ) : (
          <motion.div layout className="border-t border-border">
            <AnimatePresence initial={false}>
              {boardCars.map((car) => (
                <LeaderboardRow
                  key={car.id}
                  car={car}
                  gap={car.zeroToHundred - leaderTime}
                  selectable={compareMode}
                  selected={selectedIds.includes(car.id)}
                  disabled={!selectedIds.includes(car.id) && maxReached}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <CompareBar
        cars={selectedCars}
        open={compareMode && selectedCars.length > 0}
        onRemove={toggleSelect}
        onClear={() => setSelectedIds([])}
        onCompare={goCompare}
      />
    </div>
  );
}

function CompareBar({
  cars,
  open,
  onRemove,
  onClear,
  onCompare,
}: {
  cars: CarDTO[];
  open: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Compare
              </span>
              {cars.map((car) => (
                <span
                  key={car.id}
                  className="inline-flex items-center gap-1.5 border border-border bg-secondary/50 py-1 pl-2.5 pr-1 text-xs"
                >
                  <span className="max-w-[12rem] truncate">{carTitle(car)}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(car.id)}
                    aria-label={`Remove ${carTitle(car)}`}
                    className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <Button
                type="button"
                size="sm"
                onClick={onCompare}
                disabled={cars.length < 2}
              >
                <GitCompareArrows className="h-4 w-4" />
                Compare {cars.length}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
