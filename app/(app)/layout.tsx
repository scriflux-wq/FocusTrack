import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import {
  getActiveTimer,
  getCategories,
  getProjects,
  getTags,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/app-shell";
import { TimerHydrator } from "@/components/timer/timer-hydrator";
import { TimerFab } from "@/components/timer/timer-fab";
import { OrganizeProvider } from "@/components/providers/organize-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const [active, categories, projects, tags] = await Promise.all([
    getActiveTimer(user.id),
    getCategories(user.id),
    getProjects(user.id),
    getTags(user.id),
  ]);

  return (
    <OrganizeProvider value={{ categories, projects, tags }}>
      <TimerHydrator initial={active} />
      <AppShell>{children}</AppShell>
      <TimerFab />
    </OrganizeProvider>
  );
}
