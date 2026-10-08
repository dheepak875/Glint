import { headers } from "next/headers";

/**
 * The site's public origin (e.g. https://photos.example.com), needed for absolute URLs in link
 * previews and the sitemap. Derived from the request so it works behind Cloudflare Tunnel or
 * Caddy without configuration; SITE_URL overrides it.
 */
export async function getSiteUrl(): Promise<URL> {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (isLocal ? "http" : "https");
  return new URL(`${proto}://${host}`);
}
