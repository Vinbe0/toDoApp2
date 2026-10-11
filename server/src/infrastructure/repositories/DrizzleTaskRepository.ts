import { and, asc, eq, inArray } from "drizzle-orm";
import type { TaskRepository } from "../../domain/repositories.js";
import { Task, type TaskProps } from "../../domain/task.js";
import type { Database } from "../db/client.js";
import { labels, taskLabels, tasks, type TaskRow } from "../db/schema.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Works for the database and for a transaction. */
type Executor = Pick<Database, "select" | "insert" | "update" | "delete">;

const toTask = (row: TaskRow, labelIds: string[]) =>
  new Task({
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate,
    priority: row.priority,
    labelIds,
    completed: row.completed,
    position: row.position,
  });

const taskColumns = (task: Task) => ({
  title: task.title,
  description: task.description,
  dueDate: task.dueDate,
  priority: task.priority,
  completed: task.completed,
  position: task.position,
});

export class DrizzleTaskRepository implements TaskRepository {
  constructor(private readonly db: Database) {}

  async getAllTasks(userId: string): Promise<Task[]> {
    const rows = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));
    return this.withLabels(this.db, rows);
  }

  async getTaskById(id: string): Promise<Task | null> {
    // Postgres rejects malformed uuids; treat them as "no such task".
    if (!UUID.test(id)) return null;
    const rows = await this.db.select().from(tasks).where(eq(tasks.id, id));
    const [task] = await this.withLabels(this.db, rows);
    return task ?? null;
  }

  async createTask(taskData: TaskProps): Promise<Task> {
    // Build the entity first so domain validation runs before anything is stored.
    const task = new Task(taskData);
    await this.db.transaction(async (tx) => {
      await tx.insert(tasks).values({ id: task.id, userId: task.userId, ...taskColumns(task) });
      await this.setLabels(tx, task.id, task.labelIds);
    });
    return (await this.getTaskById(task.id))!;
  }

  async updateTask(
    id: string,
    updatedData: Partial<Omit<TaskProps, "id" | "userId">>,
  ): Promise<Task | null> {
    const existing = await this.getTaskById(id);
    if (!existing) return null;

    // Validate the merged result through the entity before writing it.
    const next = new Task({ ...existing, ...updatedData });
    await this.db.transaction(async (tx) => {
      await tx.update(tasks).set(taskColumns(next)).where(eq(tasks.id, id));
      if (updatedData.labelIds !== undefined) await this.setLabels(tx, id, next.labelIds);
    });
    return this.getTaskById(id);
  }

  async reorderTasks(userId: string, orderedIds: string[]): Promise<void> {
    // One transaction: the list is never left half-reordered.
    await this.db.transaction(async (tx) => {
      for (const [position, id] of orderedIds.entries()) {
        await tx
          .update(tasks)
          .set({ position })
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
      }
    });
  }

  async removeLabelFromTasks(labelId: string): Promise<void> {
    // The foreign key also cascades when the label row is deleted; this keeps
    // the repository correct on its own.
    if (!UUID.test(labelId)) return;
    await this.db.delete(taskLabels).where(eq(taskLabels.labelId, labelId));
  }

  async deleteAllTasks(userId: string): Promise<void> {
    // task_labels rows go with them (foreign key cascade).
    await this.db.delete(tasks).where(eq(tasks.userId, userId));
  }

  async deleteTask(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    return deleted.length > 0;
  }

  private async setLabels(db: Executor, taskId: string, labelIds: string[]) {
    await db.delete(taskLabels).where(eq(taskLabels.taskId, taskId));
    if (labelIds.length) {
      await db.insert(taskLabels).values(labelIds.map((labelId) => ({ taskId, labelId })));
    }
  }

  /** Loads label ids for many tasks in one query, in label creation order. */
  private async withLabels(db: Executor, rows: TaskRow[]): Promise<Task[]> {
    if (!rows.length) return [];
    const links = await db
      .select({ taskId: taskLabels.taskId, labelId: taskLabels.labelId })
      .from(taskLabels)
      .innerJoin(labels, eq(labels.id, taskLabels.labelId))
      .where(
        inArray(
          taskLabels.taskId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(labels.seq));

    const byTask = new Map<string, string[]>();
    for (const { taskId, labelId } of links) {
      byTask.set(taskId, [...(byTask.get(taskId) ?? []), labelId]);
    }
    return rows.map((row) => toTask(row, byTask.get(row.id) ?? []));
  }
}
