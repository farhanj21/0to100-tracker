import "server-only";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
import { getRankedCars } from "@/lib/cars";
import { getOptionsMap } from "@/lib/options";
import { fetchCarSpecs } from "@/lib/specs";
import type { FuelType } from "@/lib/constants";
import {
  MIRROR_HEADER,
  composePowertrainLabel,
  displayName,
  identityKey,
  norm,
  parseSheetValues,
  type MirrorTable,
  type ParsedSheetRow,
  type RowIssue,
} from "@/lib/sheet-format";

/**
 * Two-way Google Sheet sync.
 *
 * Sheet → site (applySheetValues): the sheet's Apps Script posts the whole
 * "Sorted Table" here whenever it changes. Rows carrying a Car ID update that
 * car; rows without one are matched by identity (year+make+name+engine) and
 * either link up with an existing car (no data change — the site wins the
 * first handshake) or become brand-new cars, published immediately with
 * web-grounded AI specs (best effort — a failed lookup never blocks the car).
 *
 * Site → sheet (pushMirrorToSheet): after any car write on the site, the
 * freshly ranked table is pushed to the Apps Script web app, which rewrites
 * the sheet — sorted, positions recomputed, Car IDs maintained. Script-made
 * writes don't fire the sheet's onChange trigger, so the loop can't echo.
 */

export interface SyncReport {
  /** Display names of cars created from new sheet rows. */
  created: string[];
  /** Display names of cars updated from edited sheet rows. */
  updated: string[];
  /** Rows that matched an existing car and only gained its Car ID. */
  linked: number;
  /** Rows already in step with the site. */
  unchanged: number;
  /** New cars whose AI spec lookup didn't run (quota/time/config). */
  aiSkipped: string[];
  /** Per-row problems — the row is skipped, everything else still syncs. */
  issues: RowIssue[];
  /**
   * Non-blank data rows the sheet sent (valid or not). The Apps Script
   * compares this to the mirror's row count to decide whether a write-back is
   * needed (e.g. to restore a deleted row) without clobbering rows mid-typing.
   */
  rowsSeen: number;
}

/** Cap AI enrichment per sync so a big paste can't blow the request budget. */
const AI_CAR_BUDGET = 3;
const AI_DEADLINE_MS = 40_000;

type LeanSyncCar = {
  _id: unknown;
  modelYear: number;
  manufacturer: string;
  carModel: string;
  variant?: string;
  engineSize: number;
  fuelType?: FuelType;
  powertrainType: string;
  transmission: string;
  induction: string;
  zeroToHundred: number;
};

const isElectric = (powertrainType: string) =>
  norm(powertrainType).toLowerCase() === "electric";

/** The sheet-covered fields of `row` differ from what `car` holds. */
function rowDiffers(row: ParsedSheetRow, car: LeanSyncCar): boolean {
  return (
    row.modelYear !== car.modelYear ||
    norm(row.manufacturer) !== norm(car.manufacturer) ||
    norm(row.carModel) !== displayName(car) ||
    row.engineSize !== car.engineSize ||
    row.zeroToHundred !== car.zeroToHundred ||
    row.powertrainType !== car.powertrainType ||
    row.transmission !== car.transmission ||
    row.induction !== car.induction ||
    // Fuel only counts as a change when the row actually names one (a bare
    // "Hybrid" label keeps the car's fuel), or the car went electric.
    (row.fuelType ? row.fuelType !== car.fuelType : isElectric(row.powertrainType) && !!car.fuelType)
  );
}

/**
 * Apply an edited sheet row to its car. Only the sheet-covered fields are
 * touched — media, specs, features and notes stay as they are on the site.
 * A renamed "Car Model" cell becomes the whole carModel (variant folds in).
 */
