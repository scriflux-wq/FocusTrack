CREATE TYPE "public"."calendar_view" AS ENUM('day', '3day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('timer', 'manual', 'calendar');--> statement-breakpoint
CREATE TYPE "public"."goal_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('hours', 'sessions');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."recurrence_freq" AS ENUM('daily', 'weekdays', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'cat-work' NOT NULL,
	"icon" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"project_id" uuid,
	"activity_name" text,
	"target_amount" integer NOT NULL,
	"period" "goal_period" DEFAULT 'weekly' NOT NULL,
	"goal_type" "goal_type" DEFAULT 'hours' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"planned_start" timestamp with time zone NOT NULL,
	"planned_end" timestamp with time zone NOT NULL,
	"category_id" uuid,
	"project_id" uuid,
	"notes" text,
	"recurrence_rule" jsonb,
	"series_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"color" text DEFAULT 'cat-projects' NOT NULL,
	"icon" text,
	"description" text,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'Europe/Madrid' NOT NULL,
	"week_starts_on" integer DEFAULT 1 NOT NULL,
	"day_start_time" text DEFAULT '07:00' NOT NULL,
	"day_end_time" text DEFAULT '23:00' NOT NULL,
	"time_format" text DEFAULT '24h' NOT NULL,
	"default_calendar_view" "calendar_view" DEFAULT 'week' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"total_paused_seconds" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer,
	"category_id" uuid,
	"project_id" uuid,
	"notes" text,
	"source" "entry_source" DEFAULT 'manual' NOT NULL,
	"planned_block_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entry_tags" (
	"time_entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "time_entry_tags_time_entry_id_tag_id_pk" PRIMARY KEY("time_entry_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_blocks" ADD CONSTRAINT "planned_blocks_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_blocks" ADD CONSTRAINT "planned_blocks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_planned_block_id_planned_blocks_id_fk" FOREIGN KEY ("planned_block_id") REFERENCES "public"."planned_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_tags" ADD CONSTRAINT "time_entry_tags_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entry_tags" ADD CONSTRAINT "time_entry_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planned_blocks_user_idx" ON "planned_blocks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planned_blocks_range_idx" ON "planned_blocks" USING btree ("user_id","planned_start","planned_end");--> statement-breakpoint
CREATE INDEX "projects_user_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "time_entries_user_idx" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_entries_range_idx" ON "time_entries" USING btree ("user_id","start_time","end_time");--> statement-breakpoint
CREATE UNIQUE INDEX "time_entries_one_active_idx" ON "time_entries" USING btree ("user_id") WHERE "time_entries"."end_time" is null;