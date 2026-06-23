import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Off the track</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn&apos;t find that car. It may have been deleted.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to leaderboard</Link>
      </Button>
    </div>
  );
}