async function applyRowToCar(row: ParsedSheetRow, car: LeanSyncCar) {
  const nameChanged = norm(row.carModel) !== displayName(car);
  const fuelType = row.fuelType ?? (isElectric(row.powertrainType) ? undefined : car.fuelType);

  const set: Record<string, unknown> = {
    modelYear: row.modelYear,
    manufacturer: row.manufacturer,
    engineSize: row.engineSize,
    powertrainType: row.powertrainType,
    transmission: row.transmission,
    induction: row.induction,
    zeroToHundred: row.zeroToHundred,
    ...(nameChanged ? { carModel: row.carModel, variant: "" } : {}),
    ...(fuelType ? { fuelType } : {}),
  };

  await Car.updateOne(
    { _id: car._id },
    fuelType ? { $set: set } : { $set: set, $unset: { fuelType: "" } }
  );
}

/**
 * Create a car from a new sheet row. When `attemptAi` is set, the specs
 * pipeline (web-grounded Gemini) fills fuel type, the extended spec sheet and
 * features before the car is saved; any failure just means those start empty.
 */
async function createCarFromRow(
  row: ParsedSheetRow,
  attemptAi: boolean,
  aiState: { disabled: boolean },
  report: SyncReport
): Promise<LeanSyncCar> {
  const name = displayName({ carModel: row.carModel });
  let fuelType = row.fuelType;
  let specs: { label: string; value: string }[] = [];
  let features: string[] = [];

  if (attemptAi) {
    try {
      const result = await fetchCarSpecs({
        manufacturer: row.manufacturer,
        carModel: row.carModel,
        modelYear: row.modelYear,
      });
      specs = result.specs;
      features = result.features;
      if (!fuelType && result.fuelType) fuelType = result.fuelType;
    } catch (err) {
      console.warn(`Sheet sync: spec lookup failed for "${name}":`, err);
      report.aiSkipped.push(name);
      // A configuration error will fail for every car — stop trying.
      if (err instanceof Error && err.message.includes("isn't configured")) {
        aiState.disabled = true;
      }
    }
  } else {
    report.aiSkipped.push(name);
  }

  if (!fuelType && !isElectric(row.powertrainType)) {
    // The label didn't name a fuel and the lookup couldn't determine one; the
    // schema requires a fuel for combustion cars, so assume the common case.
    fuelType = "Petrol";
    report.issues.push({
      row: row.rowNumber,
      message: `Fuel type for "${name}" was assumed to be Petrol — edit the car on the site if that's wrong.`,
    });
  }

  const created = await Car.create({
    modelYear: row.modelYear,
    manufacturer: row.manufacturer,
    carModel: row.carModel,
    variant: "",
    engineSize: row.engineSize,
    ...(fuelType ? { fuelType } : {}),
    powertrainType: row.powertrainType,
    transmission: row.transmission,
    induction: row.induction,
    zeroToHundred: row.zeroToHundred,
    media: [],
    specs,
    features,
    notes: "",
  });

  return {
    _id: created._id,
    modelYear: row.modelYear,
    manufacturer: row.manufacturer,
    carModel: row.carModel,
    variant: "",
    engineSize: row.engineSize,
    fuelType,
    powertrainType: row.powertrainType,
    transmission: row.transmission,
    induction: row.induction,
    zeroToHundred: row.zeroToHundred,
  };
}

/**
 * Diff the posted sheet against the database and apply the changes.
 * May throw SheetFormatError (unusable header) — callers map that to a 400.
 */
