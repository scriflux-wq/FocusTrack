import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { timeEntries, categories, projects } from "@/lib/db/schema";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  const rows = await db
    .select({
      id: timeEntries.id,
      title: timeEntries.title,
      startTime: timeEntries.startTime,
      endTime: timeEntries.endTime,
      durationSeconds: timeEntries.durationSeconds,
      category: categories.name,
      project: projects.name,
      notes: timeEntries.notes,
      source: timeEntries.source,
    })
    .from(timeEntries)
    .leftJoin(categories, eq(timeEntries.categoryId, categories.id))
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(eq(timeEntries.userId, user.id))
    .orderBy(timeEntries.startTime);

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="focustrack-export.json"`,
      },
    });
  }

  const header = [
    "title",
    "start_time",
    "end_time",
    "duration_seconds",
    "category",
    "project",
    "notes",
    "source",
  ];
  const csvEscape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.title,
        r.startTime.toISOString(),
        r.endTime?.toISOString() ?? "",
        r.durationSeconds ?? "",
        r.category ?? "",
        r.project ?? "",
        r.notes ?? "",
        r.source,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="focustrack-export.csv"`,
    },
  });
}
