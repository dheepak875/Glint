import { notFound } from "next/navigation";
import { getAlbumByIdOrSlug } from "@/lib/albums/service";
import { AlbumGate } from "@/components/public/AlbumGate";

export default async function PublicAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await getAlbumByIdOrSlug(slug);
  if (!album) {
    notFound();
  }

  return <AlbumGate album={album} />;
}
