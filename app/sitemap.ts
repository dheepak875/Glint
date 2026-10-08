import type { MetadataRoute } from "next";
import { listAlbums } from "@/lib/albums/service";
import { getSettings, hasAboutContent } from "@/lib/settings/service";
import { getSiteUrl } from "@/lib/site-url";

/** Public, unlocked albums only: unlisted and password-protected ones stay out of search. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, albums, settings] = await Promise.all([
    getSiteUrl(),
    listAlbums({ publicOnly: true }),
    getSettings(),
  ]);
  const url = (path: string) => new URL(path, siteUrl).toString();

  return [
    { url: url("/") },
    { url: url("/albums") },
    ...(hasAboutContent(settings) ? [{ url: url("/about") }] : []),
    ...albums
      .filter((album) => !album.passwordHash)
      .map((album) => ({ url: url(`/${album.slug}`), lastModified: album.updatedAt })),
  ];
}
