import "server-only";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
import { carSlug } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/**
 * A lean Car document straight from Mongoose, before serialization.
 * `_id` is an ObjectId and dates are Date objects.
 */
type LeanCar = {
  _id: unknown;
  modelYear: number;
  manufacturer: string;
  carModel: string;
  variant?: string;
  engineSize: number;
  powertrainType: CarDTO["powertrainType"];
  transmission: CarDTO["transmission"];
  induction: CarDTO["induction"];
  zeroToHundred: number;
  media: { type: CarDTO["media"][number]["type"]; path: string }[];
  specs?: { label: string; value: string }[];
  features?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Convert a lean Mongoose doc into a client-safe DTO (position + slug added later). */
function toDTO(doc: LeanCar): Omit<CarDTO, "position" | "slug"> {
  return {
    id: String(doc._id),
    modelYear: doc.modelYear,
    manufacturer: doc.manufacturer,
    carModel: doc.carModel,
    variant: doc.variant ?? "",
    engineSize: doc.engineSize,
    powertrainType: doc.powertrainType,
    transmission: doc.transmission,
    induction: doc.induction,
    zeroToHundred: doc.zeroToHundred,
    media: (doc.media ?? []).map((m) => ({ type: m.type, path: m.path })),
    specs: (doc.specs ?? []).map((s) => ({ label: s.label, value: s.value })),
    features: doc.features ?? [],
    notes: doc.notes ?? "",
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/**
 * Fetch every car sorted fastest → slowest and assign a computed `position`.
 * Position is NEVER stored — it is derived here on every read so adding or
 * editing a car automatically re-ranks the board. Ties (equal times) are
 * broken by manufacturer/model so ordering stays stable across requests.
 */
export async function getRankedCars(): Promise<CarDTO[]> {
  await dbConnect();
  const docs = await Car.find()
    .sort({ zeroToHundred: 1, manufacturer: 1, carModel: 1 })
    .lean<LeanCar[]>();

  const base = docs.map((doc, index) => ({
    ...toDTO(doc),
    position: index + 1,
  }));

  // Assign readable slugs (year-make-model). If two cars produce the same slug,
  // disambiguate every colliding one with a short id suffix so links stay unique.
  const slugCounts = new Map<string, number>();
  for (const car of base) {
    const s = carSlug(car);
    slugCounts.set(s, (slugCounts.get(s) ?? 0) + 1);
  }
  return base.map((car) => {
    const s = carSlug(car);
    const slug = (slugCounts.get(s) ?? 0) > 1 ? `${s}-${car.id.slice(-6)}` : s;
    return { ...car, slug };
  });
}

/** Fetch a single car with its true global position, or null if not found. */
export async function getCarById(id: string): Promise<CarDTO | null> {
  const ranked = await getRankedCars();
  return ranked.find((car) => car.id === id) ?? null;
}

/**
 * Resolve a car by its readable slug, falling back to a raw id for backward
 * compatibility with old bookmarked/shared id URLs. Returns null if not found.
 */
export async function getCarBySlug(slugOrId: string): Promise<CarDTO | null> {
  const ranked = await getRankedCars();
  return (
    ranked.find((car) => car.slug === slugOrId) ??
    ranked.find((car) => car.id === slugOrId) ??
    null
  );
}

/** Total number of cars on the board (for "X of Y" rank displays). */
export async function getCarCount(): Promise<number> {
  await dbConnect();
  return Car.countDocuments();
}
