import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOptionsMap } from "@/lib/options";
import { SubmitTabs } from "@/components/submit/submit-tabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit · 0–100" };

/**
 * The public door onto the board. Two flows behind one quiet page: submit a
 * run you've already timed (with video proof), or book a test so the owners
 * drive and time the car themselves. Nothing here writes to the board —
 * submissions land in a review queue.
 */
export default async function SubmitPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const options = await getOptionsMap();
  const initialTab = searchParams?.tab === "test" ? "test" : "run";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leaderboard
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          Your car, on the clock
        </h1>
        <p className="mt-1 text-muted-foreground">
          Two ways onto the board: send proof of a run you&apos;ve already
          timed, or hand us the keys and we&apos;ll time it ourselves. Every
          entry is reviewed before it races.
        </p>
      </div>

      <SubmitTabs options={options} initialTab={initialTab} />
    </div>
  );
}
