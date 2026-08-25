import { dotStyle, softChipStyle } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={dotStyle(color)}
    />
  );
}

export function CategoryChip({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={softChipStyle(color)}
    >
      <CategoryDot color={color} />
      {label}
    </span>
  );
}
