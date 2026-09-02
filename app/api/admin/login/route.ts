import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/auth/admin";
import { getSession } from "@/lib/auth/session";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const isValid = await verifyAdminCredentials(username, password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
