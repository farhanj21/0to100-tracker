import type {
  PowertrainType,
  Transmission,
  Induction,
  MediaType,
} from "@/lib/constants";

export interface MediaDTO {
  type: MediaType;
  path: string;
}

/** A free-form spec sheet entry, e.g. { label: "Power", value: "389 hp" }. */
export interface SpecPair {
  label: string;
  value: string;
}

/**
 * The shape sent to the client. `_id` is converted to a string `id`, and
 * `position` is the computed global rank (1 = fastest). Never persisted.
 */
export interface CarDTO {
  id: string;
  modelYear: number;
  manufacturer: string;
  carModel: string;
  variant: string;
  engineSize: number;
  powertrainType: PowertrainType;
  transmission: Transmission;
  induction: Induction;
  zeroToHundred: number;
  media: MediaDTO[];
  specs: SpecPair[];
  features: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Result of an auto-fill spec lookup (free Gemini tier). Every field is
 * nullable — the model returns null for anything it isn't confident about.
 * `zeroToHundredHint` is a reference figure only; it is never written into the
 * leaderboard's `zeroToHundred` automatically.
 */
export interface CarSpecsResult {
  modelYear: number | null;
  engineSize: number | null;
  powertrainType: PowertrainType | null;
  transmission: Transmission | null;
  induction: Induction | null;
  zeroToHundredHint: number | null;
  /** Extended spec sheet (power, torque, dimensions, economy, …). */
  specs: SpecPair[];
  /** Notable equipment/feature highlights. */
  features: string[];
  notes: string | null;
  sourceSummary: string | null;
}
