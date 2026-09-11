"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "./stat-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { EvolutionChart } from "@/components/charts/evolution-chart";
import { CategoryDot } from "@/components/ui/category-badge";
import { useOrganize } from "@/components/providers/organize-provider";
import { CATEGORY_COLOR_OPTIONS } from "@/lib/categories";
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
  const { categories, subcategories } = useOrganize();
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [drillSubcategory, setDrillSubcategory] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }])),
    [categories],
  );
  // Subcategory slices get distinct palette colours: they only ever appear
  // together inside one category, where the shared parent colour would make
  // every slice identical.
  const subcategoryMap = useMemo(
    () =>
      new Map(
        subcategories.map((s, i) => [
          s.id,
          {
            name: s.name,
            color: CATEGORY_COLOR_OPTIONS[i % CATEGORY_COLOR_OPTIONS.length].value,
          },
        ]),
      ),
    [subcategories],
  );

  const total = getTrackedSeconds(entries);
  const dayCount = dailyTotals.length || 1;
  const average = total / dayCount;

  let donutData: GroupTotal[];
  let breadcrumb: string[] = [];
  let drillable = true;

  if (drillCategory && drillSubcategory) {
    const scoped = entries.filter(
      (e) => e.categoryId === drillCategory && e.subcategoryId === drillSubcategory,
    );
    donutData = getTimeByActivity(scoped);
    drillable = false;
    breadcrumb = [
      categoryMap.get(drillCategory)?.name ?? "—",
      subcategoryMap.get(drillSubcategory)?.name ?? "—",
    ];
  } else if (drillCategory) {
    const scoped = entries.filter((e) => e.categoryId === drillCategory);
    const hasSubcategories = scoped.some((e) => e.subcategoryId);
    // Subcategories are optional, so a category without them drills straight
    // through to its individual activities instead of a dead "Sin subcategoría".
    if (hasSubcategories) {
      donutData = groupBySeconds(
        scoped,
        (e) => e.subcategoryId ?? "none",
        (key) =>
          key === "none" ? "Sin subcategoría" : (subcategoryMap.get(key)?.name ?? "—"),
        (key) => (key === "none" ? "cat-free" : subcategoryMap.get(key)?.color),
      );
    } else {
      donutData = getTimeByActivity(scoped);
      drillable = false;
    }
    breadcrumb = [categoryMap.get(drillCategory)?.name ?? "—"];
  } else {
    donutData = getTimeByCategory(entries, categoryMap);
  }

  function handleSliceClick(key: string) {
    if (key === "none" || !drillable) return;
    if (!drillCategory) setDrillCategory(key);
    else setDrillSubcategory(key);
  }

  function goBack() {
    if (drillSubcategory) setDrillSubcategory(null);
    else setDrillCategory(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          <Sparkle className="size-4 text-primary" />
          Insights
        </h1>
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
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            {(drillCategory || drillSubcategory) && (
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

        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
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
