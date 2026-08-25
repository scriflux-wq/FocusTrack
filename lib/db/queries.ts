import "server-only";
import { and, desc, eq, gte, ilike, isNull, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  timeEntries,
  categories,
  projects,
  tags,
  settings,
  goals,
} from "@/lib/db/schema";
import { getDayRange, getWeekRange, getMonthRange } from "@/lib/calendar/date-utils";
import { getTrackedSeconds } from "@/lib/analytics/core";

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

/** The whole-day tracked-time goal, if the user set one (no category/project/activity). */
export async function getOverallDailyGoalMinutes(userId: string) {
  const [goal] = await db
    .select({ targetAmount: goals.targetAmount })
    .from(goals)
    .where(
      and(
        eq(goals.userId, userId),
        eq(goals.active, true),
        eq(goals.period, "daily"),
        eq(goals.goalType, "hours"),
        isNull(goals.categoryId),
        isNull(goals.projectId),
        isNull(goals.activityName),
      ),
    )
    .limit(1);
  return goal?.targetAmount ?? null;
}

export async function getRecentEntries(userId: string, limit = 200) {
  return db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), isNotNull(timeEntries.endTime)))
    .orderBy(desc(timeEntries.startTime))
    .limit(limit);
}

export async function getGoalsWithProgress(
  userId: string,
  tz: string,
  weekStartsOn: number,
) {
  const goalRows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.active, true)))
    .orderBy(goals.name);

  const now = new Date();

  return Promise.all(
    goalRows.map(async (goal) => {
      const range =
        goal.period === "daily"
          ? getDayRange(now, tz)
          : goal.period === "weekly"
            ? getWeekRange(now, tz, weekStartsOn)
            : getMonthRange(now, tz);

      const conditions = [
        eq(timeEntries.userId, userId),
        isNotNull(timeEntries.endTime),
        gte(timeEntries.startTime, range.start),
        lt(timeEntries.startTime, range.end),
      ];
      if (goal.categoryId) conditions.push(eq(timeEntries.categoryId, goal.categoryId));
      if (goal.projectId) conditions.push(eq(timeEntries.projectId, goal.projectId));
      if (goal.activityName) conditions.push(ilike(timeEntries.title, goal.activityName));

      const matching = await db
        .select({
          durationSeconds: timeEntries.durationSeconds,
        })
        .from(timeEntries)
        .where(and(...conditions));

      const current =
        goal.goalType === "sessions"
          ? matching.length
          : getTrackedSeconds(
              matching.map((m) => ({
                id: "",
                title: "",
                startTime: now,
                endTime: now,
                durationSeconds: m.durationSeconds,
                categoryId: null,
                projectId: null,
              })),
            ) / 60;

      const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((current / goal.targetAmount) * 100)) : 0;

      return { goal, current, percent };
    }),
  );
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
