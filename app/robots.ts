import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * /robots.txt — everything public is crawlable (search and AI crawlers alike).
 * Only the JSON API and the admin screens are blocked; /login stays crawlable
 * so its noindex tag can be seen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings", "/cars/new", "/cars/*/edit"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
