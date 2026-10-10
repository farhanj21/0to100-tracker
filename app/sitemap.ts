import type { MetadataRoute } from "next";
import { getRankedCars } from "@/lib/cars";
import { absoluteUrl, carPath } from "@/lib/seo";
import type { CarDTO } from "@/lib/types";

// Built per request so new cars show up without a redeploy.
export const dynamic = "force-dynamic";

/**
 * /sitemap.xml — the indexable pages: the board, the numbers and every car.
 * Compare/race views are query-string permutations and admin pages are private,
 * so neither is listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let cars: CarDTO[] = [];
  try {
    cars = await getRankedCars();
  } catch (err) {
    // Still serve the static pages rather than an error.
    console.error("Failed to build sitemap:", err);
  }

  // The board and the numbers change whenever any car does.
  const latest = cars.reduce<string | undefined>(
    (max, c) => (!max || c.updatedAt > max ? c.updatedAt : max),
    undefined
  );

  return [
    {
      url: absoluteUrl("/"),
      lastModified: latest,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/numbers"),
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...cars.map((car) => ({
      url: absoluteUrl(carPath(car)),
      lastModified: car.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
