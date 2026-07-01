import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MainNav } from "@/components/main-nav";
import { isAuthenticated } from "@/lib/auth";

export function SiteHeader() {
  const authed = isAuthenticated();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container relative flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="0–100 home">
            <span
              className="h-5 w-[3px] rounded-full bg-primary transition-transform group-hover:scale-y-110"
              aria-hidden
            />
            <span className="font-display text-2xl tracking-tight">0–100</span>
          </Link>
          <span className="hidden border-l border-border pl-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:inline">
            Acceleration leaderboard
          </span>
        </div>

        {/* sm+: centered independently of the flanking logo/controls so it stays
            optically centered regardless of their widths. Hidden on mobile to
            keep the bar uncluttered. */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 sm:block">
          <MainNav />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AuthButton authed={authed} />
          {authed && (
            <>
              <span className="mx-1.5 h-5 w-px bg-border" aria-hidden />
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Link href="/settings" aria-label="Settings" title="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="font-mono text-[11px] font-normal uppercase tracking-[0.18em] shadow-none transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Link href="/cars/new" aria-label="Add car">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Car</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
