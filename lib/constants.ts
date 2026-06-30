/**
 * Shared enums for car attributes. Kept in one place so the Mongoose schema,
 * the zod form validation, and the UI dropdowns can never drift apart.
 */

// The combustion fuel. Not applicable to fully electric cars, so on a car it is
// optional (omitted when powertrainType is "Electric").
export const FUEL_TYPES = ["Petrol", "Diesel"] as const;

export const POWERTRAIN_TYPES = [
  "ICE",
  "Hybrid",
  "Plug-In Hybrid",
  "Electric",
] as const;

export const TRANSMISSIONS = ["Auto", "Manual"] as const;

export const INDUCTIONS = ["NA", "Turbocharged"] as const;

export const MEDIA_TYPES = ["image", "video", "youtube"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];
export type PowertrainType = (typeof POWERTRAIN_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type Induction = (typeof INDUCTIONS)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];
