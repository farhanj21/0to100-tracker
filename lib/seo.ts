import "server-only";
import type { Metadata } from "next";
import {
  carFullTitle,
  cloudinaryThumb,
  formatEngine,
  formatTime,
  ordinal,
} from "@/lib/utils";
import { youTubeThumb } from "@/lib/youtube";
import type { CarDTO } from "@/lib/types";

/**
 * Search / answer-engine plumbing: the canonical origin, per-page metadata, and
 * the plain-language car summaries and JSON-LD shared by page metadata, the
 * sitemap and /llms.txt — so every machine-readable surface says the same thing.
 */

export const SITE_NAME = "0–100";
export const SITE_TITLE = "0–100 · Acceleration Board";
export const SITE_DESCRIPTION =
  "A live ranking of cars by their 0–100 km/h time, quickest first.";

/** The people credited in the footer. */
export const CREATORS = [
  { name: "farhanj21", url: "https://github.com/farhanj21" },
  { name: "vroslmend", url: "https://github.com/vroslmend" },
];

// Canonicals, social cards and the sitemap need absolute URLs. Prefer an
// explicit SITE_URL, fall back to the production domain Vercel injects, then
// localhost for dev. A bare domain ("example.com") is treated as https.
function resolveSiteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

type ShareImage = { url: string; width?: number; height?: number; alt?: string };

/** The static 1200×630 share card in public/brand (see its README). */
export const DEFAULT_OG_IMAGE: ShareImage = {
  url: "/brand/og.png",
  width: 1200,
  height: 630,
  alt: "0–100 — Acceleration leaderboard",
};

/**
 * Page metadata with a self-referencing canonical and matching social tags.
 * Next merges metadata shallowly, so a page that sets `openGraph` would
 * otherwise lose the root's share image — this always carries one.
 */
export function pageMetadata({
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
}: {
  title?: string;
  description?: string;
  /** Canonical path, e.g. "/numbers". Leave out on noindex pages. */
  path?: string;
  image?: ShareImage;
  /** Keep the page out of search results but let crawlers follow its links. */
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    ...(path && { alternates: { canonical: path } }),
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      ...(path && { url: path }),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function carPath(car: Pick<CarDTO, "slug">): string {
  return `/cars/${car.slug}`;
}

/** Core attributes on one line, skipping blanks: "3.0L · Turbocharged · Petrol · ICE · Auto". */
export function carSpecLine(car: CarDTO): string {
  return [
    car.engineSize ? formatEngine(car.engineSize) : null,
    car.induction,
    car.fuelType,
    car.powertrainType,
    car.transmission,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * A self-contained answer to "how quick is this car?" — the meta description
 * and JSON-LD description, written so a search or answer engine can quote it
 * without the rest of the page.
 */
export function carSummary(car: CarDTO, total: number): string {
  const spec = carSpecLine(car);
  return (
    `The ${carFullTitle(car)} does 0–100 km/h in ${formatTime(car.zeroToHundred)} s, ` +
    `ranked ${ordinal(car.position)} of ${total} on the 0–100 acceleration board.` +
    (spec ? ` Spec: ${spec}.` : "")
  );
}

/** The car's lead photo cropped to a 1200×630 card, else the site card. */
export function carShareImage(car: CarDTO): ShareImage {
  const alt = carFullTitle(car);
  const image = car.media.find((m) => m.type === "image");
  if (image) {
    const url = cloudinaryThumb(image.path, 600, 315, "fill");
    // Non-Cloudinary URLs come back untouched, so their size is unknown.
    return url === image.path ? { url, alt } : { url, width: 1200, height: 630, alt };
  }
  const video = car.media.find((m) => m.type === "youtube");
  if (video) return { url: youTubeThumb(video.path), alt };
  return DEFAULT_OG_IMAGE;
}

type JsonLd = Record<string, unknown>;

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "0–100 Acceleration Board",
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    creator: CREATORS.map((c) => ({ "@type": "Person", ...c })),
  };
}

/** The board as a ranked ItemList, quickest first. */
export function leaderboardJsonLd(cars: CarDTO[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Quickest cars by 0–100 km/h time",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: cars.length,
    itemListElement: cars.map((car) => ({
      "@type": "ListItem",
      position: car.position,
      name: carFullTitle(car),
      description: `0–100 km/h in ${formatTime(car.zeroToHundred)} s`,
      url: absoluteUrl(carPath(car)),
    })),
  };
}

function property(name: string, value: string | number) {
  return { "@type": "PropertyValue", name, value };
}

/** schema.org Car (with its 0–100 time as `accelerationTime`) plus breadcrumbs. */
export function carJsonLd(car: CarDTO, total: number): JsonLd {
  const url = absoluteUrl(carPath(car));
  const images = car.media
    .filter((m) => m.type === "image")
    .map((m) => absoluteUrl(m.path));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Car",
        "@id": `${url}#car`,
        name: carFullTitle(car),
        url,
        description: carSummary(car, total),
        brand: { "@type": "Brand", name: car.manufacturer },
        manufacturer: { "@type": "Organization", name: car.manufacturer },
        model: [car.carModel, car.variant].filter(Boolean).join(" "),
        vehicleModelDate: String(car.modelYear),
        ...(images.length > 0 && { image: images }),
        ...(car.fuelType && { fuelType: car.fuelType }),
        vehicleTransmission: car.transmission,
        ...(car.engineSize > 0 && {
          vehicleEngine: {
            "@type": "EngineSpecification",
            engineDisplacement: {
              "@type": "QuantitativeValue",
              value: car.engineSize,
              unitCode: "LTR",
            },
          },
        }),
        // schema.org has no unit for "seconds 0–100 km/h": the time is in SEC
        // and valueReference names the speed range it covers.
        accelerationTime: {
          "@type": "QuantitativeValue",
          value: car.zeroToHundred,
          unitCode: "SEC",
          valueReference: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 100,
            unitCode: "KMH",
          },
        },
        additionalProperty: [
          property("Powertrain", car.powertrainType),
          property("Induction", car.induction),
          { ...property("0–100 leaderboard rank", car.position), maxValue: total },
          ...car.specs.map((s) => property(s.label, s.value)),
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Leaderboard", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: carFullTitle(car), item: url },
        ],
      },
    ],
  };
}
