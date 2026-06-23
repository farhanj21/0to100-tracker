import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { getRankedCars } from "@/lib/cars";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { Button } from "@/components/ui/button";
import type { CarDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let cars: CarDTO[] = [];
  let error = false;

  try {
    cars = await getRankedCars();
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
    error = true;
  }

  return (
    <div className="space-y-8">
      <PageIntro count={cars.length} />

      {error ? (
        <ConnectionError />
      ) : cars.length === 0 ? (
        <EmptyState />
      ) : (
        <Leaderboard cars={cars} />
      )}
    </div>
  );
}

function PageIntro({ count }: { count: number }) {
  return (
    <div>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
        Live ranking
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">{count} cars</span>
        <span className="text-muted-foreground/50">·</span>
        0–100 km/h
      </div>
      <h1 className="mt-2 font-display text-6xl leading-[0.92] tracking-tight sm:text-8xl">
        The <span className="italic">Quickest</span>
      </h1>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
      <h2 className="font-display text-3xl">Nothing on the board yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Add the first car to open the ranking, or run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          npm run seed
        </code>{" "}
        for a starter grid.
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
    <div className="flex flex-col items-center justify-center rounded-md border border-destructive/40 bg-destructive/5 py-20 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
      <h2 className="text-xl font-semibold">Couldn&apos;t reach the database</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Check that <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">MONGODB_URI</code>{" "}
        in <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
        is set and that MongoDB is running, then refresh.
      </p>
    </div>
  );
}
