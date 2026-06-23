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
 * Build an optimised, smart-cropped thumbnail URL for a Cloudinary image.
 * Uploads are arbitrary phone photos at full resolution; left raw they load
 * heavy and crop badly in CSS. This injects a fill crop with auto gravity
 * (keeps the car in frame) plus auto format/quality right after `/upload/`.
 * Non-Cloudinary URLs are returned untouched. Pass display px; we render at
 * 2x for retina sharpness.
 */
export function cloudinaryThumb(url: string, w: number, h: number): string {
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const transform = `c_fill,g_auto,w_${w * 2},h_${h * 2},q_auto,f_auto/`;
  return url.slice(0, i + marker.length) + transform + url.slice(i + marker.length);
}
