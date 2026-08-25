import * as Icons from "lucide-react";
import { CATEGORY_ICON_BY_COLOR } from "@/lib/categories";
import { cn } from "@/lib/utils";

type IconName = keyof typeof Icons;

/** Icon rendered in a soft rounded square, tinted by category/project color. */
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
        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
        className,
      )}
      style={{
        backgroundColor: `var(--${color}-soft)`,
        color: `var(--${color})`,
      }}
    >
      <Icon className={cn("size-5", iconClassName)} />
    </span>
  );
}
