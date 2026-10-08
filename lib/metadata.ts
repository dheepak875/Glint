import type { Metadata } from "next";
import type { Photo } from "@/lib/albums/service";
import { getSettings } from "@/lib/settings/service";

const MEDIUM_WIDTH = 1600;

/**
 * Full metadata for a page with its own link preview. Next merges metadata shallowly, so a page
 * that sets `openGraph` replaces the root layout's entirely — this rebuilds the whole object
 * (site name, description, image) rather than setting only the image. Relative image URLs
 * resolve against metadataBase from the root layout.
 */
export async function previewMetadata(opts: {
  title?: string;
  description?: string | null;
  cover?: Photo;
  noIndex?: boolean;
}): Promise<Metadata> {
  const settings = await getSettings();
  const description =
    opts.description || settings.siteDescription || `Photography by ${settings.siteTitle}.`;

  const image = opts.cover && {
    url: `/api/media/${opts.cover.mediumPath}`,
    width: Math.round(opts.cover.width * Math.min(1, MEDIUM_WIDTH / opts.cover.width)),
    height: Math.round(opts.cover.height * Math.min(1, MEDIUM_WIDTH / opts.cover.width)),
  };

  return {
    ...(opts.title ? { title: opts.title } : {}),
    description,
    ...(opts.noIndex ? { robots: { index: false } } : {}),
    openGraph: {
      siteName: settings.siteTitle,
      type: "website",
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}
