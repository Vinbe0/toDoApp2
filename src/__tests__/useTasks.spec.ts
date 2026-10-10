import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import type { Task } from "@/types/todo";

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
  const { useTasks } = await import("@/composables/useTasks");
  let result!: ReturnType<typeof useTasks>;
  mount(
    defineComponent({
      setup() {
        result = useTasks();
        return () => null;
      },
    }),
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

  it("filters active and completed tasks", async () => {
    const { filter, filteredTasks } = await setup([
      makeTask({ text: "Open" }),
      makeTask({ text: "Done", completed: true }),
    ]);

    filter.value = "active";
    expect(texts(filteredTasks.value)).toEqual(["Open"]);

    filter.value = "completed";
    expect(texts(filteredTasks.value)).toEqual(["Done"]);
  });

  it("sorts by priority, then deadline", async () => {
    const { filter, filteredTasks } = await setup([
      makeTask({ text: "Low", priority: "low" }),
      makeTask({ text: "High later", priority: "high", deadline: "2026-12-01" }),
      makeTask({ text: "High sooner", priority: "high", deadline: "2026-11-01" }),
    ]);

    filter.value = "byPriority";
    expect(texts(filteredTasks.value)).toEqual(["High sooner", "High later", "Low"]);
  });

  it("puts tasks without a deadline last when sorting by date", async () => {
    const { filter, filteredTasks } = await setup([
      makeTask({ text: "No date" }),
      makeTask({ text: "Later", deadline: "2026-12-01" }),
      makeTask({ text: "Sooner", deadline: "2026-11-01" }),
    ]);

    filter.value = "byDate";
    expect(texts(filteredTasks.value)).toEqual(["Sooner", "Later", "No date"]);
  });

  it("searches by title case-insensitively", async () => {
    const { filter, searchTitle, filteredTasks } = await setup([
      makeTask({ text: "Buy Milk" }),
      makeTask({ text: "Write report" }),
    ]);

    filter.value = "byTitle";
    searchTitle.value = "milk";
    expect(texts(filteredTasks.value)).toEqual(["Buy Milk"]);
  });

  it("filters by any or all selected labels", async () => {
    const { filter, selectedLabels, strictLabelFilter, filteredTasks } = await setup([
      makeTask({ text: "Work only", labels: ["work"] }),
      makeTask({ text: "Work + uni", labels: ["work", "university"] }),
      makeTask({ text: "Shopping", labels: ["shopping"] }),
    ]);

    filter.value = "byLabel";
    selectedLabels.value = ["work", "university"];
    expect(texts(filteredTasks.value)).toEqual(["Work only", "Work + uni"]);

    strictLabelFilter.value = true;
    expect(texts(filteredTasks.value)).toEqual(["Work + uni"]);
  });

  it("adds, completes and deletes tasks and persists them", async () => {
    const { tasks, draftTask, addNewTask, completeTask, deleteTask } = await setup([]);
    const stored = () => JSON.parse(localStorage.getItem("guest-tasks") ?? "[]");

    draftTask.value.text = "New task";
    await addNewTask();
    expect(stored()).toHaveLength(1);
    expect(draftTask.value.text).toBe("");

    const id = tasks.value[0].id;
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
