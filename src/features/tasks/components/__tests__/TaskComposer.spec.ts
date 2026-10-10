import { describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import type { NewTask } from "@/features/tasks/repositories";
import TaskComposer from "../TaskComposer.vue";

async function mountOpenComposer(result = true) {
  const save = vi.fn<(task: NewTask) => Promise<boolean>>(async () => result);
  const wrapper = mount(TaskComposer, {
    props: { labels: DEFAULT_LABELS, save },
    attachTo: document.body,
  });
  await wrapper.get("button").trigger("click"); // "+ Add task"
  const title = () => wrapper.get<HTMLInputElement>('input[aria-label="Task title"]');
  return { wrapper, save, title };
}

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll("button").find((button) => button.text().includes(text))!;

describe("TaskComposer", () => {
  it("starts as a single Add task row and opens with the title focused", async () => {
    const save = vi.fn();
    const wrapper = mount(TaskComposer, {
      props: { labels: DEFAULT_LABELS, save },
      attachTo: document.body,
    });
    expect(wrapper.find("form").exists()).toBe(false);

    await wrapper.get("button").trigger("click");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Task title");
    wrapper.unmount();
  });

  it("disables Add task until a title is entered", async () => {
    const { wrapper, title } = await mountOpenComposer();
    const submit = wrapper.get('button[type="submit"]');
    expect(submit.attributes("disabled")).toBeDefined();

    await title().setValue("Ship it");
    expect(submit.attributes("disabled")).toBeUndefined();
    wrapper.unmount();
  });

  it("submits the full draft, then stays open with an empty form", async () => {
    const { wrapper, save, title } = await mountOpenComposer();

    await title().setValue("Ship it");
    await wrapper.get('input[aria-label="Description"]').setValue("Before Friday");
    await wrapper.get('select[aria-label="Priority"]').setValue("high");
    await buttonByText(wrapper, "Work").trigger("click");
    await wrapper.get('input[aria-label="Deadline"]').setValue("2026-11-01");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(save).toHaveBeenCalledWith({
      text: "Ship it",
      description: "Before Friday",
      deadline: "2026-11-01",
      priority: "high",
      labelIds: ["work"],
    });
    expect(wrapper.find("form").exists()).toBe(true);
    expect(title().element.value).toBe("");
    wrapper.unmount();
  });

  it("keeps the draft when saving fails", async () => {
    const { wrapper, title } = await mountOpenComposer(false);
    await title().setValue("Ship it");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(title().element.value).toBe("Ship it");
    wrapper.unmount();
  });

  it("closes and discards the draft on Cancel or Escape", async () => {
    const { wrapper, title } = await mountOpenComposer();
    await title().setValue("Never mind");

    await wrapper.get("form").trigger("keydown", { key: "Escape" });
    expect(wrapper.find("form").exists()).toBe(false);

    await wrapper.get("button").trigger("click");
    expect(title().element.value).toBe("");
    await buttonByText(wrapper, "Cancel").trigger("click");
    expect(wrapper.find("form").exists()).toBe(false);
    wrapper.unmount();
  });

  it("toggles labels on and off", async () => {
    const { wrapper } = await mountOpenComposer();
    const work = () => buttonByText(wrapper, "Work");

    await work().trigger("click");
    expect(work().attributes("aria-pressed")).toBe("true");
    await work().trigger("click");
    expect(work().attributes("aria-pressed")).toBe("false");
    wrapper.unmount();
  });
});
