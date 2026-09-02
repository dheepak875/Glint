import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "@/lib/env";
import * as schema from "./schema";

type GlintDb = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __glintDb: GlintDb | undefined;
  // eslint-disable-next-line no-var
  var __glintDbMigration: Promise<void> | undefined;
}

function createDb(): GlintDb {
  fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });
  const client = createClient({ url: `file:${env.dbPath}` });
  return drizzle(client, { schema });
}

export const db: GlintDb = globalThis.__glintDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__glintDb = db;
}

/** Runs pending migrations. Idempotent and safe to call from every request path — resolves immediately after the first run. */
export function ensureMigrated(): Promise<void> {
  if (!globalThis.__glintDbMigration) {
    globalThis.__glintDbMigration = migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
  }
  return globalThis.__glintDbMigration;
}
