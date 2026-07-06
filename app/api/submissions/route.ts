import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Submission from "@/lib/models/Submission";
import { submissionInputSchema } from "@/lib/validation";
import { requireApiAuth } from "@/lib/auth";
import { createRateLimiter, clientKeyFrom } from "@/lib/rate-limit";
import {
  getSubmissions,
  MAX_PENDING_SUBMISSIONS,
} from "@/lib/submissions";

export const dynamic = "force-dynamic";

// A car submission is a rare, deliberate act — 3 an hour per client is
// generous for a human and hostile to a script.
const limiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  perClientMax: 3,
  globalMax: 20,
});

const RECEIVED = {
  message:
    "Received. Every submission is reviewed before it races the board — we'll be in touch.",
};

// POST /api/submissions — public: file a run submission or a test request.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Honeypot: a hidden "website" field no human ever sees. Bots that fill
    // every input get a convincing 201 and nothing is stored.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json(RECEIVED, { status: 201 });
    }

    if (limiter.isRateLimited(clientKeyFrom(request))) {
      return NextResponse.json(
        { error: "Easy on the throttle — try again in a little while." },
        { status: 429 }
      );
    }

    const parsed = submissionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();

    // Keep the unreviewed pile bounded so a spam wave can't fill the database.
    const pending = await Submission.countDocuments({ status: "pending" });
    if (pending >= MAX_PENDING_SUBMISSIONS) {
      return NextResponse.json(
        {
          error:
            "The review queue is full right now — please try again in a few days.",
        },
        { status: 503 }
      );
    }

    await Submission.create(parsed.data);
    return NextResponse.json(RECEIVED, { status: 201 });
  } catch (err) {
    console.error("POST /api/submissions failed:", err);
    return NextResponse.json(
      { error: "Failed to save the submission" },
      { status: 500 }
    );
  }
}

// GET /api/submissions — admin: the full review queue, pending first.
export async function GET() {
  const denied = requireApiAuth();
  if (denied) return denied;

  try {
    const submissions = await getSubmissions();
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error("GET /api/submissions failed:", err);
    return NextResponse.json(
      { error: "Failed to load submissions" },
      { status: 500 }
    );
  }
}
