import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import {
  getActiveTimer,
  getCategories,
  getSubcategories,
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

  const [active, categories, subcategories, tags] = await Promise.all([
    getActiveTimer(user.id),
    getCategories(user.id),
    getSubcategories(user.id),
    getTags(user.id),
  ]);

  return (
    <OrganizeProvider value={{ categories, subcategories, tags }}>
      <TimerHydrator initial={active} />
      <AppShell userEmail={user.email ?? null}>{children}</AppShell>
      <TimerFab />
    </OrganizeProvider>
  );
}
