import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import type { Task } from "@/features/tasks/model/types";

vi.mock("vue-toastification", () => {
  const toast = Object.assign(vi.fn(), {
    info: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  });
  return { useToast: () => toast };
});

const makeTask = (overrides: Partial<Task>): Task => ({
  id: crypto.randomUUID(),
  text: "Task",
  description: "",
  completed: false,
  deadline: null,
  priority: "medium",
  labels: [],
  ...overrides,
});

async function setup(tasks: Task[]) {
  localStorage.setItem("guest-tasks", JSON.stringify(tasks));
  const { useTasks } = await import("@/features/tasks/composables/useTasks");
  let result!: ReturnType<typeof useTasks>;
  const pinia = createPinia();
  setActivePinia(pinia);
  mount(
    defineComponent({
      setup() {
        result = useTasks();
        return () => null;
      },
    }),
    { global: { plugins: [pinia] } },
  );
  await nextTick();
  return result;
}

const texts = (list: Task[]) => list.map((task) => task.text);

describe("useTasks (guest mode)", () => {
  beforeEach(() => localStorage.clear());

  it("loads tasks from localStorage", async () => {
    const { tasks } = await setup([makeTask({ text: "Saved" })]);
    expect(texts(tasks.value)).toEqual(["Saved"]);
  });

  it("exposes the filtered list and counts for the current query", async () => {
    const { query, filteredTasks, counts } = await setup([
      makeTask({ text: "Open report", priority: "low" }),
      makeTask({ text: "Urgent report", priority: "high" }),
      makeTask({ text: "Done", completed: true }),
    ]);

    query.value = { ...query.value, status: "active", search: "report", sort: "priority" };
    expect(texts(filteredTasks.value)).toEqual(["Urgent report", "Open report"]);
    expect(counts.value).toEqual({ all: 3, active: 2, completed: 1 });
  });

  it("resets filters but keeps the sort order", async () => {
    const { query, resetQuery } = await setup([]);
    query.value = { ...query.value, search: "x", status: "completed", sort: "deadline" };

    resetQuery();
    expect(query.value).toMatchObject({ search: "", status: "all", sort: "deadline" });
  });

  it("adds, completes and deletes tasks and persists them", async () => {
    const { tasks, draftTask, addNewTask, completeTask, deleteTask } = await setup([]);
    const stored = () => JSON.parse(localStorage.getItem("guest-tasks") ?? "[]");

    draftTask.value.text = "New task";
    await addNewTask();
    expect(stored()).toHaveLength(1);
    expect(draftTask.value.text).toBe("");

    const id = tasks.value[0]!.id;
    await completeTask(id);
    expect(stored()[0].completed).toBe(true);

    await deleteTask(id);
    expect(stored()).toHaveLength(0);
  });

  it("ignores blank task titles", async () => {
    const { tasks, draftTask, addNewTask } = await setup([]);
    draftTask.value.text = "   ";
    await addNewTask();
    expect(tasks.value).toHaveLength(0);
  });
});
