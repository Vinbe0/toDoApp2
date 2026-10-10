import { beforeEach, describe, expect, it } from "vitest";
import type { Task } from "@/features/tasks/model/types";
import type { StorageItem } from "@/shared/lib/storage";
import { LocalTaskRepository } from "../LocalTaskRepository";

function memoryStorage(initial: Task[] | null = null): StorageItem<Task[]> {
  let value = initial;
  return {
    get: () => (value ? structuredClone(value) : null),
    set: (next) => (value = structuredClone(next)),
    remove: () => (value = null),
  };
}

const input = (text: string) => ({
  text,
  description: "",
  deadline: null,
  priority: "medium" as const,
  labels: [],
});

describe("LocalTaskRepository", () => {
  let storage: StorageItem<Task[]>;
  let repo: LocalTaskRepository;
  let id = 0;

  beforeEach(() => {
    storage = memoryStorage();
    id = 0;
    repo = new LocalTaskRepository(storage, () => `id-${++id}`);
  });

  it("starts empty", async () => {
    expect(await repo.list()).toEqual([]);
  });

  it("creates tasks with an id and persists them", async () => {
    const created = await repo.create(input("Write tests"));
    expect(created).toMatchObject({ id: "id-1", text: "Write tests", completed: false });
    expect(storage.get()).toEqual([created]);
  });

  it("updates a task", async () => {
    await repo.create(input("A"));
    const updated = await repo.update("id-1", { completed: true, text: "A!" });
    expect(updated).toMatchObject({ completed: true, text: "A!" });
    expect((await repo.list())[0]).toEqual(updated);
  });

  it("rejects updates for unknown tasks", async () => {
    await expect(repo.update("missing", { text: "x" })).rejects.toThrow("Task not found");
  });

  it("removes a task", async () => {
    await repo.create(input("A"));
    await repo.create(input("B"));
    await repo.remove("id-1");
    expect((await repo.list()).map((t) => t.text)).toEqual(["B"]);
  });

  it("reorders tasks and keeps unknown ones at the end", async () => {
    for (const text of ["A", "B", "C"]) await repo.create(input(text));
    await repo.reorder(["id-3", "id-1"]);
    expect((await repo.list()).map((t) => t.text)).toEqual(["C", "A", "B"]);
  });

  it("clears all tasks", async () => {
    await repo.create(input("A"));
    repo.clear();
    expect(await repo.list()).toEqual([]);
  });
});
