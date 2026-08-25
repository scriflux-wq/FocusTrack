"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "./stat-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { EvolutionChart } from "@/components/charts/evolution-chart";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { formatDurationShort } from "@/lib/timer/timer-engine";
import {
  getTrackedSeconds,
  getTimeByCategory,
  getTimeByActivity,
  groupBySeconds,
  type AnalyticsEntry,
  type GroupTotal,
} from "@/lib/analytics/core";

export type Period = "today" | "week" | "month" | "year";

export function InsightsView({
  period,
  entries,
  dailyTotals,
  comparisonPercent,
  mostProductiveDay,
  streak,
  untrackedSeconds,
}: {
  period: Period;
  entries: AnalyticsEntry[];
  dailyTotals: { day: string; seconds: number }[];
  comparisonPercent: number | null;
  mostProductiveDay: { day: string; seconds: number } | null;
  streak: number;
  untrackedSeconds: number;
}) {
  const router = useRouter();
  const { categories, projects } = useOrganize();
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [drillProject, setDrillProject] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }])),
    [categories],
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, { name: p.name, color: p.color }])),
    [projects],
  );

  const total = getTrackedSeconds(entries);
  const dayCount = dailyTotals.length || 1;
  const average = total / dayCount;

  let donutData: GroupTotal[];
  let breadcrumb: string[] = [];

  if (drillCategory && drillProject) {
    const scoped = entries.filter(
      (e) => e.categoryId === drillCategory && e.projectId === drillProject,
    );
    donutData = getTimeByActivity(scoped);
    breadcrumb = [
      categoryMap.get(drillCategory)?.name ?? "—",
      projectMap.get(drillProject)?.name ?? "—",
    ];
  } else if (drillCategory) {
    const scoped = entries.filter((e) => e.categoryId === drillCategory);
    donutData = groupBySeconds(
      scoped,
      (e) => e.projectId ?? "none",
      (key) => (key === "none" ? "Sin proyecto" : (projectMap.get(key)?.name ?? "—")),
      (key) => (key === "none" ? "cat-free" : projectMap.get(key)?.color),
    );
    breadcrumb = [categoryMap.get(drillCategory)?.name ?? "—"];
  } else {
    donutData = getTimeByCategory(entries, categoryMap);
  }

  function handleSliceClick(key: string) {
    if (key === "none") return;
    if (!drillCategory) setDrillCategory(key);
    else if (!drillProject) setDrillProject(key);
  }

  function goBack() {
    if (drillProject) setDrillProject(null);
    else setDrillCategory(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <Tabs value={period} onValueChange={(v) => router.push(`/insights?period=${v}`)}>
          <TabsList>
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="year">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total registrado"
          value={formatDurationShort(total)}
          hint={
            comparisonPercent === null
              ? undefined
              : `${comparisonPercent >= 0 ? "+" : ""}${Math.round(comparisonPercent)}% vs periodo anterior`
          }
        />
        <StatCard label="Media por día" value={formatDurationShort(average)} />
        <StatCard
          label="Día más productivo"
          value={mostProductiveDay ? formatDurationShort(mostProductiveDay.seconds) : "—"}
          hint={mostProductiveDay?.day}
        />
        <StatCard label="Racha" value={`${streak} ${streak === 1 ? "día" : "días"}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            {(drillCategory || drillProject) && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                {breadcrumb.join(" / ")}
              </button>
            )}
            {!drillCategory && (
              <h2 className="text-sm font-medium text-muted-foreground">
                Tiempo por categoría
              </h2>
            )}
          </div>
          <DonutChart data={donutData} onSliceClick={handleSliceClick} />
          <ul className="flex flex-col gap-1.5">
            {donutData.slice(0, 6).map((d) => (
              <li key={d.key} className="flex items-center gap-2 text-sm">
                <CategoryDot color={d.color ?? "cat-free"} />
                <span className="flex-1 truncate">{d.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatDurationShort(d.seconds)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Evolución</h2>
          <EvolutionChart data={dailyTotals} />
          <p className="text-xs text-muted-foreground">
            {formatDurationShort(untrackedSeconds)} sin registrar en este periodo
          </p>
        </div>
      </div>
    </div>
  );
}
