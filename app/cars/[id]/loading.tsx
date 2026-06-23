export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 animate-pulse bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse bg-muted" />
          <div className="h-8 w-20 animate-pulse bg-muted" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-muted/60" />
            ))}
          </div>
        </div>

        {/* Headline + stat */}
        <div className="flex flex-col justify-center space-y-3">
          <div className="h-6 w-16 animate-pulse bg-muted" />
          <div className="h-3 w-28 animate-pulse bg-muted" />
          <div className="h-10 w-3/4 animate-pulse bg-muted" />
          <div className="h-3 w-2/3 animate-pulse bg-muted" />
          <div className="mt-4 space-y-2 border-t border-border pt-6">
            <div className="h-3 w-24 animate-pulse bg-muted" />
            <div className="h-20 w-48 animate-pulse bg-muted" />
            <div className="h-3 w-28 animate-pulse bg-muted" />
          </div>
        </div>
      </div>

      {/* Spec sheet */}
      <div className="space-y-4">
        <div className="h-3 w-28 animate-pulse bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border border-border bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
