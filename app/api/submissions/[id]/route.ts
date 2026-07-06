import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Submission from "@/lib/models/Submission";
import { requireApiAuth } from "@/lib/auth";
import { deleteManyMedia } from "@/lib/storage";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(1000).optional().default(""),
});

// PATCH /api/submissions/[id] — admin: approve or reject a submission.
// Rejection wipes the quarantined proof media so junk never accumulates.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const denied = requireApiAuth();
  if (denied) return denied;

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (parsed.data.status === "rejected" && submission.media.length > 0) {
      await deleteManyMedia(submission.media);
      submission.media = [];
    }

    submission.status = parsed.data.status;
    submission.reviewNote = parsed.data.reviewNote;
    await submission.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/submissions/${params.id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to update the submission" },
      { status: 500 }
    );
  }
}

// DELETE /api/submissions/[id] — admin: remove a submission entirely.
// Approved submissions keep their media: an approved run's proof may have been
// carried onto the car it became, so only unapproved quarantine is wiped.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const denied = requireApiAuth();
  if (denied) return denied;

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  try {
    await dbConnect();
    const submission = await Submission.findById(params.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status !== "approved" && submission.media.length > 0) {
      await deleteManyMedia(submission.media);
    }
    await submission.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/submissions/${params.id} failed:`, err);
    return NextResponse.json(
      { error: "Failed to delete the submission" },
      { status: 500 }
    );
  }
}
