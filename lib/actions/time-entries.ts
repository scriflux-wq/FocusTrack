"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { timeEntries, timeEntryTags, tags } from "@/lib/db/schema";
import { getUser } from "@/lib/supabase/server";
import {
  computeResumedPausedSeconds,
  computeFinishedDurationSeconds,
} from "@/lib/timer/timer-engine";

async function requireUserId() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

const entryInput = z.object({
  title: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  categoryId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  tagNames: z.array(z.string().trim().min(1).max(40)).optional(),
});

async function syncTags(
  userId: string,
  timeEntryId: string,
  tagNames: string[] | undefined,
) {
  if (!tagNames) return;
  await db.delete(timeEntryTags).where(eq(timeEntryTags.timeEntryId, timeEntryId));
  if (tagNames.length === 0) return;

  const existing = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, tagNames)));
  const existingNames = new Set(existing.map((t) => t.name));
  const toCreate = tagNames.filter((n) => !existingNames.has(n));

  const created = toCreate.length
    ? await db
        .insert(tags)
        .values(toCreate.map((name) => ({ userId, name })))
        .returning()
    : [];

  const allTags = [...existing, ...created];
  await db.insert(timeEntryTags).values(
    allTags.map((t) => ({ timeEntryId, tagId: t.id })),
  );
}

/** Starts a live timer. Fails if one is already running (enforced by DB too). */
export async function startTimer(rawInput: z.infer<typeof entryInput>) {
  const userId = await requireUserId();
  const input = entryInput.parse(rawInput);

  const active = await db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endTime)));
  if (active.length > 0) {
    throw new Error("Ya hay una sesión en marcha. Finalízala primero.");
  }

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId,
      title: input.title,
      startTime: new Date(),
      categoryId: input.categoryId ?? null,
      projectId: input.projectId ?? null,
      notes: input.notes ?? null,
      source: "timer",
    })
    .returning();

  await syncTags(userId, entry.id, input.tagNames);

  revalidatePath("/", "layout");
  return entry;
}

export async function pauseTimer(entryId: string) {
  const userId = await requireUserId();
  await db
    .update(timeEntries)
    .set({ pausedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(timeEntries.id, entryId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.endTime),
      ),
    );
  revalidatePath("/", "layout");
}

export async function resumeTimer(entryId: string) {
  const userId = await requireUserId();
  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.id, entryId), eq(timeEntries.userId, userId)));
  if (!entry) throw new Error("Sesión no encontrada");

  const now = new Date();
  const totalPausedSeconds = computeResumedPausedSeconds(
    { pausedAt: entry.pausedAt, totalPausedSeconds: entry.totalPausedSeconds },
    now,
  );

  await db
    .update(timeEntries)
    .set({ pausedAt: null, totalPausedSeconds, updatedAt: now })
    .where(eq(timeEntries.id, entryId));
  revalidatePath("/", "layout");
}

export async function finishTimer(entryId: string) {
  const userId = await requireUserId();
  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.id, entryId), eq(timeEntries.userId, userId)));
  if (!entry) throw new Error("Sesión no encontrada");

  const now = new Date();
  const totalPausedSeconds = entry.pausedAt
    ? computeResumedPausedSeconds(
        { pausedAt: entry.pausedAt, totalPausedSeconds: entry.totalPausedSeconds },
        now,
      )
    : entry.totalPausedSeconds;
  const durationSeconds = computeFinishedDurationSeconds(
    { startTime: entry.startTime, pausedAt: null, totalPausedSeconds },
    now,
  );

  await db
    .update(timeEntries)
    .set({
      endTime: now,
      pausedAt: null,
      totalPausedSeconds,
      durationSeconds,
      updatedAt: now,
    })
    .where(eq(timeEntries.id, entryId));
  revalidatePath("/", "layout");
}

export async function discardActiveTimer(entryId: string) {
  const userId = await requireUserId();
  await db
    .delete(timeEntries)
    .where(
      and(
        eq(timeEntries.id, entryId),
        eq(timeEntries.userId, userId),
        isNull(timeEntries.endTime),
      ),
    );
  revalidatePath("/", "layout");
}

const manualEntryInput = entryInput.extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export async function createManualEntry(
  rawInput: z.infer<typeof manualEntryInput>,
) {
  const userId = await requireUserId();
  const input = manualEntryInput.parse(rawInput);

  if (input.endTime <= input.startTime) {
    throw new Error("La hora de fin debe ser posterior al inicio");
  }

  const durationSeconds = Math.round(
    (input.endTime.getTime() - input.startTime.getTime()) / 1000,
  );

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId,
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      durationSeconds,
      categoryId: input.categoryId ?? null,
      projectId: input.projectId ?? null,
      notes: input.notes ?? null,
      source: "manual",
    })
    .returning();

  await syncTags(userId, entry.id, input.tagNames);

  revalidatePath("/", "layout");
  return entry;
}

const updateEntryInput = entryInput.partial().extend({
  id: z.string().uuid(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
});

export async function updateEntry(rawInput: z.infer<typeof updateEntryInput>) {
  const userId = await requireUserId();
  const input = updateEntryInput.parse(rawInput);

  const [existing] = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.id, input.id), eq(timeEntries.userId, userId)));
  if (!existing) throw new Error("Sesión no encontrada");

  const startTime = input.startTime ?? existing.startTime;
  const endTime = input.endTime ?? existing.endTime;
  if (endTime && endTime <= startTime) {
    throw new Error("La hora de fin debe ser posterior al inicio");
  }

  await db
    .update(timeEntries)
    .set({
      title: input.title ?? existing.title,
      startTime,
      endTime,
      durationSeconds: endTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : existing.durationSeconds,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      projectId:
        input.projectId !== undefined ? input.projectId : existing.projectId,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(timeEntries.id, input.id));

  await syncTags(userId, input.id, input.tagNames);

  revalidatePath("/", "layout");
}

export async function deleteEntry(id: string) {
  const userId = await requireUserId();
  await db
    .delete(timeEntries)
    .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)));
  revalidatePath("/", "layout");
}
