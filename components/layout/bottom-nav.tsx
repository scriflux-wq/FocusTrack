"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNavItems, secondaryNavItems } from "./nav-items";
import { MoreMenuContent } from "./more-menu-content";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useTimerStore } from "@/lib/timer/use-timer-store";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const activeEntry = useTimerStore((s) => s.activeEntry);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const moreActive = secondaryNavItems.some((i) => isActive(i.href));

  // Today, Calendar, Timer (center, big), Insights, More
  const [today, calendar, timer, insights] = primaryNavItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
        <NavLink item={today} active={isActive(today.href)} />
        <NavLink item={calendar} active={isActive(calendar.href)} />

        <Link
          href={timer.href}
          className="flex items-center justify-center"
          aria-label="Timer"
        >
          <span
            className={cn(
              "relative flex size-12 items-center justify-center rounded-full shadow-md transition-colors",
              "bg-primary text-primary-foreground",
            )}
          >
            <timer.icon className="size-5" />
            {activeEntry && (
              <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-card bg-success" />
            )}
          </span>
        </Link>

        <NavLink item={insights} active={isActive(insights.href)} />

        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerTrigger
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              moreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Menu className="size-5" />
            More
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Más</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <MoreMenuContent onNavigate={() => setMoreOpen(false)} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof primaryNavItems)[number];
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}
