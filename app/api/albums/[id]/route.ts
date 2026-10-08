import { NextResponse } from "next/server";
import { z } from "zod";
import { canViewAlbum } from "@/lib/albums/access";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAlbumByIdOrSlug,
  listPhotosForAlbum,
  updateAlbum,
  deleteAlbum,
  toSafeAlbum,
  toPublicPhoto,
} from "@/lib/albums/service";
import { hashPassword } from "@/lib/auth/password";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const album = await getAlbumByIdOrSlug(id);
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canViewAlbum(album))) {
    return NextResponse.json({ error: "password_required" }, { status: 401 });
  }

  const photos = await listPhotosForAlbum(album.id);
  return NextResponse.json({ album: toSafeAlbum(album), photos: photos.map(toPublicPhoto) });
}

const updateAlbumSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  isPublic: z.boolean().optional(),
  coverPhotoId: z.string().nullable().optional(),
  password: z.string().min(1).max(200).nullable().optional(),
  showOnHomepage: z.boolean().optional(),
});

export const PATCH = requireAdmin<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = updateAlbumSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const passwordHash =
    password === undefined ? undefined : password === null ? null : await hashPassword(password);

  const album = await updateAlbum(id, { ...rest, ...(passwordHash !== undefined ? { passwordHash } : {}) });
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ album: toSafeAlbum(album) });
});

export const DELETE = requireAdmin<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  await deleteAlbum(id);
  return NextResponse.json({ ok: true });
});
