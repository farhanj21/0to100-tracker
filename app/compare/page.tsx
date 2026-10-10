import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Flag, GitCompareArrows } from "lucide-react";
import { getRankedCars, pickCars } from "@/lib/cars";
import { CompareView } from "@/components/compare/compare-view";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { carFullTitle, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Keep in sync with MAX_COMPARE in the leaderboard selection UI. */
const MAX_COMPARE = 3;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { cars?: string };
}): Promise<Metadata> {
  const cars = pickCars(await getRankedCars(), searchParams.cars, MAX_COMPARE);
  if (cars.length < 2) {
    return pageMetadata({
      title: "Compare · 0–100",
      description: "Line up two or three cars and compare their 0–100 km/h times.",
      noindex: true,
    });
  }

  // Board order, so every permutation of the same line-up shares one canonical.
  const ordered = [...cars].sort((a, b) => a.position - b.position);
  const [lead, next] = ordered;
  const gap = next.zeroToHundred - lead.zeroToHundred;
  return pageMetadata({
    title: `${ordered.map(carFullTitle).join(" vs ")} · Compare · 0–100`,
    description:
      `0–100 km/h head to head: ` +
      ordered
        .map((c) => `${carFullTitle(c)} ${formatTime(c.zeroToHundred)} s`)
        .join(", ") +
      (gap > 0.0001
        ? `. The ${carFullTitle(lead)} is quickest by ${formatTime(gap)} s.`
        : ". A dead heat at the front."),
    path: `/compare?cars=${ordered.map((c) => c.slug).join(",")}`,
  });
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { cars?: string };
}) {
  const ranked = await getRankedCars();
  const cars = pickCars(ranked, searchParams.cars, MAX_COMPARE);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Leaderboard
        </Link>
        {cars.length >= 1 && (
          <Link
            href={`/race?cars=${cars.map((c) => c.slug).join(",")}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Flag className="h-4 w-4" /> Race these cars
          </Link>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          <GitCompareArrows className="h-3.5 w-3.5" /> Head to head
        </div>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Compare
        </h1>
      </div>

      {cars.length < 2 ? (
        <NotEnough />
      ) : (
        <CompareView cars={cars} total={ranked.length} />
      )}
    </div>
  );
}

function NotEnough() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card py-16 text-center">
      <GitCompareArrows className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Nothing to compare
      </p>
      <p className="font-display text-2xl">Pick at least two cars</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Head back to the board, tap{" "}
        <span className="font-medium text-foreground">Compare</span>, and select
        two or three cars to line them up here.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to the board
        </Link>
      </Button>
    </div>
  );
}
