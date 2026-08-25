"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { formatDurationShort } from "@/lib/timer/timer-engine";

export function EvolutionChart({
  data,
}: {
  data: { day: string; seconds: number }[];
}) {
  const maxIndex = data.reduce(
    (best, d, i) => (d.seconds > data[best].seconds ? i : best),
    0,
  );

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--secondary)" }}
            formatter={(value) => formatDurationShort(Number(value))}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="seconds" radius={[4, 4, 4, 4]} maxBarSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === maxIndex ? "var(--primary)" : "var(--accent)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
