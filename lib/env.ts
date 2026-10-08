import path from "node:path";

const storageRoot = process.env.STORAGE_PATH ?? path.join(process.cwd(), "data");

export const env = {
  storageRoot,
  dbPath: path.join(storageRoot, "glint.db"),
  uploadsRoot: path.join(storageRoot, "uploads"),
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  /** Unset values are generated on first run and persisted — see lib/secrets.ts. */
  adminPassword: process.env.ADMIN_PASSWORD || undefined,
  sessionSecret: process.env.SESSION_SECRET || undefined,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  siteTitle: process.env.SITE_TITLE ?? "Glint",
};
