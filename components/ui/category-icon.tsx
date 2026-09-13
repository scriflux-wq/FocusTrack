import * as Icons from "lucide-react";
import { CATEGORY_ICON_BY_COLOR, categoryColor, categorySoftColor } from "@/lib/categories";
import { cn } from "@/lib/utils";

type IconName = keyof typeof Icons;

/**
 * Icon tinted by category color. `soft` (default) sits on a pastel circle of
 * the category color; `onCard` is for use inside an already-tinted event card,
 * where it sits on a translucent white chip so it reads against the fill.
 */
export function CategoryIcon({
  color,
  icon,
  className,
  iconClassName,
  variant = "soft",
}: {
  color: string;
  icon?: string | null;
  className?: string;
  iconClassName?: string;
  variant?: "soft" | "onCard";
}) {
  const name = (icon || CATEGORY_ICON_BY_COLOR[color] || "Circle") as IconName;
  const Icon = (Icons[name] as React.ComponentType<{ className?: string }>) ?? Icons.Circle;

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        variant === "onCard" && "rounded-md bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/15",
        className,
      )}
      style={{
        backgroundColor: variant === "soft" ? categorySoftColor(color) : undefined,
        color: categoryColor(color),
      }}
    >
      <Icon className={cn("size-5", iconClassName)} />
    </span>
  );
}
