/** Soft holographic gradient wash behind the whole app; glass cards blur over it. */
export function AppBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 h-full w-full bg-[var(--bg-base)]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 8% 8%, var(--bg-blob-pink) 0%, transparent 45%),
          radial-gradient(circle at 92% 12%, var(--bg-blob-blue) 0%, transparent 45%),
          radial-gradient(circle at 15% 92%, var(--bg-blob-mint) 0%, transparent 45%),
          radial-gradient(circle at 88% 88%, var(--bg-blob-lav) 0%, transparent 50%)
        `,
      }}
    />
  );
}
