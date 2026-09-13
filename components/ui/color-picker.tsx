"use client";

import { useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR_OPTIONS, categoryColor } from "@/lib/categories";

const PRESET_HUES = Array.from({ length: 10 }, (_, i) => Math.round((360 / 10) * i));

function parseHsl(color: string): { h: number; s: number; l: number } | null {
  const m = color.match(/^hsl\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/i);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

/**
 * HSV maps perfectly onto a square (saturation × brightness); HSL doesn't, so
 * the picker works in HSV internally and converts to/from the HSL string the
 * rest of the app stores and renders. Both functions take and return
 * percentages (0-100) — the standard HSV/HSL conversion formulas need
 * fractions (0-1), so s/v/l/l are normalized on the way in and scaled back
 * up on the way out.
 */
function hsvToHsl(h: number, s: number, v: number): { h: number; s: number; l: number } {
  const S = s / 100;
  const V = v / 100;
  const l = V * (1 - S / 2);
  const sl = l === 0 || l === 1 ? 0 : (V - l) / Math.min(l, 1 - l);
  return { h, s: sl * 100, l: l * 100 };
}

function hslToHsv(h: number, s: number, l: number): { h: number; s: number; v: number } {
  const L = l / 100;
  const S = s / 100;
  const v = L + S * Math.min(L, 1 - L);
  const sv = v === 0 ? 0 : 2 * (1 - L / v);
  return { h, s: sv * 100, v: v * 100 };
}

/**
 * A real color picker: a saturation/brightness square plus a hue strip, both
 * drag-to-pick, the same interaction model as macOS, Figma or Sketch — far
 * more "premium" and precise than a pair of plain range sliders. Presets
 * above give a one-tap shortcut for the common cases.
 */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const isToken = !value.startsWith("hsl(");
  const parsedHsl = parseHsl(value);
  const initialHsv = parsedHsl ? hslToHsv(parsedHsl.h, parsedHsl.s, parsedHsl.l) : null;

  const [h, setH] = useState(initialHsv?.h ?? 258);
  const [s, setS] = useState(initialHsv?.s ?? 78);
  const [v, setV] = useState(initialHsv?.v ?? 82);

  const hsl = useMemo(() => hsvToHsl(h, s, v), [h, s, v]);
  const current = `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`;
  const swatchColor = isToken ? categoryColor(value) : current;

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  function commit(nh: number, ns: number, nv: number) {
    setH(nh);
    setS(ns);
    setV(nv);
    const next = hsvToHsl(nh, ns, nv);
    onChange(`hsl(${Math.round(next.h)} ${Math.round(next.s)}% ${Math.round(next.l)}%)`);
  }

  function dragSquare(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const rect = squareRef.current!.getBoundingClientRect();
    const move = (clientX: number, clientY: number) => {
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      commit(h, x * 100, (1 - y) * 100);
    };
    move(e.clientX, e.clientY);
    target.onpointermove = (ev) => move(ev.clientX, ev.clientY);
    target.onpointerup = target.onpointercancel = () => {
      target.onpointermove = null;
    };
  }

  function dragHue(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const rect = hueRef.current!.getBoundingClientRect();
    const move = (clientX: number) => {
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      commit(x * 360, s, v);
    };
    move(e.clientX);
    target.onpointermove = (ev) => move(ev.clientX);
    target.onpointerup = target.onpointercancel = () => {
      target.onpointermove = null;
    };
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Swatch
          key="preview"
          color={swatchColor}
          selected={false}
          label="Color actual"
          onClick={() => {}}
          large
        />
        <span className="h-7 w-px bg-border" aria-hidden />
        {CATEGORY_COLOR_OPTIONS.map((opt) => (
          <Swatch
            key={opt.value}
            color={categoryColor(opt.value)}
            selected={value === opt.value}
            label={opt.label}
            onClick={() => onChange(opt.value)}
          />
        ))}
        {PRESET_HUES.map((hue) => (
          <Swatch
            key={hue}
            color={`hsl(${hue} 78% 60%)`}
            selected={false}
            label="Color"
            onClick={() => commit(hue, 78, 82)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
        <div
          ref={squareRef}
          onPointerDown={dragSquare}
          className="relative aspect-[5/3] w-full touch-none rounded-xl shadow-inner"
          style={{
            backgroundColor: `hsl(${h} 100% 50%)`,
            backgroundImage:
              "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          }}
        >
          <span
            className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
            style={{
              left: `${s}%`,
              top: `${100 - v}%`,
              backgroundColor: current,
            }}
          />
        </div>

        <div
          ref={hueRef}
          onPointerDown={dragHue}
          className="relative h-4 w-full touch-none rounded-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 55%), hsl(180 90% 55%), hsl(240 90% 55%), hsl(300 90% 55%), hsl(360 90% 55%))",
          }}
        >
          <span
            className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
            style={{ left: `${(h / 360) * 100}%`, backgroundColor: `hsl(${h} 90% 55%)` }}
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
  large,
}: {
  color: string;
  selected: boolean;
  label: string;
  onClick: () => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform",
        large ? "size-9" : "size-7 hover:scale-110",
        selected ? "ring-foreground" : "ring-transparent",
      )}
    >
      <span
        className="flex size-full items-center justify-center rounded-full shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.15)]"
        style={{ backgroundColor: color }}
      >
        {selected && <Check className="size-3.5 text-white drop-shadow-sm" strokeWidth={3} />}
      </span>
    </button>
  );
}
