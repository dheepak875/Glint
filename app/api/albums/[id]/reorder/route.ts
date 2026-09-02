import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { reorderPhotos } from "@/lib/albums/service";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ photoIds: z.array(z.string()).min(1) });

export const POST = requireAdmin<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await reorderPhotos(id, parsed.data.photoIds);
  return NextResponse.json({ ok: true });
});
