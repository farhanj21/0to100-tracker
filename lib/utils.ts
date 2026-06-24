import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a 0–100 time with two-decimal precision, e.g. "6.57". */
export function formatTime(seconds: number): string {
  return seconds.toFixed(2);
}

/** Format engine size, e.g. 2 -> "2.0L", 1.5 -> "1.5L". 0 means electric-ish/NA. */
export function formatEngine(size: number): string {
  if (!size) return "—";
  return `${size.toFixed(1)}L`;
}

/** "2023 Porsche 911 Turbo S" */
export function carTitle(car: {
  modelYear: number;
  manufacturer: string;
  carModel: string;
}): string {
  return `${car.modelYear} ${car.manufacturer} ${car.carModel}`;
}

/** Turn a label into a URL-safe slug: "2022 Ferrari 488 Pista" -> "2022-ferrari-488-pista". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics -> single dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

/**
 * Readable slug for a car — year, make, model, then variant if present. Used in
 * shareable URLs in place of the opaque Mongo id. Collisions (same slug for two
 * cars) are disambiguated downstream in `getRankedCars`.
 */
export function carSlug(car: {
  modelYear: number;
  manufacturer: string;
  carModel: string;
  variant?: string;
}): string {
  return slugify(
    [car.modelYear, car.manufacturer, car.carModel, car.variant]
      .filter(Boolean)
      .join(" ")
  );
}

/** Ordinal suffix: 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 11 -> "11th". */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a gap to the leader, e.g. 0.3 -> "+0.30". The leader (0) renders as a
 * dash so the row reads "no gap".
 */
export function formatGap(seconds: number): string {
  if (seconds <= 0.0001) return "—";
  return `+${seconds.toFixed(2)}`;
}

/**
 * Build an optimised thumbnail URL for a Cloudinary image. Uploads are
 * arbitrary phone photos at full resolution; left raw they load heavy and
 * crop badly in CSS. This injects a resize plus auto format/quality right
 * after `/upload/`. Non-Cloudinary URLs are returned untouched. Pass display
 * px; we render at 2x for retina sharpness.
 *
 * - `"fill"` crops to exactly fill the box (centre gravity) — use when the box
 *   must be fully covered.
 * - `"fit"` scales the whole image to fit inside the box with no cropping, so
 *   the original framing is preserved (the box background shows as letterbox).
 */
export function cloudinaryThumb(
  url: string,
  w: number,
  h: number,
  mode: "fill" | "fit" = "fill"
): string {
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const crop =
    mode === "fit"
      ? `c_fit,w_${w * 2},h_${h * 2}`
      : // g_center, not g_auto: object-aware gravity needs Cloudinary's paid
        // add-on, and the free saliency fallback often locks onto sky/plate
        // instead of the car. Cars are framed centrally, so centre crop is
        // the reliable choice.
        `c_fill,g_center,w_${w * 2},h_${h * 2}`;
  const transform = `${crop},q_auto,f_auto/`;
  return url.slice(0, i + marker.length) + transform + url.slice(i + marker.length);
}

/**
 * A small, heavily blurred fill of a Cloudinary image, used purely as a
 * background wash behind a `contain`ed thumbnail so the box fills edge to edge
 * with no flat letterbox bars (the subject is never cropped). Tiny + blurred,
 * so it costs almost nothing to load.
 */
export function cloudinaryBlurFill(url: string, w: number, h: number): string {
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const transform = `c_fill,w_${w},h_${h},e_blur:1500,q_auto,f_auto/`;
  return url.slice(0, i + marker.length) + transform + url.slice(i + marker.length);
}
