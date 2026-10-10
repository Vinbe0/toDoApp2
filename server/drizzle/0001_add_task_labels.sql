ALTER TABLE "tasks" ALTER COLUMN "label" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "label" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "labels" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
-- Keep each task's existing single label.
UPDATE "tasks" SET "labels" = ARRAY["label"] WHERE "label" IS NOT NULL;
