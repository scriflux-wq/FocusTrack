/**
 * A category's `color` is either a preset token (e.g. "cat-work"), resolved
 * through the `--cat-*`/`--cat-*-soft` CSS variable pairs in globals.css, or
 * a literal CSS color (e.g. "hsl(260 70% 55%)") picked freely in the color
 * picker. Tokens always start with "cat-"; anything else is used as-is.
 */
function isPresetToken(color: string): boolean {
  return color.startsWith("cat-");
}

/** The solid accent color — dots, borders, chart slices, text on a soft chip. */
export function categoryColor(color: string): string {
  return isPresetToken(color) ? `var(--${color})` : color;
}

/**
 * The soft pastel background. Presets have a hand-tuned `-soft` variant;
 * custom colors get theirs mixed on the fly against the card color so it
 * stays pale in light mode and muted in dark mode automatically.
 */
export function categorySoftColor(color: string): string {
  return isPresetToken(color)
    ? `var(--${color}-soft)`
    : `color-mix(in oklch, ${color} 22%, var(--card))`;
}

export function dotStyle(color: string): React.CSSProperties {
  return { backgroundColor: categoryColor(color) };
}

export function softChipStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: categorySoftColor(color),
    color: categoryColor(color),
  };
}

/** Curated preset chips shown above the free color picker. */
export const CATEGORY_COLOR_OPTIONS = [
  { value: "cat-work", label: "Periwinkle" },
  { value: "cat-health", label: "Teal" },
  { value: "cat-personal", label: "Sky" },
  { value: "cat-learning", label: "Sand" },
  { value: "cat-projects", label: "Lavender" },
  { value: "cat-admin", label: "Slate" },
] as const;

/** Default icon per preset color key, used until a category picks its own icon. */
export const CATEGORY_ICON_BY_COLOR: Record<string, string> = {
  "cat-work": "Briefcase",
  "cat-health": "Dumbbell",
  "cat-projects": "FlaskConical",
  "cat-learning": "BookOpen",
  "cat-personal": "Smile",
  "cat-admin": "ClipboardList",
  "cat-free": "Coffee",
};
