import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type {
  LabelRepository,
  TaskRepository,
  UserRepository,
} from "../src/domain/repositories.js";
import { connectDatabase, type DatabaseConnection } from "../src/infrastructure/db/client.js";
import { labels, tasks, users } from "../src/infrastructure/db/schema.js";
import { ConflictError } from "../src/domain/errors.js";
import { InMemoryLabelRepository } from "../src/infrastructure/memory/InMemoryLabelRepository.js";
import { InMemoryTaskRepository } from "../src/infrastructure/memory/InMemoryTaskRepository.js";
import { InMemoryUserRepository } from "../src/infrastructure/memory/InMemoryUserRepository.js";
import { DrizzleLabelRepository } from "../src/infrastructure/repositories/DrizzleLabelRepository.js";
import { DrizzleTaskRepository } from "../src/infrastructure/repositories/DrizzleTaskRepository.js";
import { DrizzleUserRepository } from "../src/infrastructure/repositories/DrizzleUserRepository.js";

type Repositories = { tasks: TaskRepository; users: UserRepository; labels: LabelRepository };

/**
 * One behavioral spec, run against every implementation, so the in-memory
 * test doubles and the real database can't drift apart.
 */
function repositoryContract(name: string, setup: () => Promise<Repositories>) {
  describe(`${name} repositories`, () => {
    let repos: Repositories;
    let userId: string;

    const newTask = (title: string, position: number) => ({
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
        ...newTask("Write tests", 0),
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
      await repos.tasks.createTask(newTask("Second", 1));
      await repos.tasks.createTask(newTask("First", 0));

      const titles = (await repos.tasks.getAllTasks(userId)).map((task) => task.title);
      expect(titles).toEqual(["First", "Second"]);
      expect(await repos.tasks.getAllTasks(randomUUID())).toEqual([]);
    });

    it("updates only the given fields", async () => {
      const task = await repos.tasks.createTask(newTask("Draft", 0));
      const updated = await repos.tasks.updateTask(task.id, { completed: true });

      expect(updated).toMatchObject({ title: "Draft", completed: true });
      expect((await repos.tasks.getTaskById(task.id))?.completed).toBe(true);
    });

    it("deletes tasks and reports whether anything was deleted", async () => {
      const task = await repos.tasks.createTask(newTask("Temp", 0));
      expect(await repos.tasks.deleteTask(task.id)).toBe(true);
      expect(await repos.tasks.deleteTask(task.id)).toBe(false);
      expect(await repos.tasks.getTaskById(task.id)).toBeNull();
    });

    it("reorders only the given user's tasks", async () => {
      const a = await repos.tasks.createTask(newTask("A", 0));
      const b = await repos.tasks.createTask(newTask("B", 1));
      const c = await repos.tasks.createTask(newTask("C", 2));

      await repos.tasks.reorderTasks(userId, [c.id, a.id, b.id]);
      expect((await repos.tasks.getAllTasks(userId)).map((t) => t.title)).toEqual(["C", "A", "B"]);

      await repos.tasks.reorderTasks(randomUUID(), [b.id, a.id, c.id]);
      expect((await repos.tasks.getAllTasks(userId)).map((t) => t.title)).toEqual(["C", "A", "B"]);
    });

    describe("labels", () => {
      const newLabel = (name: string, owner = userId) => ({
        id: randomUUID(),
        userId: owner,
        name,
        color: "teal" as const,
      });

      it("creates, lists in creation order and finds labels", async () => {
        const gym = await repos.labels.createLabel(newLabel("Gym"));
        await repos.labels.createLabel(newLabel("Books"));

        expect((await repos.labels.listLabels(userId)).map((l) => l.name)).toEqual([
          "Gym",
          "Books",
        ]);
        expect((await repos.labels.getLabelById(gym.id))?.color).toBe("teal");
        expect((await repos.labels.findLabelByName(userId, " gym "))?.id).toBe(gym.id);
        expect(await repos.labels.findLabelByName(userId, "Nope")).toBeNull();
      });

      it("keeps users' labels apart", async () => {
        const otherUser = randomUUID();
        await repos.users.createUser({
          id: otherUser,
          email: `${otherUser}@example.com`,
          passwordHash: "hash",
        });
        await repos.labels.createLabel(newLabel("Gym", otherUser));

        expect(await repos.labels.listLabels(userId)).toEqual([]);
        expect(await repos.labels.findLabelByName(userId, "Gym")).toBeNull();
      });

      it("updates a label's name and colour", async () => {
        const label = await repos.labels.createLabel(newLabel("Old"));
        const updated = await repos.labels.updateLabel(label.id, { name: "New", color: "pink" });

        expect(updated).toMatchObject({ name: "New", color: "pink" });
        expect((await repos.labels.getLabelById(label.id))?.name).toBe("New");
      });

      it("deletes labels and handles unknown ids", async () => {
        const label = await repos.labels.createLabel(newLabel("Temp"));
        expect(await repos.labels.deleteLabel(label.id)).toBe(true);
        expect(await repos.labels.deleteLabel(label.id)).toBe(false);
        expect(await repos.labels.getLabelById("not-a-uuid")).toBeNull();
      });
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
  labels: new InMemoryLabelRepository(),
}));

/**
 * Runs the contract against a Drizzle database, emptied before each test,
 * plus checks that only make sense for a real database.
 */
function databaseContract(name: string, options: Parameters<typeof connectDatabase>[0]) {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await connectDatabase(options);
  });

  afterAll(async () => {
    await connection.close();
  });

  it(`${name}: the unique index rejects duplicate label names, ignoring case`, async () => {
    const repo = new DrizzleLabelRepository(connection.db);
    const userId = randomUUID();
    await new DrizzleUserRepository(connection.db).createUser({
      id: userId,
      email: `${userId}@example.com`,
      passwordHash: "hash",
    });
    await repo.createLabel({ id: randomUUID(), userId, name: "Work", color: "sky" });

    await expect(
      repo.createLabel({ id: randomUUID(), userId, name: "WORK", color: "red" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  repositoryContract(name, async () => {
    await connection.db.delete(tasks);
    await connection.db.delete(labels);
    await connection.db.delete(users);
    return {
      tasks: new DrizzleTaskRepository(connection.db),
      users: new DrizzleUserRepository(connection.db),
      labels: new DrizzleLabelRepository(connection.db),
    };
  });
}

databaseContract("PostgreSQL (PGlite)", { pgliteDataDir: "memory://" });

// CI also runs the contract against a real PostgreSQL server.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) databaseContract("PostgreSQL (server)", { url: testDatabaseUrl });
