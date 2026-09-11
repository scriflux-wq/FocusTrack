import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  return (
    <div className="flex min-h-svh w-full">
      <Sidebar />
      <div className="flex min-h-svh w-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
          <TopBar userEmail={userEmail} />
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
