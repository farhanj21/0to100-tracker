export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Masthead skeleton */}
      <div className="border-b border-border pb-6">
        <div className="h-3 w-40 animate-pulse bg-muted" />
        <div className="mt-3 h-12 w-64 animate-pulse bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse bg-muted" />
      </div>

      {/* Podium skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-[16/10] animate-pulse border border-border bg-muted"
          />
        ))}
      </div>

      {/* Rows skeleton */}
      <div className="border-t border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse border-b border-border bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}
