import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import type { Task } from "@/features/tasks/model/types";
import {
  type ApiTaskRepository,
  LocalTaskRepository,
  type NewTask,
  taskRepositories,
} from "@/features/tasks/repositories";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { HttpError } from "@/shared/api";
import { notify } from "@/shared/lib/notify";
import type { StorageItem } from "@/shared/lib/storage";
import { UNDO_TIMEOUT_MS, useTasksStore } from "../tasksStore";

vi.mock("@/shared/lib/notify", () => ({
  notify: { info: vi.fn(), success: vi.fn(), error: vi.fn(), withAction: vi.fn() },
}));

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: {
    login: vi.fn(async () => ({ token: "t", user: { id: "u1", email: "me@example.com" } })),
    register: vi.fn(),
  },
}));

function memoryStorage(): StorageItem<Task[]> {
  let value: Task[] | null = null;
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
  labels: [],
  ...overrides,
});

const texts = (list: Task[]) => list.map((task) => task.text);

let local: LocalTaskRepository;
let api: LocalTaskRepository; // an in-memory stand-in for the server

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
  local = new LocalTaskRepository(memoryStorage(), () => `local-${++id}`);
  api = new LocalTaskRepository(memoryStorage(), () => `api-${++id}`);
  taskRepositories.local = local;
  taskRepositories.api = api as unknown as ApiTaskRepository;
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
    expect(notify.error).toHaveBeenCalledWith("Disk on fire");
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
    expect(notify.error).toHaveBeenCalledWith("Offline");
  });

  it("renames a task but ignores empty names", async () => {
    const store = await setup(["Old"]);
    await store.rename("local-1", "  ");
    expect(store.tasks[0]?.text).toBe("Old");
    await store.rename("local-1", "New");
    expect(store.tasks[0]?.text).toBe("New");
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

    it("explains an expired session", async () => {
      const store = await setup(["A"]);
      vi.spyOn(local, "update").mockRejectedValueOnce(new HttpError("Unauthorized", 401));

      await store.toggle("local-1");
      expect(notify.error).toHaveBeenCalledWith("Your session has expired. Please log in again.");
    });
  });
});
