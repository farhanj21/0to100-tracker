export default function Loading() {
  return (
    <div className="space-y-10">
      {/* Masthead skeleton */}
      <div>
        <div className="h-3 w-48 animate-pulse bg-muted" />
        <div className="mt-3 h-16 w-72 animate-pulse bg-muted sm:h-24 sm:w-[28rem]" />
      </div>

      {/* Hero skeleton */}
      <div className="grid border-t-2 border-foreground sm:grid-cols-[1.05fr_1fr]">
        <div className="aspect-[4/3] animate-pulse bg-muted" />
        <div className="space-y-4 py-7 sm:border-l sm:border-border sm:pl-8">
          <div className="h-6 w-28 animate-pulse bg-muted" />
          <div className="h-10 w-3/4 animate-pulse bg-muted" />
          <div className="h-20 w-40 animate-pulse bg-muted" />
          <div className="h-1.5 w-full animate-pulse bg-muted" />
        </div>
      </div>

      {/* Board skeleton */}
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
