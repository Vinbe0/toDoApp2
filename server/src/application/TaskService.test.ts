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
    await service.createTask("u1", { title: "Work", label: "work" });
    await service.createTask("u1", { title: "Milk", label: "shopping" });

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

  it("deletes a task", async () => {
    const task = await service.createTask("u1", { title: "Temp" });
    await service.deleteTask("u1", task.id);
    expect(await service.getAllTasks("u1")).toEqual([]);
  });
});
