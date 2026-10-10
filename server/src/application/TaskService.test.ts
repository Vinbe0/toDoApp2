import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../domain/errors.js";
import { InMemoryTaskRepository } from "../infrastructure/memory/InMemoryTaskRepository.js";
import { TaskService } from "./TaskService.js";

describe("TaskService", () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService(new InMemoryTaskRepository());
  });

  it("creates a task with a trimmed title and defaults", async () => {
    const task = await service.createTask("u1", { title: "  Ship it  " });
    expect(task).toMatchObject({ title: "Ship it", priority: "low", completed: false });
  });

  it("can create a task that is already completed", async () => {
    const task = await service.createTask("u1", { title: "Done already", completed: true });
    expect(task.completed).toBe(true);
  });

  it("rejects an empty title", async () => {
    await expect(service.createTask("u1", { title: " " })).rejects.toBeInstanceOf(ValidationError);
  });

  it("lists only the user's own tasks, in creation order", async () => {
    await service.createTask("u1", { title: "First" });
    await service.createTask("u2", { title: "Someone else's" });
    await service.createTask("u1", { title: "Second" });

    const titles = (await service.getAllTasks("u1")).map((t) => t.title);
    expect(titles).toEqual(["First", "Second"]);
  });

  it("filters by label and validates the filter", async () => {
    await service.createTask("u1", { title: "Work", labels: ["work"] });
    await service.createTask("u1", { title: "Milk", labels: ["shopping", "university"] });

    expect((await service.getAllTasks("u1", "shopping")).map((t) => t.title)).toEqual(["Milk"]);
    await expect(service.getAllTasks("u1", "gym")).rejects.toBeInstanceOf(ValidationError);
  });

  it("updates only the given fields", async () => {
    const task = await service.createTask("u1", { title: "Draft", priority: "high" });
    const updated = await service.updateTask("u1", task.id, { completed: true });
    expect(updated).toMatchObject({ title: "Draft", priority: "high", completed: true });
  });

  it("throws NotFoundError for unknown tasks", async () => {
    await expect(service.updateTask("u1", "nope", { title: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.deleteTask("u1", "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("treats another user's task as not found", async () => {
    const task = await service.createTask("u1", { title: "Private" });
    await expect(service.updateTask("u2", task.id, { title: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.deleteTask("u2", task.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("appends new tasks at the end", async () => {
    const first = await service.createTask("u1", { title: "First" });
    const second = await service.createTask("u1", { title: "Second" });
    expect([first.position, second.position]).toEqual([0, 1]);
  });

  it("reorders tasks; unlisted tasks keep their order after the listed ones", async () => {
    const ids: string[] = [];
    for (const title of ["A", "B", "C", "D"]) {
      ids.push((await service.createTask("u1", { title })).id);
    }
    const [, b, , d] = ids;

    const reordered = await service.reorderTasks("u1", [d!, b!]);
    expect(reordered.map((t) => t.title)).toEqual(["D", "B", "A", "C"]);
  });

  it("rejects reordering with duplicate or foreign ids", async () => {
    const mine = await service.createTask("u1", { title: "Mine" });
    const theirs = await service.createTask("u2", { title: "Theirs" });

    await expect(service.reorderTasks("u1", [mine.id, mine.id])).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.reorderTasks("u1", [theirs.id])).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes a task", async () => {
    const task = await service.createTask("u1", { title: "Temp" });
    await service.deleteTask("u1", task.id);
    expect(await service.getAllTasks("u1")).toEqual([]);
  });
});
