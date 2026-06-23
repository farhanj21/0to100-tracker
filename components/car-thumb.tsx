import { Car as CarIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const image = primary?.type === "image" ? primary : undefined;
  const video = primary?.type === "video" ? primary : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-secondary/60 ring-1 ring-border",
        className
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.path}
          alt={`${car.manufacturer} ${car.carModel}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : video ? (
        <>
          <video
            src={video.path}
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
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <CarIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
