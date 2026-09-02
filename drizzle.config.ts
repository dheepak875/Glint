import type { Config } from "drizzle-kit";
import { env } from "./lib/env";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: env.dbPath,
  },
} satisfies Config;
