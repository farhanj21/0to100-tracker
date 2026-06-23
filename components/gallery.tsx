"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Play, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaDTO } from "@/lib/types";

export function Gallery({ media }: { media: MediaDTO[] }) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(
    () => setActive((i) => (i === null ? i : (i + 1) % media.length)),
    [media.length]
  );
  const prev = useCallback(
    () =>
      setActive((i) =>
        i === null ? i : (i - 1 + media.length) % media.length
      ),
    [media.length]
  );

  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, next, prev]);

  if (media.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
        <ImageOff className="mb-2 h-7 w-7" />
        <p className="text-sm">No media yet</p>
      </div>
    );
  }

  const [hero, ...rest] = media;

  return (
    <div className="space-y-3">
      {/* Hero */}
      <button
        type="button"
        onClick={() => setActive(0)}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl ring-1 ring-border"
      >
        <MediaTile media={hero} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </button>

      {/* Thumbnails */}
      {rest.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {rest.map((m, i) => (
            <button
              key={`${m.path}-${i}`}
              type="button"
              onClick={() => setActive(i + 1)}
              className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-primary"
            >
              <MediaTile media={m} thumb />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {media.length > 1 && (
              <>
                <NavButton side="left" onClick={(e) => { e.stopPropagation(); prev(); }} />
                <NavButton side="right" onClick={(e) => { e.stopPropagation(); next(); }} />
              </>
            )}

            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="max-h-[85vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {media[active].type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media[active].path}
                  alt=""
                  className="max-h-[85vh] w-auto rounded-lg object-contain"
                />
              ) : (
                <video
                  src={media[active].path}
                  className="max-h-[85vh] w-auto rounded-lg"
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </motion.div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white tabular-nums">
              {active + 1} / {media.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MediaTile({ media, thumb }: { media: MediaDTO; thumb?: boolean }) {
  if (media.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.path}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <>
      <video
        src={media.path}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/30",
        )}
      >
        <Play className={cn("text-white", thumb ? "h-4 w-4" : "h-10 w-10")} />
      </span>
    </>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20",
        side === "left" ? "left-4" : "right-4"
      )}
      aria-label={side === "left" ? "Previous" : "Next"}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
