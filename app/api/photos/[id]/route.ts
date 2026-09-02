import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deletePhoto } from "@/lib/albums/service";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = requireAdmin<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  await deletePhoto(id);
  return NextResponse.json({ ok: true });
});
