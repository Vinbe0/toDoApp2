import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { LABELS } from "@/features/tasks/model/task";
import { createDefaultQuery, type TaskQuery } from "@/features/tasks/model/query";
import TaskFilters from "../TaskFilters.vue";

function mountFilters(query: Partial<TaskQuery> = {}) {
  return mount(TaskFilters, {
    props: {
      query: { ...createDefaultQuery(), ...query },
      labels: LABELS,
      counts: { all: 3, active: 2, completed: 1 },
    },
  });
}

const lastQuery = (wrapper: ReturnType<typeof mountFilters>) =>
  wrapper.emitted<[TaskQuery]>("update:query")?.at(-1)?.[0];

const button = (wrapper: ReturnType<typeof mountFilters>, text: string) =>
  wrapper.findAll("button").find((b) => b.text().startsWith(text))!;

describe("TaskFilters", () => {
  it("shows counts per status", () => {
    expect(button(mountFilters(), "Active").text()).toContain("2");
  });

  it("updates the status, sort and search", async () => {
    const wrapper = mountFilters();

    await button(wrapper, "Completed").trigger("click");
    expect(lastQuery(wrapper)?.status).toBe("completed");

    await button(wrapper, "Priority").trigger("click");
    expect(lastQuery(wrapper)?.sort).toBe("priority");

    await wrapper.get('input[type="search"]').setValue("milk");
    expect(lastQuery(wrapper)?.search).toBe("milk");
  });

  it("adds and removes labels", async () => {
    const wrapper = mountFilters({ labels: ["work"] });
    await button(wrapper, "Shopping").trigger("click");
    expect(lastQuery(wrapper)?.labels).toEqual(["work", "shopping"]);

    await button(wrapper, "Work").trigger("click");
    expect(lastQuery(wrapper)?.labels).toEqual(["shopping"]);
  });

  it("offers match-all only when several labels are selected", () => {
    expect(mountFilters({ labels: ["work"] }).text()).not.toContain("Must match all");
    expect(mountFilters({ labels: ["work", "shopping"] }).text()).toContain("Must match all");
  });

  it("shows Reset only when a filter is active", async () => {
    expect(mountFilters().text()).not.toContain("Reset filters");

    const wrapper = mountFilters({ search: "x" });
    await button(wrapper, "Reset filters").trigger("click");
    expect(wrapper.emitted("reset")).toHaveLength(1);
  });
});
