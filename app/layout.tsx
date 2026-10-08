import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { getSettings } from "@/lib/settings/service";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Every page reads the database, which only exists at runtime (its volume mounts when the
// container starts), and content changes independently of deploys — never prerender at build.
// Decided per route before rendering, unlike connection(), so no query can run during the build.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, siteUrl] = await Promise.all([getSettings(), getSiteUrl()]);
  const description = settings.siteDescription ?? `Photography by ${settings.siteTitle}.`;
  return {
    metadataBase: siteUrl,
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    description,
    openGraph: { siteName: settings.siteTitle, type: "website", description },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
