"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * An <img> that resolves gracefully instead of snapping in. A tiny blurred
 * copy (the LQIP) shows instantly as a base layer; the full image sits on top
 * at opacity 0 and crossfades in once it loads. With no `blurSrc` it degrades
 * to a plain fade-in.
 *
 * - The blur layer stays put (it also fills letterbox bars behind a `contain`
 *   image — the same job `cloudinaryBlurFill` already did).
 * - Cached images can finish before React wires up `onLoad`, which would leave
 *   them stuck transparent; we check `img.complete` on mount to cover that.
 * - Reduced motion drops the fade (the image just appears once ready).
 */
export function BlurUpImage({
  src,
  blurSrc,
  alt,
  className,
  blurClassName,
  loading = "lazy",
}: {
  src?: string;
  blurSrc?: string | null;
  alt: string;
  /** Classes for the sharp image (object-fit, filters, hover zoom, …). */
  className?: string;
  /** Extra classes for the blur layer (e.g. `scale-110` for bar fill). */
  blurClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <>
      {blurSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            blurClassName
          )}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={cn(
          "transition-opacity duration-500 ease-out motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  );
}
