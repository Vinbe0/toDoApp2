import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import type { Label, Task } from "@/features/tasks/model/types";
import {
  type ApiLabelRepository,
  type ApiTaskRepository,
  LocalLabelRepository,
  LocalTaskRepository,
  type NewTask,
  labelRepositories,
  taskRepositories,
} from "@/features/tasks/repositories";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { HttpError } from "@/shared/api";
import { notify } from "@/shared/lib/notify";
import type { StorageItem } from "@/shared/lib/storage";
import { UNDO_TIMEOUT_MS, useTasksStore } from "../tasksStore";

vi.mock("@/shared/lib/notify", () => ({
  notify: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    fromError: vi.fn(),
    withAction: vi.fn(),
  },
}));

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: {
    login: vi.fn(async () => ({ token: "t", user: { id: "u1", email: "me@example.com" } })),
    register: vi.fn(),
  },
}));

function memoryStorage<T>(initial: T | null = null): StorageItem<T> {
  let value: T | null = initial;
  return {
    get: () => (value ? structuredClone(value) : null),
    set: (next) => (value = structuredClone(next)),
    remove: () => (value = null),
  };
}

const newTask = (text: string, overrides: Partial<NewTask> = {}): NewTask => ({
  text,
  description: "",
  deadline: null,
  priority: "medium",
  labelIds: [],
  ...overrides,
});

const texts = (list: Task[]) => list.map((task) => task.text);

let local: LocalTaskRepository;
let api: LocalTaskRepository; // an in-memory stand-in for the server
let localLabels: LocalLabelRepository;
let apiLabels: LocalLabelRepository;

