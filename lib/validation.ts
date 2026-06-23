import { z } from "zod";
import {
  POWERTRAIN_TYPES,
  TRANSMISSIONS,
  INDUCTIONS,
  MEDIA_TYPES,
} from "@/lib/constants";

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
  powertrainType: z.enum(POWERTRAIN_TYPES, {
    errorMap: () => ({ message: "Select a powertrain type" }),
  }),
  transmission: z.enum(TRANSMISSIONS, {
    errorMap: () => ({ message: "Select a transmission" }),
  }),
  induction: z.enum(INDUCTIONS, {
    errorMap: () => ({ message: "Select an induction type" }),
  }),
  zeroToHundred: z.coerce
    .number()
    .gt(0, "0–100 time must be greater than 0")
    .max(60, "0–100 time seems too slow"),
  media: z.array(mediaSchema).default([]),
  specs: z.array(specSchema).max(60).default([]),
  features: z.array(z.string().trim().min(1).max(120)).max(80).default([]),
});

export type CarInput = z.infer<typeof carInputSchema>;
