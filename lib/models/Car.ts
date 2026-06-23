import mongoose, { Schema, model, models, type Model } from "mongoose";
import {
  POWERTRAIN_TYPES,
  TRANSMISSIONS,
  INDUCTIONS,
  MEDIA_TYPES,
  type PowertrainType,
  type Transmission,
  type Induction,
  type MediaType,
} from "@/lib/constants";

export interface IMedia {
  type: MediaType;
  path: string;
}

export interface ICar {
  modelYear: number;
  manufacturer: string;
  carModel: string;
  engineSize: number;
  powertrainType: PowertrainType;
  transmission: Transmission;
  induction: Induction;
  zeroToHundred: number;
  media: IMedia[];
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    type: { type: String, enum: MEDIA_TYPES, required: true },
    path: { type: String, required: true },
  },
  { _id: false }
);

const CarSchema = new Schema<ICar>(
  {
    modelYear: { type: Number, required: true, min: 1900, max: 2100 },
    manufacturer: { type: String, required: true, trim: true },
    carModel: { type: String, required: true, trim: true },
    engineSize: { type: Number, required: true, min: 0 },
    powertrainType: { type: String, enum: POWERTRAIN_TYPES, required: true },
    transmission: { type: String, enum: TRANSMISSIONS, required: true },
    induction: { type: String, enum: INDUCTIONS, required: true },
    // The core metric. Indexed because every leaderboard read sorts on it.
    zeroToHundred: { type: Number, required: true, min: 0, index: true },
    media: { type: [MediaSchema], default: [] },
  },
  { timestamps: true }
);

// NOTE: position/rank is intentionally NOT stored. It is always derived by
// sorting cars ascending by zeroToHundred at read time (see lib/cars.ts).

export const Car: Model<ICar> =
  (models.Car as Model<ICar>) || model<ICar>("Car", CarSchema);

export default Car;

// Ensure mongoose is referenced for side-effect model registration in some bundlers.
export { mongoose };
