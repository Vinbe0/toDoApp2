import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  /** Stored lowercase; uniqueness is therefore case-insensitive. */
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    dueDate: date("due_date", { mode: "string" }),
    priority: text("priority", { enum: ["low", "medium", "high"] })
      .notNull()
      .default("low"),
    completed: boolean("completed").notNull().default(false),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("tasks_user_position_idx").on(table.userId, table.position)],
);

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    /** Increases with every insert, so labels list in the order they were created. */
    seq: integer("seq").generatedAlwaysAsIdentity(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // One label per name per user, ignoring case.
  (table) => [uniqueIndex("labels_user_name_idx").on(table.userId, sql`lower(${table.name})`)],
);

/** Which labels each task has (many-to-many). */
export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId] }),
    index("task_labels_label_idx").on(table.labelId),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type LabelRow = typeof labels.$inferSelect;
export type UserRow = typeof users.$inferSelect;
