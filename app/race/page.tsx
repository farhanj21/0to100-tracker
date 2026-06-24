import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Flag, GitCompareArrows } from "lucide-react";
import { getRankedCars } from "@/lib/cars";
import { RaceTrack } from "@/components/race/race-track";
import { Button } from "@/components/ui/button";
import type { CarDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Keep in sync with MAX_COMPARE — a readable track tops out around three lanes. */
const MAX_RACE = 3;
/** "Race all" uses the dense layout; cap high enough for the whole field. */
const MAX_RACE_ALL = 60;

export const metadata: Metadata = {
  title: "Race · 0–100",
};

export default async function RacePage({
  searchParams,
}: {
  searchParams: { cars?: string; all?: string };
}) {
  // `?all=1` races the whole field in the dense layout — keeps the URL short
  // instead of listing every car. Otherwise `?cars=a,b,c` races a picked set.
  const all = searchParams.all === "1";
  const ranked = await getRankedCars();

  let cars: CarDTO[];
  if (all) {
    cars = ranked.slice(0, MAX_RACE_ALL);
  } else {
    const requested = Array.from(
      new Set(
        (searchParams.cars ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ).slice(0, MAX_RACE);
    const bySlug = new Map(ranked.map((c) => [c.slug, c]));
    const byId = new Map(ranked.map((c) => [c.id, c]));
    // Accept slugs (canonical) and fall back to raw ids for old links.
    cars = requested
      .map((key) => bySlug.get(key) ?? byId.get(key))
      .filter(Boolean) as CarDTO[];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Leaderboard
        </Link>
        {!all && cars.length >= 2 && (
          <Link
            href={`/compare?cars=${cars.map((c) => c.slug).join(",")}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitCompareArrows className="h-4 w-4" /> Compare these
          </Link>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> 0–100 km/h, in real time
        </div>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Race
        </h1>
      </div>

      {cars.length < 1 ? (
        <Nothing />
      ) : (
        <RaceTrack cars={cars} minimal={all} />
      )}
    </div>
  );
}

function Nothing() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card py-16 text-center">
      <Flag className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Nothing to race
      </p>
      <p className="font-display text-2xl">Pick at least one car</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Head back to the board, tap{" "}
        <span className="font-medium text-foreground">Compare</span>, select up to
        three cars, then hit{" "}
        <span className="font-medium text-foreground">Race</span> to watch them run.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to the board
        </Link>
      </Button>
    </div>
  );
}
