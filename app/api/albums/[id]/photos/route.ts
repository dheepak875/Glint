import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { addPhoto, getAlbumById } from "@/lib/albums/service";

type Ctx = { params: Promise<{ id: string }> };

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB per photo

export const POST = requireAdmin<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const album = await getAlbumById(id);
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `${file.name} exceeds the 50MB limit` }, { status: 413 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: `${file.name} is not an image` }, { status: 400 });
    }
  }

  const photos = [];
  for (const file of files) {
    photos.push(await addPhoto(id, file));
  }

  return NextResponse.json({ photos }, { status: 201 });
});
