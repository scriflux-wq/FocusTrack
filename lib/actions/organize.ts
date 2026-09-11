"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { categories, subcategories } from "@/lib/db/schema";
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

const subcategoryInput = z.object({
  name: z.string().trim().min(1).max(60),
  categoryId: z.string().uuid(),
});

export async function createSubcategory(raw: z.infer<typeof subcategoryInput>) {
  const userId = await requireUserId();
  const input = subcategoryInput.parse(raw);
  const [subcategory] = await db
    .insert(subcategories)
    .values({ userId, ...input })
    .returning();
  revalidatePath("/", "layout");
  return subcategory;
}

export async function updateSubcategory(
  id: string,
  raw: Partial<z.infer<typeof subcategoryInput>>,
) {
  const userId = await requireUserId();
  const input = subcategoryInput.partial().parse(raw);
  await db
    .update(subcategories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)));
  revalidatePath("/", "layout");
}

/** Entries keep their category; their subcategory_id is nulled by the FK. */
export async function deleteSubcategory(id: string) {
  const userId = await requireUserId();
  await db
    .delete(subcategories)
    .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)));
  revalidatePath("/", "layout");
}
