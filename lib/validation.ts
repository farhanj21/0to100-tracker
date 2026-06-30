import { z } from "zod";
import { FUEL_TYPES, MEDIA_TYPES } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export const mediaSchema = z.object({
  type: z.enum(MEDIA_TYPES),
  path: z.string().min(1),
});

export const specSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export const carInputSchema = z.object({
  modelYear: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year seems too old")
    .max(currentYear + 2, `Year can't be beyond ${currentYear + 2}`),
  manufacturer: z.string().trim().min(1, "Manufacturer is required"),
  carModel: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().max(80).optional().default(""),
  engineSize: z.coerce
    .number()
    .min(0, "Engine size must be 0 or more")
    .max(20, "Engine size seems too large"),
  // Powertrain / induction / transmission are admin-managed lists, so the
  // schema only checks that something was picked; membership in the current
  // list is enforced server-side (see assertValidCarOptions in lib/options.ts).
  powertrainType: z.string().trim().min(1, "Select a powertrain type"),
  // Optional at the field level (electric cars have none); the cross-field
  // refine below makes it required for every non-electric powertrain. An empty
  // string from an unselected dropdown normalizes to undefined so it isn't
  // persisted or validated against the enum.
  fuelType: z
    .union([z.enum(FUEL_TYPES), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  transmission: z.string().trim().min(1, "Select a transmission"),
  induction: z.string().trim().min(1, "Select an induction type"),
  zeroToHundred: z.coerce
    .number()
    .gt(0, "0–100 time must be greater than 0")
    .max(60, "0–100 time seems too slow"),
  media: z.array(mediaSchema).default([]),
  specs: z.array(specSchema).max(60).default([]),
  features: z.array(z.string().trim().min(1).max(120)).max(80).default([]),
  notes: z.string().trim().max(5000).optional().default(""),
}).superRefine((val, ctx) => {
  // Fuel type is required for anything that burns fuel; only fully electric
  // cars may leave it blank.
  if (val.powertrainType !== "Electric" && !val.fuelType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fuelType"],
      message: "Select a fuel type",
    });
  }
});

export type CarInput = z.infer<typeof carInputSchema>;
