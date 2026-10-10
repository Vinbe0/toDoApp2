CREATE TABLE "task_labels" (
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "task_labels_task_id_label_id_pk" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_labels_label_idx" ON "task_labels" USING btree ("label_id");--> statement-breakpoint
-- Existing users get the standard labels, like new accounts do.
INSERT INTO "labels" ("id", "user_id", "name", "color")
SELECT gen_random_uuid(), u."id", d."name", d."color"
FROM "users" u
CROSS JOIN (VALUES ('Work', 'sky'), ('Shopping', 'amber'), ('University', 'violet')) AS d("name", "color")
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Any other tag name a task used also becomes a label (capitalized), so nothing is lost.
INSERT INTO "labels" ("id", "user_id", "name", "color")
SELECT gen_random_uuid(), used."user_id", initcap(used."name"), 'slate'
FROM (SELECT DISTINCT t."user_id", old."name" FROM "tasks" t CROSS JOIN LATERAL unnest(t."labels") AS old("name")) AS used
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Link every task to the labels it had.
INSERT INTO "task_labels" ("task_id", "label_id")
SELECT t."id", l."id"
FROM "tasks" t
CROSS JOIN LATERAL unnest(t."labels") AS old("name")
JOIN "labels" l ON l."user_id" = t."user_id" AND lower(l."name") = lower(old."name")
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "labels";