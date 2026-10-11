import { describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import type { Task } from "@/features/tasks/model/types";
import type { NewTask } from "@/features/tasks/repositories";
import UpcomingView from "../UpcomingView.vue";

// Sunday 11 October 2026, mid-afternoon.
const now = new Date(2026, 9, 11, 15, 0);

let id = 0;
const task = (text: string, deadline: string | null, completed = false): Task => ({
  id: String(++id),
  text,
  description: "",
  deadline,
  priority: "medium",
  labelIds: [],
  completed,
});

const tasks = [
  task("Late", "2026-10-09"),
  task("Today", "2026-10-11"),
  task("Done today", "2026-10-11", true),
  task("Tomorrow", "2026-10-12"),
  task("Next week", "2026-10-20"),
  task("Someday", null),
];

function mountView(save = vi.fn<(t: NewTask) => Promise<boolean>>(async () => true)) {
  const wrapper = mount(UpcomingView, {
    props: { tasks, labels: DEFAULT_LABELS, resolveLabels: () => [], save, now },
    attachTo: document.body,
  });
  const headings = () => wrapper.findAll("section h2").map((h) => h.text().replace(/\s+/g, " "));
  const titlesIn = (label: string) =>
    wrapper
      .findAll("section[aria-label]")
      .find((s) => s.attributes("aria-label")!.startsWith(label))!
      .findAll("p[title]")
      .map((p) => p.text());
  return { wrapper, save, headings, titlesIn };
}

describe("UpcomingView", () => {
  it("shows overdue tasks, then seven days starting today", () => {
    const { wrapper, headings, titlesIn } = mountView();

    expect(headings()).toEqual([
      "Overdue 1",
      "Today · Sunday 11 Oct 1",
      "Tomorrow · Monday 12 Oct 1",
      "Tuesday 13 Oct",
      "Wednesday 14 Oct",
      "Thursday 15 Oct",
      "Friday 16 Oct",
      "Saturday 17 Oct",
    ]);
    expect(titlesIn("Today")).toEqual(["Today"]); // the completed one is hidden
    expect(wrapper.text()).not.toContain("Someday");
    expect(wrapper.text()).toContain("October 2026");
    wrapper.unmount();
  });

  it("marks today and shows task counts in the week strip", () => {
    const { wrapper } = mountView();
    const days = wrapper.findAll("ol button");
    expect(days).toHaveLength(7);
    expect(days[0]!.attributes("aria-current")).toBe("date");
    expect(days[0]!.attributes("aria-label")).toBe("Sunday 11 October, 1 task");
    expect(days[2]!.attributes("aria-label")).toBe("Tuesday 13 October, 0 tasks");
    wrapper.unmount();
  });

  it("pages forward and back a week at a time", async () => {
    const { wrapper, headings } = mountView();
    const button = (label: string) => wrapper.get(`[aria-label="${label}"]`);
    expect(button("Previous week").attributes("disabled")).toBeDefined();

    await button("Next week").trigger("click");
    expect(headings()[0]).toBe("Sunday 18 Oct");
    expect(headings()).toContain("Tuesday 20 Oct 1");
    expect(headings()).not.toContain("Overdue 1");

    const today = wrapper.findAll("button").find((b) => b.text() === "Today")!;
    await today.trigger("click");
    expect(headings()[1]).toBe("Today · Sunday 11 Oct 1");
    wrapper.unmount();
  });

  it("adds a task under a day with that day's date", async () => {
    const { wrapper, save } = mountView();
    const tuesday = wrapper
      .findAll("section[aria-label]")
      .find((s) => s.attributes("aria-label")!.startsWith("Tuesday"))!;

    await tuesday
      .findAll("button")
      .find((b) => b.text() === "Add task")!
      .trigger("click");
    await tuesday.get('input[aria-label="Task title"]').setValue("Call Mum");
    await tuesday.get("form").trigger("submit");
    await flushPromises();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Call Mum", deadline: "2026-10-13" }),
    );
    wrapper.unmount();
  });

  it("passes task actions up", async () => {
    const { wrapper } = mountView();
    await wrapper.get('[aria-label="Mark Tomorrow as done"]').trigger("click");
    expect(wrapper.emitted("toggle")).toEqual([[tasks[3]!.id]]);
    wrapper.unmount();
  });

  describe("dragging a task to another day", () => {
    // jsdom has no DataTransfer, so drag events carry a minimal stand-in.
    const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: "", dropEffect: "" });
    const item = (wrapper: ReturnType<typeof mountView>["wrapper"], title: string) =>
      wrapper.findAll("li[draggable]").find((li) => li.get("p[title]").text() === title)!;
    const section = (wrapper: ReturnType<typeof mountView>["wrapper"], label: string) =>
      wrapper
        .findAll("section[aria-label]")
        .find((s) => s.attributes("aria-label")!.startsWith(label))!;

    it("reschedules when dropped on a day section", async () => {
      const { wrapper } = mountView();
      const thursday = section(wrapper, "Thursday");

      await item(wrapper, "Tomorrow").trigger("dragstart", { dataTransfer: dataTransfer() });
      await thursday.trigger("dragover", { dataTransfer: dataTransfer() });
      expect(thursday.classes()).toContain("ring-1");
      await thursday.trigger("drop");

      expect(wrapper.emitted("reschedule")).toEqual([[tasks[3]!.id, "2026-10-15"]]);
      expect(thursday.classes()).not.toContain("ring-1");
      wrapper.unmount();
    });

    it("moves an overdue task onto a day in the week strip", async () => {
      const { wrapper } = mountView();
      await item(wrapper, "Late").trigger("dragstart", { dataTransfer: dataTransfer() });
      const friday = wrapper.get('button[aria-label^="Friday 16 October"]');
      await friday.trigger("dragover");
      await friday.trigger("drop");

      expect(wrapper.emitted("reschedule")).toEqual([[tasks[0]!.id, "2026-10-16"]]);
      wrapper.unmount();
    });

    it("ignores drops on the same day and drags that didn't start here", async () => {
      const { wrapper } = mountView();
      await section(wrapper, "Today").trigger("drop");

      await item(wrapper, "Today").trigger("dragstart", { dataTransfer: dataTransfer() });
      await section(wrapper, "Today").trigger("drop");

      expect(wrapper.emitted("reschedule")).toBeUndefined();
      wrapper.unmount();
    });
  });
});
