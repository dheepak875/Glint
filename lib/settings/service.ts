import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { settings, type SiteLink } from "@/lib/db/schema";
import { env } from "@/lib/env";

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string | null;
  about: string | null;
  contactEmail: string | null;
  links: SiteLink[];
}

const SETTINGS_ID = 1;

/** Saved settings, falling back to env defaults until the admin first saves the settings page. */
export async function getSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.id, SETTINGS_ID));
  return {
    siteTitle: row?.siteTitle ?? env.siteTitle,
    siteDescription: row?.siteDescription ?? null,
    about: row?.about ?? null,
    contactEmail: row?.contactEmail ?? null,
    links: row?.links ?? [],
  };
}

export async function updateSettings(next: SiteSettings): Promise<SiteSettings> {
  await db
    .insert(settings)
    .values({ id: SETTINGS_ID, ...next })
    .onConflictDoUpdate({ target: settings.id, set: next });
  return getSettings();
}

/** Whether there's anything to put on the About page. */
export function hasAboutContent(s: SiteSettings): boolean {
  return Boolean(s.about || s.contactEmail || s.links.length > 0);
}
