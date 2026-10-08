import type { Metadata } from "next";
import { listAlbums, getHomepageAlbum, getCoverPhoto } from "@/lib/albums/service";
import { getSettings } from "@/lib/settings/service";
import { AlbumGate } from "@/components/public/AlbumGate";
import { AlbumCards } from "@/components/public/AlbumCards";
import { previewMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  // Preview image: the featured album's cover, else the first public album's.
  const featured = await getHomepageAlbum();
  const album = featured ?? (await listAlbums({ publicOnly: true })).find((a) => !a.passwordHash);
  const cover = album && !album.passwordHash ? await getCoverPhoto(album) : undefined;
  return previewMetadata({ cover });
}

export default async function HomePage() {
  const featured = await getHomepageAlbum();
  if (featured) {
    return <AlbumGate album={featured} />;
  }

  const [settings, albums] = await Promise.all([getSettings(), listAlbums({ publicOnly: true })]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{settings.siteTitle}</h1>
        {settings.siteDescription && <p className={styles.intro}>{settings.siteDescription}</p>}
      </header>
      <AlbumCards albums={albums} />
    </main>
  );
}
