"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { goals } from "@/lib/db/schema";
import { getUser } from "@/lib/supabase/server";

async function requireUserId() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// No scope (categoryId/projectId/activityName all null) is valid on purpose:
// it represents an overall tracked-time goal (e.g. the "Today" hero ring).
const goalInput = z.object({
  name: z.string().trim().min(1).max(80),
  categoryId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  activityName: z.string().trim().max(120).nullable().optional(),
  targetAmount: z.coerce.number().int().positive(),
  period: z.enum(["daily", "weekly", "monthly"]),
  goalType: z.enum(["hours", "sessions"]),
});

export async function createGoal(raw: z.infer<typeof goalInput>) {
  const userId = await requireUserId();
  const input = goalInput.parse(raw);
  const [goal] = await db.insert(goals).values({ userId, ...input }).returning();
  revalidatePath("/", "layout");
  return goal;
}

export async function deactivateGoal(id: string) {
  const userId = await requireUserId();
  await db
    .update(goals)
    .set({ active: false })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  revalidatePath("/", "layout");
}
