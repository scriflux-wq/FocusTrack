"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import type { GroupTotal } from "@/lib/analytics/core";

export function DonutChart({
  data,
  onSliceClick,
}: {
  data: GroupTotal[];
  onSliceClick?: (key: string) => void;
}) {
  const total = data.reduce((s, d) => s + d.seconds, 0);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="seconds"
            nameKey="label"
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            onClick={(entry) => onSliceClick?.((entry as unknown as GroupTotal).key)}
          >
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={`var(--${d.color ?? "cat-free"})`}
                className={onSliceClick ? "cursor-pointer" : undefined}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">
          {formatDurationShort(total)}
        </span>
        <span className="text-xs text-muted-foreground">total</span>
      </div>
    </div>
  );
}
