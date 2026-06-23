import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Flag className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-bold">Off the track</h1>
      <p className="mt-1 text-muted-foreground">
        We couldn&apos;t find that car. It may have been deleted.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to leaderboard</Link>
      </Button>
    </div>
  );
}
