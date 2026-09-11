"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNavItems } from "./nav-items";
import { MoreMenuContent } from "./more-menu-content";
import { MountainArt } from "@/components/ui/mountain-art";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = ["/history", "/organize", "/settings"].some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Sparkle className="size-5 text-primary" strokeWidth={1.75} />
        <div>
          <span className="font-serif text-lg leading-none font-semibold text-sidebar-foreground">
            FocusTrack
          </span>
          <p className="text-[11px] leading-tight text-muted-foreground">
            Tu tiempo, con claridad
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {primaryNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
            moreActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
        >
          <MoreHorizontal className="size-4" />
          More
        </button>
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <p className="font-serif text-sm italic leading-snug text-muted-foreground">
          &ldquo;Pequeños pasos hoy construyen un mañana mejor.&rdquo;
        </p>
        <MountainArt className="h-10 w-full opacity-70" />
      </div>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Más</DialogTitle>
          </DialogHeader>
          <MoreMenuContent onNavigate={() => setMoreOpen(false)} />
        </DialogContent>
      </Dialog>
    </aside>
  );
}
