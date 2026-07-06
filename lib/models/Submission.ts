import mongoose, { Schema, model, models, type Model } from "mongoose";

/**
 * A public submission — either a claimed 0–100 run with proof media, or a
 * request for the owners to test the car themselves. Submissions live in
 * quarantine: they never touch the Car collection (or the board) until an
 * admin reviews them and creates the car through the normal admin flow.
 */

export const SUBMISSION_KINDS = ["run", "test-request"] as const;
export const SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;

export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export interface ISubmissionMedia {
  // Only real uploads are accepted from the public (no YouTube embeds), so the
  // review queue always has the actual proof file.
  type: "image" | "video";
  path: string;
}

/** The car as described by the submitter. Only identity is required. */
export interface ISubmissionCar {
  modelYear: number;
  manufacturer: string;
  carModel: string;
  variant: string;
  engineSize?: number;
  powertrainType?: string;
  transmission?: string;
  induction?: string;
}

export interface ISubmission {
  kind: SubmissionKind;
  status: SubmissionStatus;
  car: ISubmissionCar;
  /** Run submissions: the time the submitter claims. Never trusted as-is. */
  claimedZeroToHundred?: number;
  /** Run submissions: how the time was measured (GPS box, dash timer, …). */
  measurementMethod?: string;
  media: ISubmissionMedia[];
  /** Email / Instagram / phone — whatever the submitter left to be reached at. */
  contact: string;
  /** Test requests: where the car lives. */
  location?: string;
  /** Test requests: free-form availability ("weekends", "any evening"). */
  availability?: string;
  notes: string;
  /** Optional admin note recorded on approve/reject. */
  reviewNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionMediaSchema = new Schema<ISubmissionMedia>(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    path: { type: String, required: true },
  },
  { _id: false }
);

const SubmissionCarSchema = new Schema<ISubmissionCar>(
  {
    modelYear: { type: Number, required: true, min: 1900, max: 2100 },
    manufacturer: { type: String, required: true, trim: true },
    carModel: { type: String, required: true, trim: true },
    variant: { type: String, default: "", trim: true },
    engineSize: { type: Number, min: 0 },
    powertrainType: { type: String, trim: true },
    transmission: { type: String, trim: true },
    induction: { type: String, trim: true },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    kind: { type: String, enum: SUBMISSION_KINDS, required: true },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: "pending",
      index: true,
    },
    car: { type: SubmissionCarSchema, required: true },
    claimedZeroToHundred: { type: Number, min: 0 },
    measurementMethod: { type: String, trim: true },
    media: { type: [SubmissionMediaSchema], default: [] },
    contact: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    availability: { type: String, trim: true },
    notes: { type: String, default: "", trim: true },
    reviewNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const Submission: Model<ISubmission> =
  (models.Submission as Model<ISubmission>) ||
  model<ISubmission>("Submission", SubmissionSchema);

export default Submission;

// Ensure mongoose is referenced for side-effect model registration in some bundlers.
export { mongoose };
