import { getUser } from "@/lib/supabase/server";
import { getOrCreateSettings } from "@/lib/db/queries";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) return null;

  const settings = await getOrCreateSettings(user.id);

  return <SettingsView settings={settings} />;
}
