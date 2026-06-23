import Link from "next/link";
import { Gauge, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { isAuthenticated } from "@/lib/auth";

export function SiteHeader() {
  const authed = isAuthenticated();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 transition-colors group-hover:bg-primary/25">
            <Gauge className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">
              0–100 <span className="text-primary">Tracker</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Acceleration Leaderboard
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <AuthButton authed={authed} />
          {authed && (
            <Button asChild size="sm">
              <Link href="/cars/new" aria-label="Add car">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Car</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
