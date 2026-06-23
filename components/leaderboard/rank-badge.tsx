import { cn } from "@/lib/utils";

/**
 * Position pill. Top 3 get medal colors (gold/silver/bronze); the rest get a
 * neutral monospaced number.
 */
export function RankBadge({
  position,
  size = "md",
}: {
  position: number;
  size?: "md" | "lg";
}) {
  const medal =
    position === 1
      ? "bg-gold/15 text-gold ring-gold/40"
      : position === 2
        ? "bg-silver/15 text-silver ring-silver/40"
        : position === 3
          ? "bg-bronze/15 text-bronze ring-bronze/40"
          : "bg-secondary text-muted-foreground ring-border";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono font-bold tabular-nums ring-1",
        medal,
        size === "lg" ? "h-12 w-12 text-xl" : "h-9 w-9 text-sm"
      )}
    >
      {position}
    </span>
  );
}
