"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { categories, projects } from "@/lib/db/schema";
import { getUser } from "@/lib/supabase/server";

async function requireUserId() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

const categoryInput = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().min(1),
  icon: z.string().optional().nullable(),
});

export async function createCategory(raw: z.infer<typeof categoryInput>) {
  const userId = await requireUserId();
  const input = categoryInput.parse(raw);
  const [category] = await db
    .insert(categories)
    .values({ userId, ...input })
    .returning();
  revalidatePath("/", "layout");
  return category;
}

export async function updateCategory(
  id: string,
  raw: Partial<z.infer<typeof categoryInput>>,
) {
  const userId = await requireUserId();
  const input = categoryInput.partial().parse(raw);
  await db
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/", "layout");
}

/** Categories are archived, never hard-deleted, so historical entries keep context. */
export async function archiveCategory(id: string) {
  const userId = await requireUserId();
  await db
    .update(categories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/", "layout");
}

const projectInput = z.object({
  name: z.string().trim().min(1).max(60),
  categoryId: z.string().uuid().nullable().optional(),
  color: z.string().min(1),
  icon: z.string().optional().nullable(),
  status: z.enum(["active", "paused", "completed", "archived"]).optional(),
});

export async function createProject(raw: z.infer<typeof projectInput>) {
  const userId = await requireUserId();
  const input = projectInput.parse(raw);
  const [project] = await db
    .insert(projects)
    .values({ userId, ...input })
    .returning();
  revalidatePath("/", "layout");
  return project;
}

export async function updateProject(
  id: string,
  raw: Partial<z.infer<typeof projectInput>>,
) {
  const userId = await requireUserId();
  const input = projectInput.partial().parse(raw);
  await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  revalidatePath("/", "layout");
}

export async function archiveProject(id: string) {
  const userId = await requireUserId();
  await db
    .update(projects)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  revalidatePath("/", "layout");
}
