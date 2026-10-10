-- Old positions were text keys ("a0", "a1", …). Replace them with 0-based
-- integers that keep each user's existing order.
ALTER TABLE "tasks" ADD COLUMN "position_int" integer;--> statement-breakpoint
UPDATE "tasks" AS t
SET "position_int" = ranked.rank
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "position", "created_at") - 1 AS rank
  FROM "tasks"
) AS ranked
WHERE t."id" = ranked."id";--> statement-breakpoint
DROP INDEX IF EXISTS "tasks_user_position_idx";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "position_int" TO "position";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "tasks_user_position_idx" ON "tasks" USING btree ("user_id","position");
