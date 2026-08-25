import "server-only";
import { and, desc, eq, gte, isNull, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { timeEntries, categories, projects, tags, settings } from "@/lib/db/schema";

export async function getActiveTimer(userId: string) {
  const [entry] = await db
    .select({
      id: timeEntries.id,
      title: timeEntries.title,
      startTime: timeEntries.startTime,
      pausedAt: timeEntries.pausedAt,
      totalPausedSeconds: timeEntries.totalPausedSeconds,
      categoryId: timeEntries.categoryId,
      projectId: timeEntries.projectId,
      categoryName: categories.name,
      categoryColor: categories.color,
      projectName: projects.name,
    })
    .from(timeEntries)
    .leftJoin(categories, eq(timeEntries.categoryId, categories.id))
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endTime)));

  return entry ?? null;
}

export async function getCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.isActive, true)))
    .orderBy(categories.name);
}

export async function getProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), sql`${projects.status} != 'archived'`))
    .orderBy(projects.name);
}

export async function getTags(userId: string) {
  return db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.name);
}

/** Distinct recent activity "recipes" (title + category + project) for Quick Start. */
export async function getRecentActivities(userId: string, limit = 6) {
  const rows = await db
    .selectDistinctOn([timeEntries.title], {
      title: timeEntries.title,
      categoryId: timeEntries.categoryId,
      projectId: timeEntries.projectId,
      categoryColor: categories.color,
      lastUsed: timeEntries.startTime,
    })
    .from(timeEntries)
    .leftJoin(categories, eq(timeEntries.categoryId, categories.id))
    .where(eq(timeEntries.userId, userId))
    .orderBy(timeEntries.title, desc(timeEntries.startTime));

  return rows
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
    .slice(0, limit);
}

/** Finished entries whose startTime falls within [start, end). */
export async function getFinishedEntriesInRange(
  userId: string,
  start: Date,
  end: Date,
) {
  return db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        isNotNull(timeEntries.endTime),
        gte(timeEntries.startTime, start),
        lt(timeEntries.startTime, end),
      ),
    )
    .orderBy(timeEntries.startTime);
}

export async function getRecentEntries(userId: string, limit = 200) {
  return db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), isNotNull(timeEntries.endTime)))
    .orderBy(desc(timeEntries.startTime))
    .limit(limit);
}

export async function getOrCreateSettings(userId: string) {
  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId));
  if (existing) return existing;

  const [created] = await db.insert(settings).values({ userId }).returning();
  return created;
}
