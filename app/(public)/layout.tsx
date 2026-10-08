import { getHomepageAlbum } from "@/lib/albums/service";
import { getSettings, hasAboutContent } from "@/lib/settings/service";
import { SiteHeader } from "@/components/public/SiteHeader";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, featured] = await Promise.all([getSettings(), getHomepageAlbum()]);
  return (
    <>
      <SiteHeader
        title={settings.siteTitle}
        showAlbums={Boolean(featured)}
        showAbout={hasAboutContent(settings)}
      />
      {children}
    </>
  );
}
