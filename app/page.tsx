import Link from "next/link";
import { Plus, Flag, AlertTriangle } from "lucide-react";
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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
       
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Acceleration Leaderboard
        </h1>
        <p className="mt-1.5 max-w-xl text-muted-foreground">
          Every car ranked by its 0–100&nbsp;km/h time — fastest to slowest.
        </p>
      </div>
       <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Flag className="h-3.5 w-3.5" /> Live Rankings
        </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30">
        <Flag className="h-6 w-6" />
      </span>
      <h2 className="text-xl font-semibold">The grid is empty</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add your first car to start the leaderboard. Or run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          npm run seed
        </code>{" "}
        to load a starter grid.
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/5 py-20 text-center">
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
