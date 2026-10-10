import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { TaskRepository, UserRepository } from "../src/domain/repositories.js";
import { connectDatabase, type DatabaseConnection } from "../src/infrastructure/db/client.js";
import { tasks, users } from "../src/infrastructure/db/schema.js";
import { InMemoryTaskRepository } from "../src/infrastructure/memory/InMemoryTaskRepository.js";
import { InMemoryUserRepository } from "../src/infrastructure/memory/InMemoryUserRepository.js";
import { DrizzleTaskRepository } from "../src/infrastructure/repositories/DrizzleTaskRepository.js";
import { DrizzleUserRepository } from "../src/infrastructure/repositories/DrizzleUserRepository.js";

type Repositories = { tasks: TaskRepository; users: UserRepository };

/**
 * One behavioral spec, run against every implementation, so the in-memory
 * test doubles and the real database can't drift apart.
 */
function repositoryContract(name: string, setup: () => Promise<Repositories>) {
  describe(`${name} repositories`, () => {
    let repos: Repositories;
    let userId: string;

    const newTask = (title: string, position: string) => ({
      id: randomUUID(),
      userId,
      title,
      position,
    });

    beforeEach(async () => {
      repos = await setup();
      userId = randomUUID();
      await repos.users.createUser({
        id: userId,
        email: `${userId}@example.com`,
        passwordHash: "hash",
      });
    });

    it("creates and finds users by id and case-insensitive email", async () => {
      const id = randomUUID();
      await repos.users.createUser({ id, email: "Mixed@Example.com", passwordHash: "hash" });

      expect((await repos.users.getUserById(id))?.passwordHash).toBe("hash");
      expect((await repos.users.getUserByEmail("mixed@example.COM"))?.id).toBe(id);
      expect(await repos.users.getUserByEmail("nobody@example.com")).toBeNull();
    });

    it("stores a task with all its fields", async () => {
      const created = await repos.tasks.createTask({
        ...newTask("Write tests", "a1"),
        description: "All of them",
        dueDate: "2026-11-01",
        priority: "high",
        labels: ["university", "work"],
      });

      const found = await repos.tasks.getTaskById(created.id);
      expect(found).toMatchObject({
        userId,
        title: "Write tests",
        description: "All of them",
        dueDate: "2026-11-01",
        priority: "high",
        labels: ["university", "work"],
        completed: false,
      });
    });

    it("lists a user's tasks ordered by position", async () => {
      await repos.tasks.createTask(newTask("Second", "a2"));
      await repos.tasks.createTask(newTask("First", "a1"));

      const titles = (await repos.tasks.getAllTasks(userId)).map((task) => task.title);
      expect(titles).toEqual(["First", "Second"]);
      expect(await repos.tasks.getAllTasks(randomUUID())).toEqual([]);
    });

    it("updates only the given fields", async () => {
      const task = await repos.tasks.createTask(newTask("Draft", "a1"));
      const updated = await repos.tasks.updateTask(task.id, { completed: true });

      expect(updated).toMatchObject({ title: "Draft", completed: true });
      expect((await repos.tasks.getTaskById(task.id))?.completed).toBe(true);
    });

    it("deletes tasks and reports whether anything was deleted", async () => {
      const task = await repos.tasks.createTask(newTask("Temp", "a1"));
      expect(await repos.tasks.deleteTask(task.id)).toBe(true);
      expect(await repos.tasks.deleteTask(task.id)).toBe(false);
      expect(await repos.tasks.getTaskById(task.id)).toBeNull();
    });

    it("returns null for unknown or malformed ids", async () => {
      expect(await repos.tasks.getTaskById(randomUUID())).toBeNull();
      expect(await repos.tasks.getTaskById("not-a-uuid")).toBeNull();
      expect(await repos.tasks.updateTask(randomUUID(), { title: "x" })).toBeNull();
    });
  });
}

repositoryContract("in-memory", async () => ({
  tasks: new InMemoryTaskRepository(),
  users: new InMemoryUserRepository(),
}));

let connection: DatabaseConnection;

beforeAll(async () => {
  connection = await connectDatabase({ pgliteDataDir: "memory://" });
});

afterAll(async () => {
  await connection.close();
});

repositoryContract("PostgreSQL (PGlite)", async () => {
  await connection.db.delete(tasks);
  await connection.db.delete(users);
  return {
    tasks: new DrizzleTaskRepository(connection.db),
    users: new DrizzleUserRepository(connection.db),
  };
});
