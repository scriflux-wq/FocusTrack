"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR_OPTIONS, categoryColor } from "@/lib/categories";

function parseHsl(color: string): { h: number; s: number; l: number } | null {
  const m = color.match(/^hsl\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/i);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

/**
 * HSV maps perfectly onto a square (saturation × brightness); HSL doesn't, so
 * the custom picker works in HSV internally and converts to/from the HSL
 * string the rest of the app stores and renders. Both functions take and
 * return percentages (0-100) — the standard HSV/HSL conversion formulas need
 * fractions (0-1), so s/v/l are normalized on the way in and scaled back up
 * on the way out.
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

function labelFor(value: string): string {
  return CATEGORY_COLOR_OPTIONS.find((o) => o.value === value)?.label ?? "Personalizado";
}

/**
 * A dropdown, not an always-open panel: a trigger showing the current swatch
 * and name, opening a grid of named presets (tap to pick, done). A
 * "Personalizado" row underneath expands into a drag-to-pick saturation/
 * brightness square plus hue strip for anything outside the preset set.
 */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(() => !value.startsWith("cat-"));

  const isToken = !value.startsWith("hsl(");
  const parsedHsl = parseHsl(value);
  const initialHsv = parsedHsl ? hslToHsv(parsedHsl.h, parsedHsl.s, parsedHsl.l) : null;

  const [h, setH] = useState(initialHsv?.h ?? 258);
  const [s, setS] = useState(initialHsv?.s ?? 78);
  const [v, setV] = useState(initialHsv?.v ?? 82);

  const hsl = useMemo(() => hsvToHsl(h, s, v), [h, s, v]);
  const current = `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`;
  const triggerColor = isToken ? categoryColor(value) : current;

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  function commitCustom(nh: number, ns: number, nv: number) {
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
      commitCustom(h, x * 100, (1 - y) * 100);
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
      commitCustom(x * 360, s, v);
    };
    move(e.clientX);
    target.onpointermove = (ev) => move(ev.clientX);
    target.onpointerup = target.onpointercancel = () => {
      target.onpointermove = null;
    };
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 text-sm transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Palette className="size-4 shrink-0 text-muted-foreground" />
        <span
          className="size-5 shrink-0 rounded-full shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.5)]"
          style={{ backgroundColor: triggerColor }}
        />
        <span className="flex-1 truncate text-left font-medium">
          {isToken ? labelFor(value) : "Personalizado"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY_COLOR_OPTIONS.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setCustomOpen(false);
                  setOpen(false);
                }}
                className="flex flex-col items-center gap-1.5 rounded-lg py-2 transition-colors hover:bg-secondary/60"
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-popover transition-transform",
                    selected ? "ring-foreground" : "ring-transparent",
                  )}
                >
                  <span
                    className="flex size-full items-center justify-center rounded-full shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.15)]"
                    style={{ backgroundColor: categoryColor(opt.value) }}
                  >
                    {selected && (
                      <Check className="size-4 text-white drop-shadow-sm" strokeWidth={3} />
                    )}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className="mt-2 flex w-full items-center justify-between rounded-lg border-t border-border px-1 pt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Color personalizado
          <ChevronDown className={cn("size-3.5 transition-transform", customOpen && "rotate-180")} />
        </button>

        {customOpen && (
          <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
            <div
              ref={squareRef}
              onPointerDown={dragSquare}
              className="relative aspect-[5/3] w-full touch-none rounded-lg shadow-inner"
              style={{
                backgroundColor: `hsl(${h} 100% 50%)`,
                backgroundImage:
                  "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
              }}
            >
              <span
                className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                style={{ left: `${s}%`, top: `${100 - v}%`, backgroundColor: current }}
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
        )}
      </PopoverContent>
    </Popover>
  );
}
