"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  ImageOff,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { youTubeThumb, youTubeEmbedUrl } from "@/lib/youtube";
import type { MediaDTO } from "@/lib/types";

export function Gallery({
  media,
  carId,
}: {
  media: MediaDTO[];
  /** When provided, enables the "Set as thumbnail" action on the detail page. */
  carId?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const [pending, setPending] = useState<string | null>(null);

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

  const setAsThumbnail = useCallback(
    async (path: string) => {
      if (!carId) return;
      setPending(path);
      try {
        const res = await fetch(`/api/cars/${carId}/thumbnail`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to set thumbnail");
        }
        toast.success("Leaderboard thumbnail updated");
        setActive(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to set thumbnail");
      } finally {
        setPending(null);
      }
    },
    [carId, router]
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
  const canManage = Boolean(carId);

  return (
    <div className="space-y-3">
      {/* Hero (current thumbnail) */}
      <button
        type="button"
        onClick={() => setActive(0)}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl ring-1 ring-border"
      >
        <MediaTile media={hero} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {canManage && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground shadow">
            <Star className="h-3.5 w-3.5 fill-current" /> Leaderboard thumbnail
          </span>
        )}
      </button>

      {/* Thumbnails */}
      {rest.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {rest.map((m, i) => (
            <div
              key={`${m.path}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-primary"
            >
              <button
                type="button"
                onClick={() => setActive(i + 1)}
                className="block h-full w-full"
                aria-label="Open media"
              >
                <MediaTile media={m} thumb />
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setAsThumbnail(m.path)}
                  disabled={pending !== null}
                  title="Set as leaderboard thumbnail"
                  className="absolute inset-x-1 bottom-1 inline-flex items-center justify-center gap-1 rounded-md bg-background/85 px-1.5 py-1 text-[10px] font-medium text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-primary hover:text-primary-foreground disabled:opacity-60 group-hover:opacity-100"
                >
                  {pending === m.path ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Star className="h-3 w-3" />
                  )}
                  Thumbnail
                </button>
              )}
            </div>
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

            {/* Set-as-thumbnail control (top-left) */}
            {canManage && (
              <div
                className="absolute left-4 top-4"
                onClick={(e) => e.stopPropagation()}
              >
                {active === 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    <Star className="h-3.5 w-3.5 fill-current" /> Current thumbnail
                  </span>
                ) : (
                  <button
                    onClick={() => setAsThumbnail(media[active].path)}
                    disabled={pending !== null}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                  >
                    {pending === media[active].path ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Star className="h-3.5 w-3.5" />
                    )}
                    Set as thumbnail
                  </button>
                )}
              </div>
            )}

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
              ) : media[active].type === "youtube" ? (
                <div className="aspect-video w-[90vw] max-w-4xl">
                  <iframe
                    src={`${youTubeEmbedUrl(media[active].path)}?autoplay=1&rel=0`}
                    title="YouTube video player"
                    className="h-full w-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
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
  if (media.type === "youtube") {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={youTubeThumb(media.path)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className={cn("text-white", thumb ? "h-4 w-4" : "h-10 w-10")} />
        </span>
      </>
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
      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
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
