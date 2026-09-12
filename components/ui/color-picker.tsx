"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR_OPTIONS, categoryColor } from "@/lib/categories";

const HUE_STEPS = 12;
/** One evenly-spaced swatch per 30° of hue, at a punchy, consistent saturation/lightness. */
const SPECTRUM_SWATCHES = Array.from({ length: HUE_STEPS }, (_, i) => {
  const hue = Math.round((360 / HUE_STEPS) * i);
  return `hsl(${hue} 72% 58%)`;
});

function parseHsl(color: string): { h: number; s: number; l: number } | null {
  const m = color.match(/^hsl\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/i);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

/**
 * A big free-form palette instead of a handful of fixed swatches: a row of
 * spectrum presets for a fast pick, plus hue and lightness sliders — drag
 * either to dial in any color, at a fixed 72% saturation that stays vivid
 * without ever going muddy or neon.
 */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const isToken = !value.startsWith("hsl(");
  const parsed = parseHsl(value);
  const [hue, setHue] = useState(parsed?.h ?? 260);
  const [lightness, setLightness] = useState(parsed?.l ?? 58);

  const current = useMemo(() => `hsl(${hue} 72% ${lightness}%)`, [hue, lightness]);

  function pickCustom(h: number, l: number) {
    setHue(h);
    setLightness(l);
    onChange(`hsl(${h} 72% ${l}%)`);
  }

  const hueTrack = `linear-gradient(to right, ${Array.from(
    { length: 13 },
    (_, i) => `hsl(${i * 30} 72% ${lightness}%)`,
  ).join(", ")})`;
  const lightnessTrack = `linear-gradient(to right, hsl(${hue} 72% 18%), hsl(${hue} 72% 50%), hsl(${hue} 72% 85%))`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {CATEGORY_COLOR_OPTIONS.map((opt) => (
          <Swatch
            key={opt.value}
            color={categoryColor(opt.value)}
            selected={value === opt.value}
            label={opt.label}
            onClick={() => onChange(opt.value)}
          />
        ))}
        <span className="mx-1 my-auto h-6 w-px bg-border" aria-hidden />
        {SPECTRUM_SWATCHES.map((swatch) => (
          <Swatch
            key={swatch}
            color={swatch}
            selected={!isToken && value === swatch}
            label="Color"
            onClick={() => onChange(swatch)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
        <span
          className="size-9 shrink-0 rounded-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
          style={{ backgroundColor: isToken ? categoryColor(value) : current }}
        />
        <div className="flex flex-1 flex-col gap-2.5">
          <Slider
            aria-label="Tono"
            value={hue}
            max={360}
            track={hueTrack}
            onChange={(h) => pickCustom(h, lightness)}
          />
          <Slider
            aria-label="Luminosidad"
            value={lightness}
            min={12}
            max={90}
            track={lightnessTrack}
            onChange={(l) => pickCustom(hue, l)}
          />
        </div>
      </div>
    </div>
  );
}

function Swatch({
  color,
  selected,
  label,
  onClick,
}: {
  color: string;
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
        selected ? "ring-foreground" : "ring-transparent",
      )}
    >
      <span
        className="flex size-full items-center justify-center rounded-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
        style={{ backgroundColor: color }}
      >
        {selected && <Check className="size-3.5 text-white drop-shadow-sm" strokeWidth={3} />}
      </span>
    </button>
  );
}

function Slider({
  value,
  min = 0,
  max,
  track,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: number;
  min?: number;
  max: number;
  track: string;
  onChange: (v: number) => void;
  "aria-label": string;
}) {
  return (
    <input
      type="range"
      aria-label={ariaLabel}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
      style={{ backgroundImage: track, backgroundSize: "100% 60%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    />
  );
}
