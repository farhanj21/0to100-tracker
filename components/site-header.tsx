import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAuthenticated } from "@/lib/auth";

export function SiteHeader() {
  const authed = isAuthenticated();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="0–100 home">
          <span
            className="h-5 w-[3px] rounded-full bg-primary transition-transform group-hover:scale-y-110"
            aria-hidden
          />
          <span className="font-display text-xl font-semibold tracking-tight">
            0–100
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
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