async function setup(guestTasks: string[] = []) {
  for (const text of guestTasks) await local.create(newTask(text));
  const store = useTasksStore();
  await store.load();
  return store;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());

  let id = 0;
  local = new LocalTaskRepository(memoryStorage<Task[]>(), () => `local-${++id}`);
  api = new LocalTaskRepository(memoryStorage<Task[]>(), () => `api-${++id}`);
  taskRepositories.local = local;
  taskRepositories.api = api as unknown as ApiTaskRepository;

  // Both start with the default labels (guest ids "work", …; the "server" gets new ids).
  localLabels = new LocalLabelRepository(memoryStorage<Label[]>());
  apiLabels = new LocalLabelRepository(memoryStorage<Label[]>(), () => `api-label-${++id}`);
  labelRepositories.local = localLabels;
  labelRepositories.api = apiLabels as unknown as ApiLabelRepository;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("tasks store", () => {
  it("loads guest tasks", async () => {
    const store = await setup(["A", "B"]);
    expect(store.status).toBe("ready");
    expect(texts(store.tasks)).toEqual(["A", "B"]);
  });

  it("reports a load failure", async () => {
    vi.spyOn(local, "list").mockRejectedValueOnce(new Error("Disk on fire"));
    const store = await setup();
    expect(store.status).toBe("error");
    expect(notify.fromError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Disk on fire" }),
      "Could not load your tasks",
    );
  });

  it("adds a trimmed task and ignores blank titles", async () => {
    const store = await setup();

    expect(await store.add(newTask("  Write tests  "))).toBe(true);
    expect(await store.add(newTask("   "))).toBe(false);
    expect(texts(store.tasks)).toEqual(["Write tests"]);
    expect(texts(await local.list())).toEqual(["Write tests"]);
  });

  it("toggles completion and persists it", async () => {
    const store = await setup(["A"]);
    await store.toggle("local-1");
    expect(store.tasks[0]?.completed).toBe(true);
    expect((await local.list())[0]?.completed).toBe(true);
  });

  it("rolls back an optimistic update when saving fails", async () => {
    const store = await setup(["A"]);
    vi.spyOn(local, "update").mockRejectedValueOnce(new Error("Offline"));

    await store.toggle("local-1");
    expect(store.tasks[0]?.completed).toBe(false);
    expect(notify.fromError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Offline" }),
      "Could not update the task",
    );
  });

  it("renames a task but ignores empty names", async () => {
    const store = await setup(["Old"]);
    await store.rename("local-1", "  ");
    expect(store.tasks[0]?.text).toBe("Old");
    await store.rename("local-1", "New");
    expect(store.tasks[0]?.text).toBe("New");
  });

  it("reschedules a task and rolls back when saving fails", async () => {
    const store = await setup(["Report"]);
    await store.reschedule("local-1", "2026-10-14");
    expect(store.tasks[0]?.deadline).toBe("2026-10-14");

    vi.spyOn(local, "update").mockRejectedValueOnce(new Error("Nope"));
    await store.reschedule("local-1", null);
    expect(store.tasks[0]?.deadline).toBe("2026-10-14");
    expect(notify.fromError).toHaveBeenCalledWith(expect.any(Error), "Could not change the date");
  });

  it("restores a deleted task when the delete fails", async () => {
    const store = await setup(["A", "B"]);
    vi.spyOn(local, "remove").mockRejectedValueOnce(new Error("Nope"));

    await store.remove("local-1");
    expect(texts(store.tasks)).toEqual(["A", "B"]);
  });

  it("filters through the query and resets it without losing the sort", async () => {
    const store = await setup(["Buy milk", "Write report"]);
    store.setQuery({ search: "milk", sort: "priority" });
    expect(texts(store.visibleTasks)).toEqual(["Buy milk"]);

    store.resetQuery();
    expect(store.query).toMatchObject({ search: "", sort: "priority" });
    expect(store.visibleTasks).toHaveLength(2);
  });

  it("persists a drag-and-drop reorder", async () => {
    const store = await setup(["A", "B", "C"]);
    const [a, b, c] = store.tasks as [Task, Task, Task];

    store.reorder([c, a, b]);
    await nextTick();
    expect(texts(store.tasks)).toEqual(["C", "A", "B"]);
    expect(texts(await local.list())).toEqual(["C", "A", "B"]);
  });

  describe("clearCompleted", () => {
    it("hides completed tasks and deletes them after the undo window", async () => {
      vi.useFakeTimers();
      const store = await setup(["Open", "Done"]);
      await store.toggle("local-2");

      store.clearCompleted();
      expect(texts(store.tasks)).toEqual(["Open"]);
      expect(await local.list()).toHaveLength(2);

      await vi.advanceTimersByTimeAsync(UNDO_TIMEOUT_MS);
      expect(texts(await local.list())).toEqual(["Open"]);
    });

    it("can be undone before anything is deleted", async () => {
      vi.useFakeTimers();
      const store = await setup(["Open", "Done"]);
      await store.toggle("local-2");

      store.clearCompleted();
      const undo = vi.mocked(notify.withAction).mock.calls[0]![2];
      undo();
      await vi.advanceTimersByTimeAsync(UNDO_TIMEOUT_MS);

      expect(texts(store.tasks)).toEqual(["Open", "Done"]);
      expect(await local.list()).toHaveLength(2);
    });

    it("tells the user when there is nothing to clear", async () => {
      const store = await setup(["Open"]);
      store.clearCompleted();
      expect(notify.info).toHaveBeenCalledWith("No completed tasks to clear");
    });
  });

  describe("with an account", () => {
    it("switches to the server repository after login", async () => {
      await api.create(newTask("Server task"));
      const store = await setup(["Guest task"]);

      await useAuthStore().login("me@example.com", "secret");
      await vi.waitFor(() => expect(texts(store.tasks)).toEqual(["Server task"]));
    });

    it("imports guest tasks after confirmation", async () => {
      const store = await setup(["One", "Two"]);
      const confirm = vi.fn(() => true);

      expect(await store.importGuestTasks(confirm)).toBe(2);
      expect(confirm).toHaveBeenCalledWith(2);
      expect(texts(await api.list())).toEqual(["One", "Two"]);
      expect(await local.list()).toEqual([]);
    });

    it("maps guest labels to the account's labels by name, creating missing ones", async () => {
      // The account has its own label ids; the guest also made "Gym".
      apiLabels = new LocalLabelRepository(
        memoryStorage<Label[]>([{ id: "srv-work", name: "Work", color: "sky" }]),
        () => "srv-new",
      );
      labelRepositories.api = apiLabels as unknown as ApiLabelRepository;
      const gym = await localLabels.create({ name: "Gym", color: "red" });
      await local.create(newTask("Report", { labelIds: ["work"] }));
      await local.create(newTask("Run", { labelIds: [gym.id, "work"] }));
      const store = await setup();

      await store.importGuestTasks(() => true);

      expect(await apiLabels.list()).toEqual([
        { id: "srv-work", name: "Work", color: "sky" },
        { id: "srv-new", name: "Gym", color: "red" },
      ]);
      const imported = await api.list();
      expect(imported.map((t) => [t.text, t.labelIds])).toEqual([
        ["Report", ["srv-work"]],
        ["Run", ["srv-new", "srv-work"]],
      ]);
    });

    it("keeps completed guest tasks completed after import", async () => {
      const store = await setup(["Done"]);
      await store.toggle("local-1");

      await store.importGuestTasks(() => true);
      expect((await api.list())[0]?.completed).toBe(true);
    });

    it("keeps guest tasks when the import is declined", async () => {
      const store = await setup(["One"]);
      expect(await store.importGuestTasks(() => false)).toBe(0);
      expect(await local.list()).toHaveLength(1);
    });

    it("reports failed requests, including an expired session", async () => {
      const store = await setup(["A"]);
      const expired = new HttpError("Unauthorized", 401);
      vi.spyOn(local, "update").mockRejectedValueOnce(expired);

      await store.toggle("local-1");
      expect(notify.fromError).toHaveBeenCalledWith(expired, "Could not update the task");
    });
  });
});
