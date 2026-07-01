import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { getRankedCars } from "@/lib/cars";
import { getOptionsMap, type OptionsMap } from "@/lib/options";
import { leaderboardStats } from "@/lib/stats";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { Button } from "@/components/ui/button";
import type { CarDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let cars: CarDTO[] = [];
  let options: OptionsMap | null = null;
  let error = false;

  try {
    [cars, options] = await Promise.all([getRankedCars(), getOptionsMap()]);
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
    error = true;
  }

  return (
    <div className="space-y-8">
      <PageIntro count={cars.length} />

      {error || !options ? (
        <ConnectionError />
      ) : cars.length === 0 ? (
        <EmptyState />
      ) : (
        <Leaderboard
          cars={cars}
          stats={leaderboardStats(cars, options)}
          options={options}
        />
      )}
    </div>
  );
}

function PageIntro({ count }: { count: number }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground duration-500 animate-in fade-in motion-reduce:animate-none">
        Fastest 0–100 km/h
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">{count} cars</span>
      </div>
      <h1 className="mt-2 font-display text-6xl leading-[0.92] tracking-tight duration-700 animate-in fade-in slide-in-from-bottom-3 motion-reduce:animate-none sm:text-8xl">
        The <span className="italic">Quickest</span>
      </h1>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Empty grid
      </p>
      <h2 className="mt-1 font-display text-3xl">Nothing on the board yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Add the first car and it takes pole. The board ranks every entry by its
        0–100 time, quickest first.
      </p>
      <Button asChild className="mt-6">
        <Link href="/cars/new">
          <Plus className="h-4 w-4" /> Add the first car
        </Link>
      </Button>
    </div>
  );
}

function ConnectionError() {
  return (
    <div className="flex flex-col items-center justify-center border border-destructive/40 bg-destructive/5 py-20 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">
        Connection error
      </p>
      <h2 className="mt-1 font-display text-3xl">Couldn&apos;t reach the database</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Check that{" "}
        <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
          MONGODB_URI
        </code>{" "}
        in{" "}
        <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
          .env.local
        </code>{" "}
        is set and that MongoDB is running, then refresh.
      </p>
    </div>
  );
}
