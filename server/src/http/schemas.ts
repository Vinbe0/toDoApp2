import { z } from "zod";
import { ALLOWED_LABELS, PRIORITIES } from "../domain/task.js";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

/** Accepts any parseable date and stores the calendar day (YYYY-MM-DD). */
const dueDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid due date")
  .transform((value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(value).toISOString().slice(0, 10),
  )
  .nullable();

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Task title cannot be empty").max(200),
    description: z.string().max(2000).optional(),
    dueDate: dueDate.optional(),
    priority: z.enum(PRIORITIES as [string, ...string[]]).optional(),
    labels: z
      .array(z.enum(ALLOWED_LABELS as [string, ...string[]]))
      .max(10)
      .optional(),
    // Allowed on create so already-done tasks (e.g. imported from guest mode) stay done.
    completed: z.boolean().optional(),
  })
  .strict();

export const updateTaskSchema = createTaskSchema
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const reorderTasksSchema = z
  .object({ ids: z.array(z.string().uuid("Invalid task id")).min(1).max(1000) })
  .strict();

export const taskQuerySchema = z.object({
  label: z.enum(ALLOWED_LABELS as [string, ...string[]]).optional(),
});
