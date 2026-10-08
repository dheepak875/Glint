import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbumByIdOrSlug, getCoverPhoto } from "@/lib/albums/service";
import { AlbumGate } from "@/components/public/AlbumGate";
import { previewMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumByIdOrSlug(slug);
  if (!album) return {};

  const isLocked = Boolean(album.passwordHash);
  const cover = isLocked ? undefined : await getCoverPhoto(album);
  return previewMetadata({
    title: album.title,
    description: album.description,
    cover,
    // Unlisted and password-protected albums can be shared by link, but stay out of search engines.
    noIndex: !album.isPublic || isLocked,
  });
}

export default async function PublicAlbumPage({ params }: Props) {
  const { slug } = await params;
  const album = await getAlbumByIdOrSlug(slug);
  if (!album) {
    notFound();
  }

  return <AlbumGate album={album} />;
}
