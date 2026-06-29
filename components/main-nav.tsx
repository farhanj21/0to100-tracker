"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Primary site navigation. Each link owns a `match` predicate rather than a
 * strict path compare so query-string destinations (e.g. /race?all=1) still
 * light up on their base route.
 */
const LINKS: { href: string; label: string; match: (path: string) => boolean }[] = [
  { href: "/", label: "Board", match: (p) => p === "/" },
  { href: "/numbers", label: "Numbers", match: (p) => p === "/numbers" },
  { href: "/race?all=1", label: "Race", match: (p) => p === "/race" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-0.5 sm:gap-1"
    >
      {LINKS.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
            {/* Underline grows from the centre outward on hover. The active
                page is indicated by text colour alone, so it gets no underline. */}
            {!active && (
              <span
                aria-hidden
                className="absolute inset-x-2 -bottom-0.5 h-0.5 origin-center scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
