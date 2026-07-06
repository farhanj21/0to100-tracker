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

/* ------------------------- public submissions ------------------------- */

/**
 * Proof media on a public submission. Only real uploads (image/video) are
 * accepted — no YouTube links — and the path must be a Cloudinary URL our own
 * upload route produced, so a submitter can't attach arbitrary external URLs.
 */
export const submissionMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  path: z
    .string()
    .min(1)
    .max(500)
    .refine((p) => p.startsWith("https://res.cloudinary.com/"), {
      message: "Media must be uploaded through the site",
    }),
});

/** Optional number fields arrive as "" from empty inputs — treat that as unset. */
const optionalNumber = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(0).max(max).optional()
  );

/**
 * The car as the submitter describes it. Only identity is required; drivetrain
 * details are best-effort (the admin fills gaps when adding the real car).
 * Free-text because option lists are admin-managed — membership is only
 * enforced on the real Car via assertValidCarOptions.
 */
export const submissionCarSchema = z.object({
  modelYear: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year seems too old")
    .max(currentYear + 2, `Year can't be beyond ${currentYear + 2}`),
  manufacturer: z.string().trim().min(1, "Manufacturer is required").max(60),
  carModel: z.string().trim().min(1, "Model is required").max(80),
  variant: z.string().trim().max(80).optional().default(""),
  engineSize: optionalNumber(30),
  powertrainType: z.string().trim().max(40).optional().default(""),
  transmission: z.string().trim().max(40).optional().default(""),
  induction: z.string().trim().max(40).optional().default(""),
});

const contactSchema = z
  .string()
  .trim()
  .min(3, "Leave an email or handle so we can reach you")
  .max(120);

/** "Submit a run" — a claimed time with mandatory video proof. */
export const runSubmissionSchema = z.object({
  kind: z.literal("run"),
  car: submissionCarSchema,
  claimedZeroToHundred: z.coerce
    .number()
    .gt(0, "0–100 time must be greater than 0")
    .max(60, "0–100 time seems too slow"),
  measurementMethod: z
    .string()
    .trim()
    .min(1, "Tell us how the time was measured")
    .max(80),
  media: z
    .array(submissionMediaSchema)
    .min(1, "Video proof of the run is required")
    .max(4)
    .refine((m) => m.some((x) => x.type === "video"), {
      message: "Video proof of the run is required",
    }),
  contact: contactSchema,
  notes: z.string().trim().max(2000).optional().default(""),
});

/** "Book a test" — no claimed time; the owners drive and time the car. */
export const testRequestSchema = z.object({
  kind: z.literal("test-request"),
  car: submissionCarSchema,
  location: z.string().trim().min(2, "Where is the car?").max(120),
  availability: z.string().trim().max(200).optional().default(""),
  contact: contactSchema,
  notes: z.string().trim().max(2000).optional().default(""),
  media: z.array(submissionMediaSchema).max(1).default([]),
});

export const submissionInputSchema = z.discriminatedUnion("kind", [
  runSubmissionSchema,
  testRequestSchema,
]);

export type RunSubmissionInput = z.infer<typeof runSubmissionSchema>;
export type TestRequestInput = z.infer<typeof testRequestSchema>;
export type SubmissionInput = z.infer<typeof submissionInputSchema>;
