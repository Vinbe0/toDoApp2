import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { Label, Task } from "@/features/tasks/model/types";
import {
  LocalLabelRepository,
  LocalTaskRepository,
  labelRepositories,
  taskRepositories,
} from "@/features/tasks/repositories";
import { notify } from "@/shared/lib/notify";
import type { StorageItem } from "@/shared/lib/storage";
import { useLabelsStore } from "../labelsStore";
import { useTasksStore } from "../tasksStore";

vi.mock("@/shared/lib/notify", () => ({
  notify: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    fromError: vi.fn(),
    withAction: vi.fn(),
  },
}));

function memoryStorage<T>(): StorageItem<T> {
  let value: T | null = null;
  return {
    get: () => (value ? structuredClone(value) : null),
    set: (next) => (value = structuredClone(next)),
    remove: () => (value = null),
  };
}

let labelsRepo: LocalLabelRepository;
let tasksRepo: LocalTaskRepository;

beforeEach(async () => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
  let id = 0;
  labelsRepo = new LocalLabelRepository(memoryStorage<Label[]>(), () => `label-${++id}`);
  tasksRepo = new LocalTaskRepository(memoryStorage<Task[]>(), () => `task-${++id}`);
  labelRepositories.local = labelsRepo;
  taskRepositories.local = tasksRepo;
});

async function setup() {
  const labels = useLabelsStore();
  await labels.load();
  return labels;
}

const names = (labels: Label[]) => labels.map((label) => label.name);

describe("labels store (guest)", () => {
  it("loads the default labels and resolves ids in sidebar order", async () => {
    const labels = await setup();
    expect(names(labels.labels)).toEqual(["Work", "Shopping", "University"]);
    expect(names(labels.resolve(["university", "work", "unknown"]))).toEqual([
      "Work",
      "University",
    ]);
  });

  it("creates a label with the next free colour", async () => {
    const labels = await setup();
    const gym = await labels.create("Gym");
    expect(gym).toMatchObject({ name: "Gym", color: "red" });
    expect(names(await labelsRepo.list())).toContain("Gym");
  });

  it("refuses invalid or duplicate names", async () => {
    const labels = await setup();
    expect(await labels.create("  ")).toBeNull();
    expect(await labels.create("work")).toBeNull();
    expect(notify.error).toHaveBeenLastCalledWith('"Work" already exists');
    expect(labels.labels).toHaveLength(3);
  });

  it("renames and recolours", async () => {
    const labels = await setup();
    expect(await labels.rename("work", "Job")).toBe(true);
    expect(await labels.recolor("work", "teal")).toBe(true);
    expect(labels.byId.get("work")).toEqual({ id: "work", name: "Job", color: "teal" });
    expect((await labelsRepo.list())[0]).toEqual({ id: "work", name: "Job", color: "teal" });
  });

  it("rolls back a rename that fails to save", async () => {
    const labels = await setup();
    vi.spyOn(labelsRepo, "update").mockRejectedValueOnce(new Error("Disk full"));
    expect(await labels.rename("work", "Job")).toBe(false);
    expect(labels.byId.get("work")?.name).toBe("Work");
  });

  it("deleting a label removes it from tasks and from the filter", async () => {
    await tasksRepo.create({
      text: "Report",
      description: "",
      deadline: null,
      priority: "medium",
      labelIds: ["work", "shopping"],
    });
    const tasks = useTasksStore();
    await tasks.load();
    tasks.setQuery({ labelIds: ["work"] });
    const labels = await setup();

    await labels.remove("work");

    expect(names(labels.labels)).toEqual(["Shopping", "University"]);
    expect(tasks.tasks[0]?.labelIds).toEqual(["shopping"]);
    expect(tasks.query.labelIds).toEqual([]);
    expect((await tasksRepo.list())[0]?.labelIds).toEqual(["shopping"]);
  });
});
