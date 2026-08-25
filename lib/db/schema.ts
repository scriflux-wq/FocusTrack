import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const entrySourceEnum = pgEnum("entry_source", [
  "timer",
  "manual",
  "calendar",
]);
export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "paused",
  "completed",
  "archived",
]);
export const goalPeriodEnum = pgEnum("goal_period", [
  "daily",
  "weekly",
  "monthly",
]);
export const goalTypeEnum = pgEnum("goal_type", ["hours", "sessions"]);
export const recurrenceFreqEnum = pgEnum("recurrence_freq", [
  "daily",
  "weekdays",
  "weekly",
  "monthly",
]);
export const calendarViewEnum = pgEnum("calendar_view", [
  "day",
  "3day",
  "week",
  "month",
]);

// settings: one row per user, keyed by the Supabase auth user id
export const settings = pgTable("settings", {
  userId: uuid("user_id").primaryKey(),
  timezone: text("timezone").notNull().default("Europe/Madrid"),
  weekStartsOn: integer("week_starts_on").notNull().default(1), // 0=Sun..6=Sat
  dayStartTime: text("day_start_time").notNull().default("07:00"),
  dayEndTime: text("day_end_time").notNull().default("23:00"),
  timeFormat: text("time_format").notNull().default("24h"), // '24h' | '12h'
  defaultCalendarView: calendarViewEnum("default_calendar_view")
    .notNull()
    .default("week"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("cat-work"),
    icon: text("icon"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("categories_user_idx").on(t.userId)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    color: text("color").notNull().default("cat-projects"),
    icon: text("icon"),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("projects_user_idx").on(t.userId)],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("tags_user_name_idx").on(t.userId, t.name)],
);

export const plannedBlocks = pgTable(
  "planned_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    plannedStart: timestamp("planned_start", { withTimezone: true }).notNull(),
    plannedEnd: timestamp("planned_end", { withTimezone: true }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    recurrenceRule: jsonb("recurrence_rule").$type<{
      freq: "daily" | "weekdays" | "weekly" | "monthly";
      interval?: number;
      endDate?: string; // ISO date
    } | null>(),
    seriesId: uuid("series_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("planned_blocks_user_idx").on(t.userId),
    index("planned_blocks_range_idx").on(t.userId, t.plannedStart, t.plannedEnd),
  ],
);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }), // NULL = timer running
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    totalPausedSeconds: integer("total_paused_seconds").notNull().default(0),
    durationSeconds: integer("duration_seconds"), // set on finish
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    source: entrySourceEnum("source").notNull().default("manual"),
    plannedBlockId: uuid("planned_block_id").references(
      () => plannedBlocks.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("time_entries_user_idx").on(t.userId),
    index("time_entries_range_idx").on(t.userId, t.startTime, t.endTime),
    // Only one running (endTime IS NULL) session per user at a time.
    uniqueIndex("time_entries_one_active_idx")
      .on(t.userId)
      .where(sql`${t.endTime} is null`),
  ],
);

export const timeEntryTags = pgTable(
  "time_entry_tags",
  {
    timeEntryId: uuid("time_entry_id")
      .notNull()
      .references(() => timeEntries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.timeEntryId, t.tagId] })],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    activityName: text("activity_name"), // free-text match on time_entries.title
    targetAmount: integer("target_amount").notNull(), // minutes, or session count
    period: goalPeriodEnum("period").notNull().default("weekly"),
    goalType: goalTypeEnum("goal_type").notNull().default("hours"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
  timeEntries: many(timeEntries),
  plannedBlocks: many(plannedBlocks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  timeEntries: many(timeEntries),
  plannedBlocks: many(plannedBlocks),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one, many }) => ({
  category: one(categories, {
    fields: [timeEntries.categoryId],
    references: [categories.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  plannedBlock: one(plannedBlocks, {
    fields: [timeEntries.plannedBlockId],
    references: [plannedBlocks.id],
  }),
  entryTags: many(timeEntryTags),
}));

export const plannedBlocksRelations = relations(
  plannedBlocks,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [plannedBlocks.categoryId],
      references: [categories.id],
    }),
    project: one(projects, {
      fields: [plannedBlocks.projectId],
      references: [projects.id],
    }),
    timeEntries: many(timeEntries),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  entryTags: many(timeEntryTags),
}));

export const timeEntryTagsRelations = relations(timeEntryTags, ({ one }) => ({
  timeEntry: one(timeEntries, {
    fields: [timeEntryTags.timeEntryId],
    references: [timeEntries.id],
  }),
  tag: one(tags, {
    fields: [timeEntryTags.tagId],
    references: [tags.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type PlannedBlock = typeof plannedBlocks.$inferSelect;
export type NewPlannedBlock = typeof plannedBlocks.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Settings = typeof settings.$inferSelect;
