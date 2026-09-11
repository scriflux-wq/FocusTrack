import { MountainArt } from "./mountain-art";

const QUOTES = [
  "Un día bien planeado es un mañana más brillante.",
  "Progreso, no perfección.",
  "Pequeños pasos hoy construyen un mañana mejor.",
  "El tiempo que cuidas es el tiempo que importa.",
];

export function QuoteCard({ seed = 0 }: { seed?: number }) {
  const quote = QUOTES[seed % QUOTES.length];
  return (
    <div className="flex flex-col justify-between gap-3 rounded-3xl border border-border bg-card p-5">
      <p className="font-serif text-base italic leading-snug text-foreground/80">
        &ldquo;{quote}&rdquo;
      </p>
      <MountainArt className="h-10 w-full self-end" />
    </div>
  );
}
