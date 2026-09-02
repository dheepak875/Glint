import path from "node:path";

const storageRoot = process.env.STORAGE_PATH ?? path.join(process.cwd(), "data");

export const env = {
  storageRoot,
  dbPath: path.join(storageRoot, "glint.db"),
  uploadsRoot: path.join(storageRoot, "uploads"),
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "changeme",
  sessionSecret: process.env.SESSION_SECRET ?? "glint-dev-session-secret-change-in-production-min32",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  siteTitle: process.env.SITE_TITLE ?? "Glint",
};
