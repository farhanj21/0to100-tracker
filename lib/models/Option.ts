import { Schema, model, models, type Model } from "mongoose";

/**
 * Admin-managed option lists for the car dropdowns whose values can change over
 * time (powertrain, induction, transmission). Each category is one document
 * holding an ordered `values` array. Fuel type and media type are NOT here —
 * they stay fixed code constants in lib/constants.ts.
 *
 * The lists are seeded lazily from DEFAULT_OPTIONS the first time they're read
 * (see lib/options.ts), so no migration step is required.
 */
export const OPTION_CATEGORIES = [
  "powertrain",
  "induction",
  "transmission",
] as const;

export type OptionCategory = (typeof OPTION_CATEGORIES)[number];

export interface IOption {
  category: OptionCategory;
  values: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: OPTION_CATEGORIES,
    },
    values: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Option: Model<IOption> =
  (models.Option as Model<IOption>) || model<IOption>("Option", OptionSchema);

export default Option;