export async function applySheetValues(
  values: unknown[][]
): Promise<SyncReport> {
  await dbConnect();
  const options = await getOptionsMap();
  const { rows, issues } = parseSheetValues(values, options);

  const report: SyncReport = {
    created: [],
    updated: [],
    linked: 0,
    unchanged: 0,
    aiSkipped: [],
    issues,
    rowsSeen: rows.length + issues.length,
  };

  const docs = await Car.find().lean<LeanSyncCar[]>();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  const byKey = new Map(docs.map((d) => [identityKey(d), d]));

  const aiState = { disabled: false };
  const aiDeadline = Date.now() + AI_DEADLINE_MS;
  let aiAttempts = 0;
  const seenIds = new Set<string>();

  for (const row of rows) {
    const name = displayName({ carModel: row.carModel });

    // Rows carrying a Car ID are authoritative edits of that exact car —
    // renames and year fixes update it instead of spawning a duplicate.
    if (row.id && byId.has(row.id)) {
      if (seenIds.has(row.id)) {
        report.issues.push({
          row: row.rowNumber,
          message: `Duplicate Car ID — when copying a row to add a similar car, clear its Car ID cell.`,
        });
        continue;
      }
      seenIds.add(row.id);

      const car = byId.get(row.id)!;
      if (rowDiffers(row, car)) {
        await applyRowToCar(row, car);
        report.updated.push(name);
      } else {
        report.unchanged++;
      }
      continue;
    }

    // No (known) ID: match by identity. A hit only links the row to the car —
    // the site's data wins the first handshake; the write-back adds the ID.
    const existing = byKey.get(identityKey({ carModel: row.carModel, manufacturer: row.manufacturer, modelYear: row.modelYear, engineSize: row.engineSize }));
    if (existing) {
      report.linked++;
      continue;
    }

    // Genuinely new car.
    const attemptAi =
      !aiState.disabled &&
      aiAttempts < AI_CAR_BUDGET &&
      Date.now() <= aiDeadline;
    if (attemptAi) aiAttempts++;
    const createdCar = await createCarFromRow(row, attemptAi, aiState, report);

    report.created.push(name);
    byId.set(String(createdCar._id), createdCar);
    byKey.set(identityKey(createdCar), createdCar);
  }

  return report;
}

// ---------------------------------------------------------------------------
// Site → sheet mirror
// ---------------------------------------------------------------------------

/** The canonical "Sorted Table": ranked cars, combined powertrain labels, IDs. */
export async function buildMirrorTable(): Promise<MirrorTable> {
  const cars = await getRankedCars();
  return {
    header: [...MIRROR_HEADER],
    rows: cars.map((car) => [
      car.position,
      car.modelYear,
      car.manufacturer,
      displayName(car),
      car.engineSize,
      composePowertrainLabel(car.fuelType, car.powertrainType),
      car.transmission,
      car.induction,
      car.zeroToHundred,
      car.id,
    ]),
  };
}

/** Whether the site → sheet push half of the sync is configured. */
export function isMirrorConfigured(): boolean {
  return Boolean(process.env.SHEET_WEBAPP_URL && process.env.SHEET_SYNC_SECRET);
}

/**
 * Push the current leaderboard to the sheet via the Apps Script web app.
 * Throws on failure — use mirrorToSheetSafe from route handlers.
 */
export async function pushMirrorToSheet(): Promise<void> {
  const url = process.env.SHEET_WEBAPP_URL;
  const secret = process.env.SHEET_SYNC_SECRET;
  if (!url || !secret) return; // sync not configured — quietly do nothing

  const mirror = await buildMirrorTable();

  // Apps Script answers via a 302 to script.googleusercontent.com; fetch
  // follows it. text/plain keeps the payload readable as e.postData.contents.
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, action: "mirror", mirror }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  const text = await res.text();
  let ok = false;
  try {
    ok = res.ok && Boolean((JSON.parse(text) as { ok?: boolean }).ok);
  } catch {
    ok = false;
  }
  if (!ok) {
    throw new Error(
      `Sheet mirror push failed (HTTP ${res.status}): ${text.slice(0, 200)}`
    );
  }
}

/**
 * Fire the mirror push without letting a sheet hiccup break the car write the
 * admin just made — failures are logged and the next successful write (or
 * sheet-side sync) heals any drift.
 */
export async function mirrorToSheetSafe(context: string): Promise<void> {
  try {
    await pushMirrorToSheet();
  } catch (err) {
    console.error(`Sheet mirror push failed (${context}):`, err);
  }
}

// ---------------------------------------------------------------------------
// Endpoint auth
// ---------------------------------------------------------------------------

/** Constant-time check of the shared secret sent by the Apps Script. */
export function verifySyncSecret(provided: unknown): boolean {
  const expected = process.env.SHEET_SYNC_SECRET;
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
