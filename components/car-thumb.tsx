import { Car as CarIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

/**
 * Renders a car's primary thumbnail: the first image if present, otherwise the
 * first video's poster frame, otherwise a placeholder. Plain <img>/<video> are
 * used (not next/image) because uploads are arbitrary local files.
 */
export function CarThumb({
  car,
  className,
}: {
  car: Pick<CarDTO, "media" | "manufacturer" | "carModel">;
  className?: string;
}) {
  const image = car.media.find((m) => m.type === "image");
  const video = !image ? car.media.find((m) => m.type === "video") : undefined;

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
