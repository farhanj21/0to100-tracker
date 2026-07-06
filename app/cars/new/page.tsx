import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";
import { CarForm } from "@/components/car-form/car-form";
import { getOptionsMap } from "@/lib/options";
import { getSubmission } from "@/lib/submissions";
import { isAuthenticated } from "@/lib/auth";
import { formatTime } from "@/lib/utils";
import type { CarInput } from "@/lib/validation";
import type { SubmissionDTO } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a car · 0–100" };

/**
 * Map an approved public submission onto the car form's default values.
 * Drivetrain values are only carried over when they match the current
 * admin-managed option lists; the 0–100 time is never pre-filled — the
 * admin verifies the proof and enters the official figure themselves.
 */
function submissionDefaults(
  sub: SubmissionDTO,
  options: { powertrain: string[]; induction: string[]; transmission: string[] }
): Partial<CarInput> {
  return {
    modelYear: sub.car.modelYear,
    manufacturer: sub.car.manufacturer,
    carModel: sub.car.carModel,
    variant: sub.car.variant,
    ...(sub.car.engineSize != null ? { engineSize: sub.car.engineSize } : {}),
    ...(sub.car.powertrainType && options.powertrain.includes(sub.car.powertrainType)
      ? { powertrainType: sub.car.powertrainType }
      : {}),
    ...(sub.car.transmission && options.transmission.includes(sub.car.transmission)
      ? { transmission: sub.car.transmission }
      : {}),
    ...(sub.car.induction && options.induction.includes(sub.car.induction)
      ? { induction: sub.car.induction }
      : {}),
    media: sub.media,
    notes: sub.notes,
  };
}

export default async function NewCarPage({
  searchParams,
}: {
  searchParams?: { submission?: string };
}) {
  if (!isAuthenticated()) redirect("/login?next=/cars/new");

  const options = await getOptionsMap();
  const submission = searchParams?.submission
    ? await getSubmission(searchParams.submission)
    : null;
  const defaults = submission ? submissionDefaults(submission, options) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leaderboard
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Add a car</h1>
        <p className="mt-1 text-muted-foreground">
          Enter the specs and the 0–100 time. The board re-ranks as soon as you
          save.
        </p>
      </div>

      {submission && (
        <div className="border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Inbox className="h-3.5 w-3.5" /> Pre-filled from a public submission
          </div>
          <p className="mt-2 text-muted-foreground">
            {submission.claimedZeroToHundred != null && (
              <>
                Claimed 0–100:{" "}
                <span className="font-mono font-medium text-foreground">
                  {formatTime(submission.claimedZeroToHundred)}s
                </span>
                {submission.measurementMethod && (
                  <> via {submission.measurementMethod}</>
                )}
                {". "}
              </>
            )}
            Contact: <span className="text-foreground">{submission.contact}</span>.
            Verify the proof below, then enter the official time yourself — it
            is never carried over automatically.
          </p>
        </div>
      )}

      <CarForm mode="create" options={options} defaultValues={defaults} />
    </div>
  );
}
