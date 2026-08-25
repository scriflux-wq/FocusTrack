import {
  Sun,
  Calendar,
  TimerIcon,
  BarChart3,
  History,
  Target,
  FolderKanban,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Sun;
};

/** Primary items shown in the desktop sidebar and the mobile bottom nav. */
export const primaryNavItems: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/timer", label: "Timer", icon: TimerIcon },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

/** Extra items: shown in the sidebar directly, and under "More" on mobile. */
export const secondaryNavItems: NavItem[] = [
  { href: "/history", label: "History", icon: History },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/organize", label: "Organize", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
];
