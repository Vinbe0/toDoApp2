import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import { createDefaultQuery, type TaskQuery } from "@/features/tasks/model/query";
import TaskSidebar from "../TaskSidebar.vue";

function mountSidebar(query: Partial<TaskQuery> = {}) {
  return mount(TaskSidebar, {
    props: {
      query: { ...createDefaultQuery(), ...query },
      labels: DEFAULT_LABELS,
      counts: { all: 3, active: 2, completed: 1 },
      labelCounts: { work: 2, shopping: 1, university: 0 },
      accountName: "Guest",
      accountHint: "Saved in this browser",
    },
  });
}

const lastQuery = (wrapper: ReturnType<typeof mountSidebar>) =>
  wrapper.emitted<[TaskQuery]>("update:query")?.at(-1)?.[0];

const button = (wrapper: ReturnType<typeof mountSidebar>, text: string) =>
  wrapper.findAll("button").find((b) => b.text().includes(text))!;

describe("TaskSidebar", () => {
  it("shows the account and counts per view and label", () => {
    const wrapper = mountSidebar();
    expect(wrapper.text()).toContain("Guest");
    expect(button(wrapper, "Active").text()).toContain("2");
    expect(button(wrapper, "Work").text()).toContain("2");
  });

  it("switches views and searches", async () => {
    const wrapper = mountSidebar();

    await button(wrapper, "Completed").trigger("click");
    expect(lastQuery(wrapper)?.status).toBe("completed");

    await wrapper.get('input[type="search"]').setValue("milk");
    expect(lastQuery(wrapper)?.search).toBe("milk");
  });

  it("toggles labels", async () => {
    const wrapper = mountSidebar({ labelIds: ["work"] });
    expect(button(wrapper, "Work").attributes("aria-pressed")).toBe("true");

    await button(wrapper, "Shopping").trigger("click");
    expect(lastQuery(wrapper)?.labelIds).toEqual(["work", "shopping"]);
  });

  it("offers match-all only when several labels are selected", () => {
    expect(mountSidebar({ labelIds: ["work"] }).text()).not.toContain("Must match all");
    expect(mountSidebar({ labelIds: ["work", "shopping"] }).text()).toContain("Must match all");
  });

  it("asks to add a task", async () => {
    const wrapper = mountSidebar();
    await button(wrapper, "Add task").trigger("click");
    expect(wrapper.emitted("addTask")).toHaveLength(1);
  });
});
