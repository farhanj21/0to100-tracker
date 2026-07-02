import { z } from "zod";
// Relative (not "@/lib/…") so plain-node scripts/tests can import this module
// without path-alias resolution.
import { FUEL_TYPES, type FuelType } from "./constants";

/**
 * Pure helpers for the Google Sheet two-way sync: header detection, row
 * parsing/validation, the combined "Powertrain Type" label format, and identity
 * keys for matching sheet rows to cars. No database or network access here —
 * lib/sheet-sync.ts composes these with Mongo + Gemini. Kept free of
 * "server-only" so the logic can be exercised by plain scripts/tests.
 */

/** Canonical column order written back to the sheet (mirror writes). */
export const MIRROR_HEADER = [
  "Positions",
  "Model Year",
  "Manufacturer",
  "Car Model",
  "Engine Size (L)",
  "Powertrain Type",
  "Transmission",
  "Induction",
  "0-100 km/h (s)",
  "Car ID",
] as const;

/** Thrown when the sheet's structure (not a single row) is unusable. */
export class SheetFormatError extends Error {}

export interface SheetOptionLists {
  powertrain: string[];
  transmission: string[];
  induction: string[];
}

export interface ParsedSheetRow {
  /** 1-based sheet row number, for readable issue messages. */
  rowNumber: number;
  /** Mongo id from the hidden Car ID column, or null for rows without one. */
  id: string | null;
  modelYear: number;
  manufacturer: string;
  carModel: string;
  engineSize: number;
  /** Undefined when the label didn't name a fuel (bare "Hybrid", "Electric"). */
  fuelType?: FuelType;
  powertrainType: string;
  transmission: string;
  induction: string;
  zeroToHundred: number;
}

export interface RowIssue {
  row: number;
  message: string;
}

export interface MirrorTable {
  header: string[];
  rows: (string | number)[][];
}

/** Collapse whitespace and trim. */
export const norm = (s: string) => s.replace(/\s+/g, " ").trim();

const keyNorm = (s: string) => norm(s).toLowerCase();

/** "Tiggo 8" + variant "Pro" → "Tiggo 8 Pro" — the name shown in the sheet. */
export function displayName(car: { carModel: string; variant?: string }) {
  return norm(`${car.carModel} ${car.variant ?? ""}`);
}

/**
 * Identity used to match ID-less sheet rows to existing cars:
 * year + manufacturer + full name + engine size, all normalized.
 */
export function identityKey(car: {
  modelYear: number;
  manufacturer: string;
  carModel: string;
  variant?: string;
  engineSize: number;
}) {
  return [
    car.modelYear,
    keyNorm(car.manufacturer),
    keyNorm(displayName(car)),
    String(Math.round(car.engineSize * 100) / 100),
  ].join("|");
}

/** Case-insensitive lookup returning the option's canonical casing. */
function findOption(list: string[], raw: string): string | null {
  const target = keyNorm(raw);
  return list.find((v) => keyNorm(v) === target) ?? null;
}

const FUEL_BY_KEY = new Map<string, FuelType>(
  FUEL_TYPES.map((f) => [f.toLowerCase(), f])
);

/**
 * Parse the sheet's combined "Powertrain Type" label into the site's split
 * fuel + powertrain model. Examples (with the default option list):
 *   "Petrol"                  → { fuelType: "Petrol", powertrainType: "ICE" }
 *   "Diesel"                  → { fuelType: "Diesel", powertrainType: "ICE" }
 *   "Petrol / Hybrid"         → { fuelType: "Petrol", powertrainType: "Hybrid" }
 *   "Petrol / Plug-In Hybrid" → { fuelType: "Petrol", powertrainType: "Plug-In Hybrid" }
 *   "Electric"                → { powertrainType: "Electric" }
 *   "Hybrid"                  → { powertrainType: "Hybrid" } (fuel resolved later)
 * Returns null when the label can't be mapped onto the current option list.
 */
export function splitPowertrainLabel(
  label: string,
  powertrainOptions: string[]
): { fuelType?: FuelType; powertrainType: string } | null {
  const parts = label
    .split("/")
    .map(norm)
    .filter(Boolean);

  if (parts.length === 1) {
    const fuel = FUEL_BY_KEY.get(parts[0].toLowerCase());
    if (fuel) {
      const ice = findOption(powertrainOptions, "ICE");
      return ice ? { fuelType: fuel, powertrainType: ice } : null;
    }
    const pt = findOption(powertrainOptions, parts[0]);
    return pt ? { powertrainType: pt } : null;
  }

  if (parts.length === 2) {
    for (const [a, b] of [
      [parts[0], parts[1]],
      [parts[1], parts[0]],
    ]) {
      const fuel = FUEL_BY_KEY.get(a.toLowerCase());
      const pt = findOption(powertrainOptions, b);
      if (fuel && pt) return { fuelType: fuel, powertrainType: pt };
    }
  }

  return null;
}

/**
 * Inverse of splitPowertrainLabel: compose the site's split fields back into
 * the sheet's combined label ("Petrol", "Petrol / Hybrid", "Electric", …).
 */
export function composePowertrainLabel(
  fuelType: string | undefined,
  powertrainType: string
): string {
  if (!fuelType) return powertrainType;
  if (keyNorm(powertrainType) === "ice") return fuelType;
  return `${fuelType} / ${powertrainType}`;
}

// ---------------------------------------------------------------------------
// Header + row parsing
// ---------------------------------------------------------------------------

/** Lowercase and strip everything non-alphanumeric: "0-100 km/h (s)" → "0100kmhs". */
const canonHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

