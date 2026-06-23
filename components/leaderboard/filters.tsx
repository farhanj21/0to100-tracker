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
import { POWERTRAIN_TYPES, TRANSMISSIONS, INDUCTIONS } from "@/lib/constants";

export interface FilterState {
  search: string;
  manufacturer: string; // "all" or a manufacturer name
  powertrainType: string;
  induction: string;
  transmission: string;
  yearMin: string;
  yearMax: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  manufacturer: "all",
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
  resultCount: number;
  totalCount: number;
}

export function Filters({
  value,
  onChange,
  manufacturers,
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
            placeholder="Manufacturer or model…"
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

        {/* Powertrain */}
        <FilterSelect
          label="Powertrain"
          value={value.powertrainType}
          onValueChange={(v) => set("powertrainType", v)}
          options={[...POWERTRAIN_TYPES]}
        />

        {/* Induction */}
        <FilterSelect
          label="Induction"
          value={value.induction}
          onValueChange={(v) => set("induction", v)}
          options={[...INDUCTIONS]}
        />

        {/* Transmission */}
        <FilterSelect
          label="Transmission"
          value={value.transmission}
          onValueChange={(v) => set("transmission", v)}
          options={[...TRANSMISSIONS]}
        />

        {/* Year range */}
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Year range
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="From"
              className="w-full lg:w-20"
              value={value.yearMin}
              onChange={(e) => set("yearMin", e.target.value)}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="To"
              className="w-full lg:w-20"
              value={value.yearMax}
              onChange={(e) => set("yearMax", e.target.value)}
            />
          </div>
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
