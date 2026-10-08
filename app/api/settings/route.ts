import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSettings, updateSettings } from "@/lib/settings/service";

const emptyToNull = (v: string | null | undefined) => (v?.trim() ? v.trim() : null);

const settingsSchema = z.object({
  siteTitle: z.string().trim().min(1).max(100),
  siteDescription: z.string().max(300).nullish().transform(emptyToNull),
  about: z.string().max(5000).nullish().transform(emptyToNull),
  contactEmail: z
    .union([z.email().max(200), z.literal("")])
    .nullish()
    .transform(emptyToNull),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(50),
        // http(s) only: these render as hrefs, and javascript: URLs would run in visitors' browsers.
        url: z.url({ protocol: /^https?$/ }).max(500),
      }),
    )
    .max(12),
});

export const GET = requireAdmin(async () => NextResponse.json({ settings: await getSettings() }));

export const PATCH = requireAdmin(async (req) => {
  const json = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }
  return NextResponse.json({ settings: await updateSettings(parsed.data) });
});
