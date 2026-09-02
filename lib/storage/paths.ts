import path from "node:path";
import { env } from "@/lib/env";

/** Resolves a relative path (as stored in Photo.storagePath etc.) to an absolute filesystem path. */
export function absoluteUploadPath(relativePath: string): string {
  return path.join(env.uploadsRoot, relativePath);
}
