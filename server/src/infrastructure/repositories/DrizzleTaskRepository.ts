import { asc, eq } from "drizzle-orm";
import type { TaskRepository } from "../../domain/repositories.js";
import { Task, type TaskProps } from "../../domain/task.js";
import type { Database } from "../db/client.js";
import { tasks, type TaskRow } from "../db/schema.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toTask = (row: TaskRow) =>
  new Task({
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate,
    priority: row.priority,
    labels: row.labels,
    completed: row.completed,
    position: row.position,
  });

export class DrizzleTaskRepository implements TaskRepository {
  constructor(private readonly db: Database) {}

  async getAllTasks(userId: string): Promise<Task[]> {
    const rows = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));
    return rows.map(toTask);
  }

  async getTaskById(id: string): Promise<Task | null> {
    // Postgres rejects malformed uuids; treat them as "no such task".
    if (!UUID.test(id)) return null;
    const [row] = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return row ? toTask(row) : null;
  }

  async createTask(taskData: TaskProps): Promise<Task> {
    // Build the entity first so domain validation runs before anything is stored.
    const task = new Task(taskData);
    const [row] = await this.db
      .insert(tasks)
      .values({
        id: task.id,
        userId: task.userId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        labels: task.labels,
        completed: task.completed,
        position: task.position,
      })
      .returning();
    return toTask(row!);
  }

  async updateTask(
    id: string,
    updatedData: Partial<Omit<TaskProps, "id" | "userId">>,
  ): Promise<Task | null> {
    const existing = await this.getTaskById(id);
    if (!existing) return null;

    // Validate the merged result through the entity before writing it.
    const next = new Task({ ...existing, ...updatedData });
    const [row] = await this.db
      .update(tasks)
      .set({
        title: next.title,
        description: next.description,
        dueDate: next.dueDate,
        priority: next.priority,
        labels: next.labels,
        completed: next.completed,
        position: next.position,
      })
      .where(eq(tasks.id, id))
      .returning();
    return row ? toTask(row) : null;
  }

  async deleteTask(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    return deleted.length > 0;
  }
}
