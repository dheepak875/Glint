import { getSettings } from "@/lib/settings/service";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  return <SettingsForm initial={await getSettings()} />;
}
