import { getUser } from "@/lib/supabase/server";
import { getRecentEntries, getOrCreateSettings } from "@/lib/db/queries";
import { HistoryView } from "@/components/history/history-view";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) return null;

  const [entries, settings] = await Promise.all([
    getRecentEntries(user.id),
    getOrCreateSettings(user.id),
  ]);

  return (
    <HistoryView
      entries={entries}
      timezone={settings.timezone}
      timeFormat={settings.timeFormat}
    />
  );
}
