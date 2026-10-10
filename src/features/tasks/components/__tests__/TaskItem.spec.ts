import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import type { Task } from "@/features/tasks/model/types";
import TaskItem from "../TaskItem.vue";

const baseTask: Task = {
  id: "1",
  text: "Write tests",
  description: "Cover the store",
  completed: false,
  deadline: null,
  priority: "high",
  labels: ["work"],
};

const mountItem = (task: Partial<Task> = {}) =>
  mount(TaskItem, {
    props: { task: { ...baseTask, ...task }, draggable: true },
    attachTo: document.body,
  });

describe("TaskItem", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("renders title, description, priority and labels", () => {
    const text = mountItem().text();
    expect(text).toContain("Write tests");
    expect(text).toContain("Cover the store");
    expect(text).toContain("High");
    expect(text).toContain("#Work");
  });

  it("emits toggle and remove", async () => {
    const wrapper = mountItem();
    await wrapper.get('[role="checkbox"]').trigger("click");
    await wrapper.get('[aria-label^="Delete task"]').trigger("click");
    expect(wrapper.emitted("toggle")).toHaveLength(1);
    expect(wrapper.emitted("remove")).toHaveLength(1);
  });

  it("reflects completion for assistive tech", () => {
    const wrapper = mountItem({ completed: true });
    expect(wrapper.get('[role="checkbox"]').attributes("aria-checked")).toBe("true");
  });

  it("marks overdue deadlines", () => {
    expect(mountItem({ deadline: "2026-10-01" }).text()).toContain("Overdue");
    expect(mountItem({ deadline: "2026-10-10" }).text()).toContain("Today");
    expect(mountItem({ deadline: "2026-10-01", completed: true }).text()).not.toContain("Overdue");
  });

  it("renames on Enter after double-click", async () => {
    const wrapper = mountItem();
    await wrapper.get('p[title="Double-click to rename"]').trigger("dblclick");

    const input = wrapper.get('input[aria-label="Task title"]');
    await input.setValue("Write more tests");
    await input.trigger("keyup", { key: "Enter" });

    expect(wrapper.emitted("rename")).toEqual([["Write more tests"]]);
    expect(wrapper.find('input[aria-label="Task title"]').exists()).toBe(false);
  });

  it("cancels renaming on Escape without emitting", async () => {
    const wrapper = mountItem();
    await wrapper.get('[aria-label^="Rename task"]').trigger("click");

    const input = wrapper.get('input[aria-label="Task title"]');
    await input.setValue("Something else");
    await input.trigger("keyup", { key: "Escape" });

    expect(wrapper.emitted("rename")).toBeUndefined();
    expect(wrapper.text()).toContain("Write tests");
  });
});
