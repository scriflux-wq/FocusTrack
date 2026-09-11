/** Minimal line-art mountain illustration used in decorative quote cards. */
export function MountainArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 70"
      fill="none"
      className={className}
      style={{ color: "var(--primary)" }}
    >
      <path
        d="M2 62 L36 22 L52 40 L74 10 L108 54 L124 34 L158 62"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="74" cy="10" r="2.5" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}
