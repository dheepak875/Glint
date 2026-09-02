import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

type Ctx = { params: Promise<{ path: string[] }> };

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".tiff": "image/tiff",
};

export async function GET(_req: Request, ctx: Ctx) {
  const { path: segments } = await ctx.params;
  const uploadsRoot = path.resolve(env.uploadsRoot);
  const resolved = path.resolve(uploadsRoot, ...segments);

  if (!resolved.startsWith(uploadsRoot + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(resolved);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()] ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
