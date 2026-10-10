import { describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { LABELS } from "@/features/tasks/model/task";
import type { NewTask } from "@/features/tasks/repositories";
import TaskComposer from "../TaskComposer.vue";

function mountComposer(result = true) {
  const save = vi.fn<(task: NewTask) => Promise<boolean>>(async () => result);
  const wrapper = mount(TaskComposer, { props: { labels: LABELS, save } });
  const title = () => wrapper.get<HTMLInputElement>('input[aria-label="Task title"]');
  return { wrapper, save, title };
}

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll("button").find((button) => button.text() === text)!;

describe("TaskComposer", () => {
  it("disables submit until a title is entered", async () => {
    const { wrapper, title } = mountComposer();
    const submit = wrapper.get('button[type="submit"]');
    expect(submit.attributes("disabled")).toBeDefined();

    await title().setValue("Ship it");
    expect(submit.attributes("disabled")).toBeUndefined();
  });

  it("submits the full draft and resets the form", async () => {
    const { wrapper, save, title } = mountComposer();

    await title().setValue("Ship it");
    await buttonByText(wrapper, "High").trigger("click");
    await buttonByText(wrapper, "Work").trigger("click");
    await wrapper.get('input[type="date"]').setValue("2026-11-01");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(save).toHaveBeenCalledWith({
      text: "Ship it",
      description: "",
      deadline: "2026-11-01",
      priority: "high",
      labels: ["work"],
    });
    expect(title().element.value).toBe("");
  });

  it("keeps the draft when saving fails", async () => {
    const { wrapper, title } = mountComposer(false);
    await title().setValue("Ship it");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(title().element.value).toBe("Ship it");
  });

  it("toggles labels on and off", async () => {
    const { wrapper, title } = mountComposer();
    await title().setValue("x");
    const work = () => buttonByText(wrapper, "Work");

    await work().trigger("click");
    expect(work().attributes("aria-pressed")).toBe("true");
    await work().trigger("click");
    expect(work().attributes("aria-pressed")).toBe("false");
  });
});
