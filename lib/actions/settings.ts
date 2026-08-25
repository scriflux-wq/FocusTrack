"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { getUser } from "@/lib/supabase/server";

const settingsInput = z.object({
  timezone: z.string().min(1),
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  timeFormat: z.enum(["24h", "12h"]),
  defaultCalendarView: z.enum(["day", "3day", "week", "month"]),
});

export async function updateSettings(raw: z.infer<typeof settingsInput>) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const input = settingsInput.parse(raw);

  await db
    .update(settings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(settings.userId, user.id));

  revalidatePath("/", "layout");
}
