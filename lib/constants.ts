/**
 * Shared enums for car attributes. Kept in one place so the Mongoose schema,
 * the zod form validation, and the UI dropdowns can never drift apart.
 */

export const POWERTRAIN_TYPES = [
  "Petrol",
  "Petrol / Hybrid",
  "Petrol / Plug-In Hybrid",
  "Diesel",
] as const;

export const TRANSMISSIONS = ["Auto", "Manual"] as const;

export const INDUCTIONS = ["NA", "Turbocharged"] as const;

export const MEDIA_TYPES = ["image", "video", "youtube"] as const;

export type PowertrainType = (typeof POWERTRAIN_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type Induction = (typeof INDUCTIONS)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];
