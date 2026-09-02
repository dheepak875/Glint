import Link from "next/link";
import { listAlbums, getCoverPhoto, getHomepageAlbum } from "@/lib/albums/service";
import { env } from "@/lib/env";
import { AlbumGate } from "@/components/public/AlbumGate";
import styles from "./page.module.css";

// The DB isn't available at build time (its volume mounts at container runtime), and album
// content changes independently of deploys anyway — this page must render per-request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getHomepageAlbum();
  if (featured) {
    return <AlbumGate album={featured} />;
  }

  const albums = await listAlbums({ publicOnly: true });
  const withCovers = await Promise.all(
    albums.map(async (album) => ({ album, cover: await getCoverPhoto(album) })),
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{env.siteTitle}</h1>
      </header>

      {withCovers.length === 0 ? (
        <p className={styles.empty}>No public albums yet.</p>
      ) : (
        <ul className={styles.grid}>
          {withCovers.map(({ album, cover }) => (
            <li key={album.id}>
              <Link href={`/${album.slug}`} className={styles.card}>
                <div className={styles.coverWrap}>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/media/${cover.thumbnailPath}`}
                      alt=""
                      className={styles.cover}
                      style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
                    />
                  ) : (
                    <div className={styles.coverPlaceholder} />
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.cardTitle}>{album.title}</span>
                  {album.description && <span className={styles.cardDescription}>{album.description}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
