"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FUEL_TYPES } from "@/lib/constants";

export interface FilterState {
  search: string;
  manufacturer: string; // "all" or a manufacturer name
  fuelType: string;
  powertrainType: string;
  induction: string;
  transmission: string;
  yearMin: string;
  yearMax: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  manufacturer: "all",
  fuelType: "all",
  powertrainType: "all",
  induction: "all",
  transmission: "all",
  yearMin: "",
  yearMax: "",
};

const ALL = "all";

interface FiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  manufacturers: string[];
  powertrains: string[];
  inductions: string[];
  transmissions: string[];
  yearBounds: [number, number];
  resultCount: number;
  totalCount: number;
}

export function Filters({
  value,
  onChange,
  manufacturers,
  powertrains,
  inductions,
  transmissions,
  yearBounds,
  resultCount,
  totalCount,
}: FiltersProps) {
  const set = <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
    onChange({ ...value, [key]: v });

  const isDirty =
    JSON.stringify(value) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="border border-border bg-card p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row lg:items-end lg:gap-4">
        {/* Search */}
        <div className="col-span-2 lg:flex-1 lg:min-w-[180px]">
          <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Search className="h-3 w-3" /> Search
          </label>
          <Input
            placeholder="Manufacturer or model"
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>

        {/* Manufacturer */}
        <FilterSelect
          label="Manufacturer"
          value={value.manufacturer}
          onValueChange={(v) => set("manufacturer", v)}
          options={manufacturers}
        />

        {/* Fuel */}
        <FilterSelect
          label="Fuel"
          value={value.fuelType}
          onValueChange={(v) => set("fuelType", v)}
          options={[...FUEL_TYPES]}
        />

        {/* Powertrain */}
        <FilterSelect
          label="Powertrain"
          value={value.powertrainType}
          onValueChange={(v) => set("powertrainType", v)}
          options={powertrains}
        />

        {/* Induction */}
        <FilterSelect
          label="Induction"
          value={value.induction}
          onValueChange={(v) => set("induction", v)}
          options={inductions}
        />

        {/* Transmission */}
        <FilterSelect
          label="Transmission"
          value={value.transmission}
          onValueChange={(v) => set("transmission", v)}
          options={transmissions}
        />

        {/* Year range */}
        <div className="col-span-2 lg:min-w-[220px] lg:flex-1">
          <YearRangeSlider
            min={yearBounds[0]}
            max={yearBounds[1]}
            yearMin={value.yearMin}
            yearMax={value.yearMax}
            onChange={(next) => onChange({ ...value, ...next })}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <SlidersHorizontal className="h-3 w-3" />
          <span className="font-bold text-foreground tabular-nums">
            {resultCount}
          </span>
          <span>/</span>
          <span className="tabular-nums">{totalCount}</span> showing
        </p>
        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="h-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Dual-thumb year range slider. Values live in FilterState as strings, where an
 * empty string means "no bound" — so a thumb parked on the data's min/max emits
 * "" (keeps `isDirty`/Clear honest and matches the null-check in the filter).
 */
function YearRangeSlider({
  min,
  max,
  yearMin,
  yearMax,
  onChange,
}: {
  min: number;
  max: number;
  yearMin: string;
  yearMax: string;
  onChange: (next: { yearMin: string; yearMax: string }) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const lo = clamp(yearMin ? Number(yearMin) : min);
  const hi = clamp(yearMax ? Number(yearMax) : max);

  const span = Math.max(1, max - min);
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  const emit = (nextLo: number, nextHi: number) =>
    onChange({
      yearMin: nextLo <= min ? "" : String(nextLo),
      yearMax: nextHi >= max ? "" : String(nextHi),
    });

  // Only one distinct year in the field — a slider would be inert, so just
  // state the year.
  if (max <= min) {
    return (
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Year
        </label>
        <p className="font-mono text-sm tabular-nums text-foreground">{min}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Year range
        </label>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {lo}
          <span className="mx-1 text-muted-foreground">–</span>
          {hi}
        </span>
      </div>

      <div className="year-slider relative flex h-10 items-center">
        {/* Rail + selected span */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-border" />
        <div
          className="pointer-events-none absolute top-1/2 h-[3px] -translate-y-1/2 bg-foreground"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          aria-label="Earliest year"
          onChange={(e) => emit(Math.min(Number(e.target.value), hi), hi)}
          className="absolute inset-0 h-full w-full appearance-none bg-transparent"
          // Keep the min thumb grabbable when both thumbs bunch up at the top end.
          style={{ zIndex: loPct > 50 ? 4 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          aria-label="Latest year"
          onChange={(e) => emit(lo, Math.max(Number(e.target.value), lo))}
          className="absolute inset-0 h-full w-full appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="w-full lg:min-w-[150px]">
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
