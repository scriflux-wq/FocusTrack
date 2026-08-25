import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";

const DEFAULT_CATEGORIES = [
  { name: "Trabajo", color: "cat-work" },
  { name: "Salud", color: "cat-health" },
  { name: "Proyectos", color: "cat-projects" },
  { name: "Aprendizaje", color: "cat-learning" },
  { name: "Personal", color: "cat-personal" },
  { name: "Administración", color: "cat-admin" },
  { name: "Tiempo libre", color: "cat-free" },
] as const;

/** First-login bootstrap: gives a brand-new account a starter set of categories. */
export async function ensureDefaultCategories(userId: string) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existing.length > 0) return;

  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ userId, ...c })));
}
