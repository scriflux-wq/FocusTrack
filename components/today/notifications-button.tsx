"use client";

import { Bell } from "lucide-react";
import { toast } from "sonner";

export function NotificationsButton() {
  return (
    <button
      type="button"
      onClick={() => toast("Sin notificaciones nuevas")}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary"
      aria-label="Notificaciones"
    >
      <Bell className="size-4" />
    </button>
  );
}
