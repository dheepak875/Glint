import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings, hasAboutContent } from "@/lib/settings/service";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const settings = await getSettings();
  if (!hasAboutContent(settings)) {
    notFound();
  }

  // Plain text, split into paragraphs on blank lines — no Markdown/HTML, so nothing to sanitize.
  const paragraphs = (settings.about ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>About</h1>

      {paragraphs.length > 0 && (
        <div className={styles.body}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {(settings.contactEmail || settings.links.length > 0) && (
        <ul className={styles.contact}>
          {settings.contactEmail && (
            <li>
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            </li>
          )}
          {settings.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer me">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
