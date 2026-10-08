import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      // Photos stay crawlable: link previews (e.g. X, Slack) honor robots.txt for images.
      allow: ["/", "/api/media/"],
      disallow: ["/admin", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
