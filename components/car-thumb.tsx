import { Car as CarIcon, Play } from "lucide-react";
import { cn, cloudinaryThumb, cloudinaryBlurFill } from "@/lib/utils";
import { youTubeThumb } from "@/lib/youtube";
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
  // When fitting (no crop), a blurred copy fills the box so portrait/odd
  // ratios don't leave flat bars.
  const blurSrc =
    primary?.type === "image" && transform && fit === "contain"
      ? cloudinaryBlurFill(primary.path, 48, 36)
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-secondary/60 ring-1 ring-border",
        className
      )}
    >
      {primary?.type === "image" ? (
        <>
          {blurSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blurSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover"
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={`${car.manufacturer} ${car.carModel}`}
            className={cn(
              "relative h-full w-full",
              fit === "contain" ? "object-contain" : "object-cover"
            )}
            loading="lazy"
          />
        </>
      ) : primary?.type === "youtube" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumb(primary.path)}
            alt={`${car.manufacturer} ${car.carModel}`}
            className="h-full w-full object-cover"
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
            className="h-full w-full object-cover"
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
