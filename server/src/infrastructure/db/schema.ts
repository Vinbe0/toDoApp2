import { boolean, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
    label: text("label", { enum: ["work", "shopping", "university"] })
      .notNull()
      .default("work"),
    completed: boolean("completed").notNull().default(false),
    position: text("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("tasks_user_position_idx").on(table.userId, table.position)],
);

export type TaskRow = typeof tasks.$inferSelect;
export type UserRow = typeof users.$inferSelect;
