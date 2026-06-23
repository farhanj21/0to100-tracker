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

/**
 * The shape sent to the client. `_id` is converted to a string `id`, and
 * `position` is the computed global rank (1 = fastest). Never persisted.
 */
export interface CarDTO {
  id: string;
  modelYear: number;
  manufacturer: string;
  carModel: string;
  engineSize: number;
  powertrainType: PowertrainType;
  transmission: Transmission;
  induction: Induction;
  zeroToHundred: number;
  media: MediaDTO[];
  position: number;
  createdAt: string;
  updatedAt: string;
}
