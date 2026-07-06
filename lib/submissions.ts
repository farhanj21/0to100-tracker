import "server-only";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Submission, { type ISubmission } from "@/lib/models/Submission";
import type { SubmissionDTO } from "@/lib/types";

/** Refuse new submissions once this many sit unreviewed — keeps spam bounded. */
export const MAX_PENDING_SUBMISSIONS = 50;

type LeanSubmission = ISubmission & { _id: Types.ObjectId };

function toDTO(doc: LeanSubmission): SubmissionDTO {
  return {
    id: String(doc._id),
    kind: doc.kind,
    status: doc.status,
    car: {
      modelYear: doc.car.modelYear,
      manufacturer: doc.car.manufacturer,
      carModel: doc.car.carModel,
      variant: doc.car.variant ?? "",
      engineSize: doc.car.engineSize,
      powertrainType: doc.car.powertrainType || undefined,
      transmission: doc.car.transmission || undefined,
      induction: doc.car.induction || undefined,
    },
    claimedZeroToHundred: doc.claimedZeroToHundred,
    measurementMethod: doc.measurementMethod || undefined,
    media: doc.media.map((m) => ({ type: m.type, path: m.path })),
    contact: doc.contact,
    location: doc.location || undefined,
    availability: doc.availability || undefined,
    notes: doc.notes ?? "",
    reviewNote: doc.reviewNote ?? "",
    createdAt: doc.createdAt.toISOString(),
  };
}

/** All submissions, pending first, then newest first within each status. */
export async function getSubmissions(): Promise<SubmissionDTO[]> {
  await dbConnect();
  const docs = await Submission.find().sort({ createdAt: -1 }).lean<LeanSubmission[]>();
  const rank = { pending: 0, approved: 1, rejected: 1 } as const;
  return docs
    .sort((a, b) => rank[a.status] - rank[b.status])
    .map(toDTO);
}

/** One submission by id, or null when the id is malformed or unknown. */
export async function getSubmission(id: string): Promise<SubmissionDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await dbConnect();
  const doc = await Submission.findById(id).lean<LeanSubmission | null>();
  return doc ? toDTO(doc) : null;
}

export async function countPendingSubmissions(): Promise<number> {
  await dbConnect();
  return Submission.countDocuments({ status: "pending" });
}
