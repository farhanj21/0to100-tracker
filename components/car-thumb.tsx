import { Car as CarIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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
}: {
  car: Pick<CarDTO, "media" | "manufacturer" | "carModel">;
  className?: string;
}) {
  const primary = car.media[0];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-secondary/60 ring-1 ring-border",
        className
      )}
    >
      {primary?.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={primary.path}
          alt={`${car.manufacturer} ${car.carModel}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
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
