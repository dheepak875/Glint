import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAlbum, listAlbums, toSafeAlbum } from "@/lib/albums/service";

export async function GET() {
  const session = await getSession();
  const albumRows = await listAlbums({ publicOnly: !session.isAdmin });
  return NextResponse.json({ albums: albumRows.map(toSafeAlbum) });
}

const createAlbumSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const POST = requireAdmin(async (req) => {
  const json = await req.json().catch(() => null);
  const parsed = createAlbumSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const album = await createAlbum(parsed.data);
  return NextResponse.json({ album: toSafeAlbum(album) }, { status: 201 });
});
