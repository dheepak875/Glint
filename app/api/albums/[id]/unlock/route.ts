import { NextResponse } from "next/server";
import { z } from "zod";
import { getAlbumByIdOrSlug } from "@/lib/albums/service";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const album = await getAlbumByIdOrSlug(id);
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!album.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const isValid = await verifyPassword(parsed.data.password, album.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const session = await getSession();
  const unlocked = new Set(session.unlockedAlbumIds ?? []);
  unlocked.add(album.id);
  session.unlockedAlbumIds = Array.from(unlocked);
  await session.save();

  return NextResponse.json({ ok: true });
}
