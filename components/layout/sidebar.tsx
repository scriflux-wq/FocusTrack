"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNavItems, secondaryNavItems } from "./nav-items";
import { signOut } from "@/lib/actions/auth";

export function Sidebar() {
  const pathname = usePathname();
  const items = [...primaryNavItems, ...secondaryNavItems];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Timer className="size-4" />
        </div>
        <span className="font-semibold text-sidebar-foreground">FocusTrack</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
