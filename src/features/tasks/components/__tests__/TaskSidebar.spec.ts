import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mount } from "@vue/test-utils";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import { createDefaultQuery, type TaskQuery } from "@/features/tasks/model/query";
import TaskSidebar from "../TaskSidebar.vue";

function mountSidebar(query: Partial<TaskQuery> = {}, labelActions?: Record<string, unknown>) {
  return mount(TaskSidebar, {
    attachTo: document.body,
    props: {
      query: { ...createDefaultQuery(), ...query },
      labels: DEFAULT_LABELS,
      counts: { all: 3, active: 2, completed: 1 },
      labelCounts: { work: 2, shopping: 1, university: 0 },
      accountName: "Guest",
      accountHint: "Saved in this browser",
      labelActions: labelActions as never,
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

  it("switches between list views and Upcoming", async () => {
    const list = mountSidebar();
    await button(list, "Upcoming").trigger("click");
    expect(list.emitted("showUpcoming")).toHaveLength(1);
    await button(list, "Active").trigger("click");
    expect(list.emitted("showList")).toHaveLength(1);
    list.unmount();

    // While Upcoming is shown, no status view looks selected.
    const upcoming = mount(TaskSidebar, {
      props: {
        query: createDefaultQuery(),
        labels: DEFAULT_LABELS,
        counts: { all: 3, active: 2, completed: 1 },
        labelCounts: {},
        accountName: "Guest",
        accountHint: "",
        upcomingActive: true,
        upcomingCount: 4,
      },
    });
    expect(button(upcoming, "All tasks").attributes("aria-pressed")).toBe("false");
    expect(button(upcoming, "Upcoming").attributes("aria-pressed")).toBe("true");
    expect(button(upcoming, "Upcoming").text()).toContain("4");
  });

  it("asks to add a task", async () => {
    const wrapper = mountSidebar();
    await button(wrapper, "Add task").trigger("click");
    expect(wrapper.emitted("addTask")).toHaveLength(1);
  });
});

describe("TaskSidebar label management", () => {
  const actions = () => ({
    create: vi.fn(async () => true),
    rename: vi.fn(async () => true),
    recolor: vi.fn(async () => true),
    remove: vi.fn(async () => {}),
  });

  it("is read-only without label actions", () => {
    const wrapper = mountSidebar();
    expect(wrapper.find('[aria-label="Add label"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label^="Options for label"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("creates a label from the + button", async () => {
    const labelActions = actions();
    const wrapper = mountSidebar({}, labelActions);

    await wrapper.get('[aria-label="Add label"]').trigger("click");
    await wrapper.get('input[aria-label="Label name"]').setValue("Gym");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(labelActions.create).toHaveBeenCalledWith("Gym");
    expect(wrapper.find('input[aria-label="Label name"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("renames, recolours and deletes from the label menu", async () => {
    const labelActions = actions();
    const wrapper = mountSidebar({}, labelActions);
    const openMenu = () => wrapper.get('[aria-label="Options for label Work"]').trigger("click");

    await openMenu();
    await wrapper.get('[aria-label="Colour teal"]').trigger("click");
    expect(labelActions.recolor).toHaveBeenCalledWith("work", "teal");

    await button(wrapper, "Rename").trigger("click");
    const input = wrapper.get('input[aria-label="Label name"]');
    expect((input.element as HTMLInputElement).value).toBe("Work");
    await input.setValue("Job");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(labelActions.rename).toHaveBeenCalledWith("work", "Job");

    await openMenu();
    await button(wrapper, "Delete").trigger("click");
    expect(wrapper.text()).toContain("It will be removed from 2 open tasks.");
    expect(labelActions.remove).not.toHaveBeenCalled();
    await button(wrapper, "Delete label").trigger("click");
    expect(labelActions.remove).toHaveBeenCalledWith("work");
    wrapper.unmount();
  });

  it("closes the label menu on Escape", async () => {
    const wrapper = mountSidebar({}, actions());
    await wrapper.get('[aria-label="Options for label Work"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
