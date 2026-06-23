import { cn } from "@/lib/utils";

/**
 * Editorial rank numeral: "No.01". Top 3 take the accent; the rest are muted.
 * No medals/rings — numbering carries the hierarchy.
 */
export function RankBadge({
  position,
  size = "md",
}: {
  position: number;
  size?: "md" | "lg";
}) {
  const top = position <= 3;
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-mono font-semibold tabular-nums leading-none",
        top ? "text-primary" : "text-muted-foreground",
        size === "lg" ? "text-3xl" : "text-xl"
      )}
    >
      <span className="mr-0.5 text-[0.55em] uppercase tracking-wide opacity-60">
        No.
      </span>
      {String(position).padStart(2, "0")}
    </span>
  );
}
