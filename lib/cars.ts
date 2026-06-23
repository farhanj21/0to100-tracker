import "server-only";
import dbConnect from "@/lib/db";
import Car from "@/lib/models/Car";
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
  engineSize: number;
  powertrainType: CarDTO["powertrainType"];
  transmission: CarDTO["transmission"];
  induction: CarDTO["induction"];
  zeroToHundred: number;
  media: { type: CarDTO["media"][number]["type"]; path: string }[];
  createdAt: Date;
  updatedAt: Date;
};

/** Convert a lean Mongoose doc into a client-safe DTO (without position). */
function toDTO(doc: LeanCar): Omit<CarDTO, "position"> {
  return {
    id: String(doc._id),
    modelYear: doc.modelYear,
    manufacturer: doc.manufacturer,
    carModel: doc.carModel,
    engineSize: doc.engineSize,
    powertrainType: doc.powertrainType,
    transmission: doc.transmission,
    induction: doc.induction,
    zeroToHundred: doc.zeroToHundred,
    media: (doc.media ?? []).map((m) => ({ type: m.type, path: m.path })),
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

  return docs.map((doc, index) => ({
    ...toDTO(doc),
    position: index + 1,
  }));
}

/** Fetch a single car with its true global position, or null if not found. */
export async function getCarById(id: string): Promise<CarDTO | null> {
  const ranked = await getRankedCars();
  return ranked.find((car) => car.id === id) ?? null;
}

/** Total number of cars on the board (for "X of Y" rank displays). */
export async function getCarCount(): Promise<number> {
  await dbConnect();
  return Car.countDocuments();
}
