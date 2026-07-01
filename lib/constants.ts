/**
 * Shared car-attribute enums that are FIXED in code (fuel + media type), kept in
 * one place so the Mongoose schema, the zod validation, and the UI dropdowns can
 * never drift apart.
 *
 * Powertrain, induction and transmission are NOT here — they're admin-managed at
 * runtime and stored in the database (see lib/models/Option.ts + lib/options.ts).
 * Their TypeScript types are therefore plain strings; their default lists live
 * in DEFAULT_OPTIONS.
 */

// The combustion fuel. Not applicable to fully electric cars, so on a car it is
// optional (omitted when powertrainType is "Electric").
export const FUEL_TYPES = ["Petrol", "Diesel"] as const;

export const MEDIA_TYPES = ["image", "video", "youtube"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];

// Admin-managed, free-form at the type level (validated at runtime against the
// current option lists, see lib/options.ts).
export type PowertrainType = string;
export type Transmission = string;
export type Induction = string;
