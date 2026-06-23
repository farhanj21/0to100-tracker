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
