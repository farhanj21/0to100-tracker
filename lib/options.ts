import "server-only";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
import Option, {
  OPTION_CATEGORIES,
  type OptionCategory,
} from "@/lib/models/Option";

export { OPTION_CATEGORIES };
export type { OptionCategory };

export type OptionsMap = Record<OptionCategory, string[]>;

/** Default lists, used to seed the DB on first access. */
export const DEFAULT_OPTIONS: OptionsMap = {
  powertrain: ["ICE", "Hybrid", "Plug-In Hybrid", "Electric"],
  induction: ["NA", "Turbocharged"],
  transmission: ["Auto", "Manual"],
};

/** Human label per category, for UI headings and error messages. */
export const CATEGORY_LABEL: Record<OptionCategory, string> = {
  powertrain: "Powertrain",
  induction: "Induction",
  transmission: "Transmission",
};

/** The Car field each category controls (for cascade rename + validation). */
const CATEGORY_FIELD: Record<
  OptionCategory,
  "powertrainType" | "induction" | "transmission"
> = {
  powertrain: "powertrainType",
  induction: "induction",
  transmission: "transmission",
};

const MAX_VALUE_LEN = 40;
const MAX_VALUES = 40;

/** Thrown for user-facing validation failures (mapped to HTTP 400 by callers). */
export class OptionError extends Error {}

/**
 * Lazily fetch (and seed) one category's values, preserving order. An upsert
 * with $setOnInsert makes first-read seeding race-safe under the unique index.
 */
async function getValues(category: OptionCategory): Promise<string[]> {
  const doc = await Option.findOneAndUpdate(
    { category },
    { $setOnInsert: { category, values: DEFAULT_OPTIONS[category] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<{ values: string[] }>();
  return doc?.values ?? [...DEFAULT_OPTIONS[category]];
}

/** All managed lists at once. Seeds any missing category from DEFAULT_OPTIONS. */
export async function getOptionsMap(): Promise<OptionsMap> {
  await dbConnect();
  const entries = await Promise.all(
    OPTION_CATEGORIES.map(async (c) => [c, await getValues(c)] as const)
  );
  return Object.fromEntries(entries) as OptionsMap;
}

/** Append a new value to a category. Rejects blanks and case-insensitive dupes. */
export async function addOptionValue(
  category: OptionCategory,
  raw: string
): Promise<string[]> {
  await dbConnect();
  const value = raw.trim();
  if (!value) throw new OptionError("Value can't be empty");
  if (value.length > MAX_VALUE_LEN)
    throw new OptionError(`Keep it under ${MAX_VALUE_LEN} characters`);

  const values = await getValues(category);
  if (values.length >= MAX_VALUES) throw new OptionError("That list is full");
  if (values.some((v) => v.toLowerCase() === value.toLowerCase()))
    throw new OptionError(`"${value}" already exists`);

  const next = [...values, value];
  await Option.updateOne({ category }, { $set: { values: next } });
  return next;
}

/**
 * Rename an existing value and cascade the change to every car using it, so the
 * board's data never drifts out of sync with the list.
 */
export async function renameOptionValue(
  category: OptionCategory,
  oldRaw: string,
  newRaw: string
): Promise<string[]> {
  await dbConnect();
  const oldValue = oldRaw.trim();
  const newValue = newRaw.trim();
  if (!newValue) throw new OptionError("Value can't be empty");
  if (newValue.length > MAX_VALUE_LEN)
    throw new OptionError(`Keep it under ${MAX_VALUE_LEN} characters`);

  const values = await getValues(category);
  const idx = values.findIndex((v) => v === oldValue);
  if (idx === -1) throw new OptionError(`"${oldValue}" doesn't exist`);
  if (newValue === oldValue) return values; // no-op rename
  if (
    values.some(
      (v, i) => i !== idx && v.toLowerCase() === newValue.toLowerCase()
    )
  )
    throw new OptionError(`"${newValue}" already exists`);

  const next = [...values];
  next[idx] = newValue;
  await Option.updateOne({ category }, { $set: { values: next } });

  // Cascade to every car currently holding the old value.
  const field = CATEGORY_FIELD[category];
  await Car.updateMany({ [field]: oldValue }, { $set: { [field]: newValue } });

  return next;
}

/**
 * Validate that the powertrain / induction / transmission values submitted for
 * a car are members of the current lists. Throws OptionError on the first miss.
 */
export async function assertValidCarOptions(input: {
  powertrainType: string;
  induction: string;
  transmission: string;
}): Promise<void> {
  const map = await getOptionsMap();
  const checks: [OptionCategory, string][] = [
    ["powertrain", input.powertrainType],
    ["induction", input.induction],
    ["transmission", input.transmission],
  ];
  for (const [cat, val] of checks) {
    if (!map[cat].includes(val)) {
      throw new OptionError(
        `"${val}" is not a valid ${CATEGORY_LABEL[cat]} option`
      );
    }
  }
}
