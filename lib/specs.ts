import "server-only";
import { z } from "zod";
import {
  FUEL_TYPES,
  POWERTRAIN_TYPES,
  TRANSMISSIONS,
  INDUCTIONS,
} from "@/lib/constants";
import { geminiGenerateJSON } from "@/lib/gemini";
import type { CarSpecsResult } from "@/lib/types";

const currentYear = new Date().getFullYear();

/**
 * Validates the model's JSON. Every field is nullable — the model returns null
 * for anything it isn't confident about. This is the safety net: anything
 * off-shape (bad enum, out-of-range number) is rejected before it reaches the
 * form. `zeroToHundredHint` is a reference figure only.
 */
const specPairSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export const specsResultSchema = z.object({
  modelYear: z.number().int().min(1900).max(currentYear + 2).nullable(),
  engineSize: z.number().min(0).max(20).nullable(),
  fuelType: z.enum(FUEL_TYPES).nullable(),
  powertrainType: z.enum(POWERTRAIN_TYPES).nullable(),
  transmission: z.enum(TRANSMISSIONS).nullable(),
  induction: z.enum(INDUCTIONS).nullable(),
  zeroToHundredHint: z.number().min(0).max(120).nullable(),
  // Extended specs + features. Nullish so a null/omitted array still parses.
  specs: z.array(specPairSchema).max(60).nullish(),
  features: z.array(z.string().trim().min(1).max(120)).max(80).nullish(),
  notes: z.string().nullable(),
  sourceSummary: z.string().nullable(),
});

// OpenAPI-subset schema handed to Gemini so the raw output is already well-shaped.
const responseSchema = {
  type: "object",
  properties: {
    modelYear: { type: "integer", nullable: true },
    engineSize: { type: "number", nullable: true },
    fuelType: { type: "string", enum: [...FUEL_TYPES], nullable: true },
    powertrainType: { type: "string", enum: [...POWERTRAIN_TYPES], nullable: true },
    transmission: { type: "string", enum: [...TRANSMISSIONS], nullable: true },
    induction: { type: "string", enum: [...INDUCTIONS], nullable: true },
    zeroToHundredHint: { type: "number", nullable: true },
    specs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
      },
    },
    features: { type: "array", items: { type: "string" } },
    notes: { type: "string", nullable: true },
    sourceSummary: { type: "string", nullable: true },
  },
  required: [
    "modelYear",
    "engineSize",
    "fuelType",
    "powertrainType",
    "transmission",
    "induction",
    "zeroToHundredHint",
    "specs",
    "features",
    "notes",
    "sourceSummary",
  ],
};

export interface FetchSpecsInput {
  manufacturer: string;
  carModel: string;
  variant?: string;
  modelYear?: number;
}

export async function fetchCarSpecs(
  input: FetchSpecsInput
): Promise<CarSpecsResult> {
  const { manufacturer, carModel, variant, modelYear } = input;
  const label = `${modelYear ? `${modelYear} ` : ""}${manufacturer} ${carModel}${
    variant ? ` ${variant}` : ""
  }`.trim();

  const system = [
    "You are an automotive specifications assistant. Given a car, return its specifications and features as JSON.",
    "Core fields (used to fill the form):",
    `- powertrainType must be exactly one of: ${POWERTRAIN_TYPES.join(", ")} (ICE = pure internal-combustion, no electric assist; Hybrid = self-charging/mild/full hybrid; Plug-In Hybrid = PHEV; Electric = battery electric, no combustion engine).`,
    `- fuelType is the combustion fuel and must be exactly one of: ${FUEL_TYPES.join(", ")}. Use null ONLY for a fully Electric powertrain; for ICE, Hybrid and Plug-In Hybrid give the fuel the engine burns.`,
    `- transmission must be exactly one of: ${TRANSMISSIONS.join(", ")} (Auto = automatic, CVT, DCT, or AMT; Manual = manual).`,
    `- induction must be exactly one of: ${INDUCTIONS.join(", ")} (NA = naturally aspirated; Turbocharged = any forced induction, i.e. turbo or supercharged).`,
    "- engineSize is the engine displacement in litres as a number (e.g. 1.3, 2.0). Use null if unknown or not applicable.",
    "- zeroToHundredHint is the approximate 0-100 km/h time in seconds as a number, or null if unsure. Reference only.",
    "- modelYear: echo the provided year if given; otherwise the most likely model year, or null.",
    "",
    "Extended data:",
    "- specs: a COMPREHENSIVE list of additional specifications as { label, value } string pairs.",
    "  Include as many as you can confidently provide, e.g. Power, Torque, 0-100 km/h, Top speed,",
    "  Drivetrain, Cylinders, Fuel type, Fuel economy, CO2, Kerb weight, Length, Width, Height,",
    "  Wheelbase, Boot space, Seating capacity, Doors, Body type, Tyre size, Brakes, Suspension,",
    "  Fuel tank, Price (new). Keep label short and value concise WITH units (e.g. '389 hp', '450 Nm',",
    "  '250 km/h', '1640 kg', '4519 mm'). Do NOT duplicate the core fields above. Omit any you are unsure of.",
    "- features: a list of notable equipment/feature highlights as short strings (e.g. 'Adaptive cruise",
    "  control', 'LED matrix headlights', 'Lane-keep assist', 'Heated seats', 'Wireless CarPlay').",
    "",
    "- notes: one short sentence of caveats (e.g. trim or market variation), or null.",
    "- sourceSummary: a brief note on the basis for these figures (e.g. 'manufacturer specifications / general knowledge'), or null.",
    "Only include values you are reasonably confident about. Use null (core fields) or omit (specs/features) rather than guessing. Never fabricate data.",
  ].join("\n");

  const user = `Provide the full specifications and features for: ${label}`;

  const raw = await geminiGenerateJSON(system, user, responseSchema);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("Couldn't read the data returned. Please try again.");
  }

  const result = specsResultSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error("The returned data didn't match the expected format.");
  }

  // Normalize the nullish arrays to plain arrays for the client.
  return {
    ...result.data,
    specs: result.data.specs ?? [],
    features: result.data.features ?? [],
  };
}
