import { getUser } from "@/lib/supabase/server";
import { getGoalsWithProgress, getOrCreateSettings } from "@/lib/db/queries";
import { GoalsView } from "@/components/goals/goals-view";

export default async function GoalsPage() {
  const user = await getUser();
  if (!user) return null;

  const settings = await getOrCreateSettings(user.id);
  const progress = await getGoalsWithProgress(
    user.id,
    settings.timezone,
    settings.weekStartsOn,
  );

  return <GoalsView progress={progress} />;
}