type ColumnKey =
  | "modelYear"
  | "manufacturer"
  | "carModel"
  | "engineSize"
  | "powertrain"
  | "transmission"
  | "induction"
  | "zeroToHundred"
  | "id";

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  modelYear: ["modelyear", "year"],
  manufacturer: ["manufacturer", "make", "brand"],
  carModel: ["carmodel", "model"],
  engineSize: ["enginesizel", "enginesize"],
  powertrain: ["powertraintype", "powertrain"],
  transmission: ["transmission", "gearbox"],
  induction: ["induction", "aspiration"],
  zeroToHundred: ["0100kmhs", "0100kmh", "0100s", "zerotohundred"],
  id: ["carid"],
};

const REQUIRED_COLUMNS: ColumnKey[] = [
  "modelYear",
  "manufacturer",
  "carModel",
  "engineSize",
  "powertrain",
  "transmission",
  "induction",
  "zeroToHundred",
];

function mapColumns(headerRow: unknown[]): Partial<Record<ColumnKey, number>> {
  const canon = headerRow.map((cell) => canonHeader(String(cell ?? "")));
  const map: Partial<Record<ColumnKey, number>> = {};
  for (const key of Object.keys(COLUMN_ALIASES) as ColumnKey[]) {
    const idx = canon.findIndex((c) => COLUMN_ALIASES[key].includes(c));
    if (idx !== -1) map[key] = idx;
  }
  return map;
}

const cellString = (v: unknown) => norm(String(v ?? ""));

function cellNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const s = cellString(v).replace(",", ".");
  return s ? Number(s) : NaN;
}

// Same bounds as carInputSchema, minus the fields a sheet row doesn't carry.
const currentYear = new Date().getFullYear();
const rowBoundsSchema = z.object({
  modelYear: z
    .number()
    .int(`Model Year must be a whole number`)
    .min(1900, "Model Year seems too old")
    .max(currentYear + 2, `Model Year can't be beyond ${currentYear + 2}`),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  carModel: z.string().min(1, "Car Model is required"),
  engineSize: z
    .number()
    .min(0, "Engine Size must be 0 or more")
    .max(20, "Engine Size seems too large"),
  zeroToHundred: z
    .number()
    .gt(0, "0-100 time must be greater than 0")
    .max(60, "0-100 time seems too slow"),
});

/**
 * Parse raw sheet values (header row included) into normalized rows. Rows that
 * can't be parsed become issues rather than failing the sync; a missing/renamed
 * required column throws SheetFormatError since nothing can be trusted then.
 */
export function parseSheetValues(
  values: unknown[][],
  options: SheetOptionLists
): { rows: ParsedSheetRow[]; issues: RowIssue[] } {
  if (!values.length) {
    throw new SheetFormatError("The sheet is empty — the header row is missing.");
  }

  const cols = mapColumns(values[0]);
  const missing = REQUIRED_COLUMNS.filter((k) => cols[k] === undefined);
  if (missing.length) {
    throw new SheetFormatError(
      `Couldn't find the column(s): ${missing.join(", ")}. ` +
        `Expected headers like: ${MIRROR_HEADER.slice(1, 9).join(" · ")}.`
    );
  }

  const rows: ParsedSheetRow[] = [];
  const issues: RowIssue[] = [];

  for (let i = 1; i < values.length; i++) {
    const raw = values[i];
    const rowNumber = i + 1;
    const at = (key: ColumnKey) =>
      cols[key] === undefined ? "" : raw[cols[key]!];

    const manufacturer = cellString(at("manufacturer"));
    const carModel = cellString(at("carModel"));
    const yearCell = cellString(at("modelYear"));
    const timeCell = cellString(at("zeroToHundred"));

    // Fully blank line (spacer/trailing row) — skip silently.
    if (!manufacturer && !carModel && !yearCell && !timeCell) continue;

    const bounds = rowBoundsSchema.safeParse({
      modelYear: cellNumber(at("modelYear")),
      manufacturer,
      carModel,
      engineSize: cellNumber(at("engineSize")),
      zeroToHundred: cellNumber(at("zeroToHundred")),
    });
    if (!bounds.success) {
      issues.push({
        row: rowNumber,
        message: bounds.error.issues[0]?.message ?? "Row has invalid values",
      });
      continue;
    }

    const powertrainLabel = cellString(at("powertrain"));
    const split = splitPowertrainLabel(powertrainLabel, options.powertrain);
    if (!split) {
      issues.push({
        row: rowNumber,
        message:
          `Powertrain Type "${powertrainLabel}" isn't recognized — use e.g. ` +
          `"Petrol", "Diesel", "Petrol / Hybrid", "Petrol / Plug-In Hybrid" or "Electric".`,
      });
      continue;
    }

    const transmission = findOption(
      options.transmission,
      cellString(at("transmission"))
    );
    if (!transmission) {
      issues.push({
        row: rowNumber,
        message: `Transmission "${cellString(at("transmission"))}" isn't one of: ${options.transmission.join(", ")}.`,
      });
      continue;
    }

    const induction = findOption(options.induction, cellString(at("induction")));
    if (!induction) {
      issues.push({
        row: rowNumber,
        message: `Induction "${cellString(at("induction"))}" isn't one of: ${options.induction.join(", ")}.`,
      });
      continue;
    }

    const id = cols.id === undefined ? "" : cellString(raw[cols.id]);

    rows.push({
      rowNumber,
      id: id || null,
      ...bounds.data,
      ...split,
      transmission,
      induction,
    });
  }

  return { rows, issues };
}
