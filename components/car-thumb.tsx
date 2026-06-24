import { Car as CarIcon, Play } from "lucide-react";
import { cn, cloudinaryThumb, cloudinaryBlurFill } from "@/lib/utils";
import { youTubeThumb } from "@/lib/youtube";
import { BlurUpImage } from "@/components/blur-up-image";
import type { CarDTO } from "@/lib/types";

/**
 * Renders a car's primary thumbnail — the first media item (the one chosen via
 * "Set as thumbnail" on the detail page, which moves it to the front). Falls
 * back to a placeholder when there's no media. Plain <img>/<video> are used
 * (not next/image) because uploads are arbitrary Cloudinary URLs.
 */
export function CarThumb({
  car,
  className,
  transform,
  fit = "cover",
  interactive = false,
}: {
  car: Pick<CarDTO, "media" | "manufacturer" | "carModel">;
  className?: string;
  /** Display px for the Cloudinary resize; omit to load the image as-is. */
  transform?: { w: number; h: number };
  /**
   * "cover" fills the box (may crop). "contain" preserves the original
   * framing, scaling the whole photo to fit inside the box.
   */
  fit?: "cover" | "contain";
  /** Adds a gentle zoom on the nearest `.group` hover (e.g. a card link). */
  interactive?: boolean;
}) {
  const primary = car.media[0];
  const imageSrc =
    primary?.type === "image" && transform
      ? cloudinaryThumb(
          primary.path,
          transform.w,
          transform.h,
          fit === "contain" ? "fit" : "fill"
        )
      : primary?.path;
  // A tiny blurred copy, cropped to the display aspect: it shows instantly as
  // a load placeholder and — for `contain` — also fills the letterbox bars so
  // portrait/odd ratios don't leave flat edges.
  const blurSrc =
    primary?.type === "image" && transform
      ? cloudinaryBlurFill(
          primary.path,
          48,
          Math.max(1, Math.round((48 * transform.h) / transform.w))
        )
      : null;

  // Subtle treatment so varied casual phone photos cohere: a touch more
  // contrast/saturation, and the zoom-on-hover when interactive.
  const mediaClass = cn(
    "h-full w-full [filter:contrast(1.04)_saturate(1.06)]",
    interactive &&
      "transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transform-none"
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-secondary/60 ring-1 ring-border",
        className
      )}
    >
      {primary?.type === "image" ? (
        <>
          <BlurUpImage
            src={imageSrc}
            blurSrc={blurSrc}
            alt={`${car.manufacturer} ${car.carModel}`}
            blurClassName={fit === "contain" ? "scale-110" : undefined}
            className={cn(
              mediaClass,
              "relative",
              fit === "contain" ? "object-contain" : "object-cover"
            )}
          />
          {/* Faint vignette to seat the photo. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_38%,transparent_58%,rgba(0,0,0,0.24))]"
          />
        </>
      ) : primary?.type === "youtube" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumb(primary.path)}
            alt={`${car.manufacturer} ${car.carModel}`}
            className={cn(mediaClass, "object-cover")}
            loading="lazy"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-4 w-4 text-white" />
          </span>
        </>
      ) : primary?.type === "video" ? (
        <>
          <video
            src={primary.path}
            className={cn(mediaClass, "object-cover")}
            muted
            playsInline
            preload="metadata"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-4 w-4 text-white" />
          </span>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted text-muted-foreground/40">
          <CarIcon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}
