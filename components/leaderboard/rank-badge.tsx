import { cn } from "@/lib/utils";

/** Editorial rank numeral. Top 3 take the signal; the rest are muted. */
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
        "font-mono font-bold tabular-nums leading-none",
        top ? "text-primary" : "text-muted-foreground",
        size === "lg" ? "text-4xl" : "text-xl"
      )}
    >
      {String(position).padStart(2, "0")}
    </span>
  );
}
