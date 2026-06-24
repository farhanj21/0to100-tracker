import { POWERTRAIN_TYPES, INDUCTIONS, TRANSMISSIONS } from "@/lib/constants";
import type { CarDTO } from "@/lib/types";

export interface TimeBand {
  /** Display label incl. unit, e.g. "6–7s" or the pooled tail "20s +". */
  label: string;
  count: number;
}

export interface PowertrainStat {
  type: string;
  count: number;
  quickest: CarDTO;
}

export interface ManufacturerStat {
  manufacturer: string;
  count: number;
  quickest: CarDTO;
  mean: number;
}

/** A generic "fastest by X" group — one row of a breakdown. */
export interface CategoryStat {
  label: string;
  count: number;
  quickest: CarDTO;
}

export interface LeaderboardStats {
  count: number;
  quickest: CarDTO;
  slowest: CarDTO;
  mean: number;
  median: number;
  spread: number;
  bands: TimeBand[];
  powertrains: PowertrainStat[];
  induction: CategoryStat[];
  transmission: CategoryStat[];
  decades: CategoryStat[];
  engineBands: CategoryStat[];
  manufacturers: ManufacturerStat[];
  records: {
    quickestManual: CarDTO | null;
    quickestAuto: CarDTO | null;
    quickestNA: CarDTO | null;
    quickestTurbo: CarDTO | null;
    newest: CarDTO;
    oldest: CarDTO;
  };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Every aggregate figure the home strip and the /numbers page share, derived
 * once from the ranked field. `cars` is assumed ranked fastest→slowest (as
 * getRankedCars returns), so the "first match" of any subset is its quickest.
 */
export function leaderboardStats(cars: CarDTO[]): LeaderboardStats {
  const times = cars.map((c) => c.zeroToHundred);
  const quickest = cars[0];
  const slowest = cars[cars.length - 1];

  // One-second time bands across the field. Interior gaps between real clusters
  // are kept (they're part of the shape), but a sparse slow tail — a lone
  // outlier sitting far out past a stretch of empty bands — is pooled into a
  // single "Ns +" bucket so it doesn't pad the chart with empty rows.
  const lo = Math.floor(quickest.zeroToHundred);
  const hi = Math.floor(slowest.zeroToHundred);
  const raw: { start: number; count: number }[] = [];
  for (let b = lo; b <= hi; b++) {
    raw.push({
      start: b,
      count: cars.filter((c) => Math.floor(c.zeroToHundred) === b).length,
    });
  }
  // Find the start of the LAST run of >= 2 empty bands; everything from there
  // (slower) collapses into the tail bucket.
  const TAIL_GAP = 2;
  let tailStart = -1;
  let runStart = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].count === 0) {
      if (runStart === -1) runStart = i;
      if (i - runStart + 1 >= TAIL_GAP) tailStart = runStart;
    } else {
      runStart = -1;
    }
  }
  const bands: TimeBand[] = [];
  const detailEnd = tailStart === -1 ? raw.length : tailStart;
  for (let i = 0; i < detailEnd; i++) {
    bands.push({ label: `${raw[i].start}–${raw[i].start + 1}s`, count: raw[i].count });
  }
  if (tailStart !== -1) {
    const tailCount = raw.slice(tailStart).reduce((s, r) => s + r.count, 0);
    if (tailCount > 0) {
      bands.push({ label: `${raw[tailStart].start}s +`, count: tailCount });
    }
  }

  const powertrains: PowertrainStat[] = [];
  for (const type of POWERTRAIN_TYPES) {
    const of = cars.filter((c) => c.powertrainType === type);
    if (of.length) powertrains.push({ type, count: of.length, quickest: of[0] });
  }
  powertrains.sort((a, b) => b.count - a.count);

  // A "fastest by X" group: cars are fastest-first, so the first match is the
  // group's quickest. Empty groups are dropped.
  const cat = (label: string, pred: (c: CarDTO) => boolean): CategoryStat | null => {
    const of = cars.filter(pred);
    return of.length ? { label, count: of.length, quickest: of[0] } : null;
  };
  const notNull = <T,>(x: T | null): x is T => x !== null;

  const induction: CategoryStat[] = INDUCTIONS.map((i) =>
    cat(i === "NA" ? "Naturally aspirated" : i, (c) => c.induction === i)
  )
    .filter(notNull)
    .sort((a, b) => b.count - a.count);

  const transmission: CategoryStat[] = TRANSMISSIONS.map((t) =>
    cat(t, (c) => c.transmission === t)
  )
    .filter(notNull)
    .sort((a, b) => b.count - a.count);

  // Group by decade ("2010s", "2020s"), oldest first.
  const decadeKeys = Array.from(
    new Set(cars.map((c) => Math.floor(c.modelYear / 10) * 10))
  ).sort((a, b) => a - b);
  const decades: CategoryStat[] = decadeKeys
    .map((d) => cat(`${d}s`, (c) => Math.floor(c.modelYear / 10) * 10 === d))
    .filter(notNull);

  // Engine-size bands, broken out finely at the low end since small-displacement
  // cars (660cc kei, 1.0–1.3 L) dominate the local fleet. engineSize === 0 stands
  // in for electric / no displacement. Empty bands drop out below (`cat` returns
  // null), so the segments only appear when the fleet actually has cars in them.
  const ENGINE_BANDS: { label: string; test: (e: number) => boolean }[] = [
    { label: "Electric / none", test: (e) => e === 0 },
    { label: "Up to 0.8 L", test: (e) => e > 0 && e <= 0.8 },
    { label: "0.8 to 1.0 L", test: (e) => e > 0.8 && e <= 1.0 },
    { label: "1.0 to 1.3 L", test: (e) => e > 1.0 && e <= 1.3 },
    { label: "1.3 to 1.6 L", test: (e) => e > 1.3 && e <= 1.6 },
    { label: "1.6 to 2.0 L", test: (e) => e > 1.6 && e <= 2.0 },
    { label: "2.0 to 3.0 L", test: (e) => e > 2.0 && e <= 3.0 },
    { label: "Over 3.0 L", test: (e) => e > 3.0 },
  ];
  const engineBands: CategoryStat[] = ENGINE_BANDS.map((b) =>
    cat(b.label, (c) => b.test(c.engineSize))
  ).filter(notNull);

  const byMaker = new Map<string, CarDTO[]>();
  for (const c of cars) {
    const list = byMaker.get(c.manufacturer) ?? [];
    list.push(c); // cars are fastest-first, so the list stays sorted too
    byMaker.set(c.manufacturer, list);
  }
  const manufacturers: ManufacturerStat[] = Array.from(byMaker.entries())
    .map(([manufacturer, list]) => ({
      manufacturer,
      count: list.length,
      quickest: list[0],
      mean: mean(list.map((c) => c.zeroToHundred)),
    }))
    .sort((a, b) => a.quickest.zeroToHundred - b.quickest.zeroToHundred);

  const firstWith = (pred: (c: CarDTO) => boolean) => cars.find(pred) ?? null;
  const maxYear = Math.max(...cars.map((c) => c.modelYear));
  const minYear = Math.min(...cars.map((c) => c.modelYear));

  return {
    count: cars.length,
    quickest,
    slowest,
    mean: mean(times),
    median: median(times),
    spread: slowest.zeroToHundred - quickest.zeroToHundred,
    bands,
    powertrains,
    induction,
    transmission,
    decades,
    engineBands,
    manufacturers,
    records: {
      quickestManual: firstWith((c) => c.transmission === "Manual"),
      quickestAuto: firstWith((c) => c.transmission === "Auto"),
      quickestNA: firstWith((c) => c.induction === "NA"),
      quickestTurbo: firstWith((c) => c.induction === "Turbocharged"),
      // Quickest of the newest / oldest year (cars are fastest-first).
      newest: cars.find((c) => c.modelYear === maxYear)!,
      oldest: cars.find((c) => c.modelYear === minYear)!,
    },
  };
}
