import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <Sidebar />
      <div className="flex min-h-svh w-full flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
