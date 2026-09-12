import * as Icons from "lucide-react";
import { CATEGORY_ICON_BY_COLOR, categoryColor, categorySoftColor } from "@/lib/categories";
import { cn } from "@/lib/utils";

type IconName = keyof typeof Icons;

/** Icon rendered in a soft circle, tinted by category color. */
export function CategoryIcon({
  color,
  icon,
  className,
  iconClassName,
}: {
  color: string;
  icon?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const name = (icon || CATEGORY_ICON_BY_COLOR[color] || "Circle") as IconName;
  const Icon = (Icons[name] as React.ComponentType<{ className?: string }>) ?? Icons.Circle;

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{
        backgroundColor: categorySoftColor(color),
        color: categoryColor(color),
      }}
    >
      <Icon className={cn("size-5", iconClassName)} />
    </span>
  );
}
