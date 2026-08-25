/**
 * Category/project colors are stored as the base CSS custom-property name
 * (e.g. "cat-work"), which always has a matching "<name>-soft" pastel
 * variant defined in globals.css. Using inline styles (not Tailwind
 * classes) means new color keys never need a JIT safelist update.
 */
export const CATEGORY_COLOR_OPTIONS = [
  { value: "cat-work", label: "Azul" },
  { value: "cat-health", label: "Verde" },
  { value: "cat-projects", label: "Violeta" },
  { value: "cat-learning", label: "Naranja" },
  { value: "cat-personal", label: "Amarillo" },
  { value: "cat-admin", label: "Gris" },
  { value: "cat-free", label: "Lavanda" },
] as const;

export function dotStyle(color: string): React.CSSProperties {
  return { backgroundColor: `var(--${color})` };
}

export function softChipStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `var(--${color}-soft)`,
    color: `var(--${color})`,
  };
}

/** Default icon per color key, used until a category/project picks its own icon. */
export const CATEGORY_ICON_BY_COLOR: Record<string, string> = {
  "cat-work": "Briefcase",
  "cat-health": "Dumbbell",
  "cat-projects": "FlaskConical",
  "cat-learning": "BookOpen",
  "cat-personal": "Smile",
  "cat-admin": "ClipboardList",
  "cat-free": "Coffee",
};
