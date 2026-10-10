import { describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import LabelNameInput from "../LabelNameInput.vue";

function mountInput(result = true, initial?: string) {
  const save = vi.fn(async () => result);
  const wrapper = mount(LabelNameInput, {
    props: { color: "red", save, initial },
    attachTo: document.body,
  });
  return { wrapper, save, input: wrapper.get("input") };
}

describe("LabelNameInput", () => {
  it("is focused with the current name selected", () => {
    const { wrapper } = mountInput(true, "Work");
    expect(document.activeElement).toBe(wrapper.get("input").element);
    wrapper.unmount();
  });

  it("saves once on Enter, even though closing blurs the field", async () => {
    const { wrapper, save, input } = mountInput();
    await input.setValue("Gym");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    await input.trigger("blur");
    await flushPromises();

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("Gym");
    expect(wrapper.emitted("done")).toHaveLength(1);
    wrapper.unmount();
  });

  it("stays open when saving fails", async () => {
    const { wrapper, input } = mountInput(false);
    await input.setValue("Work");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(wrapper.emitted("done")).toBeUndefined();
    wrapper.unmount();
  });

  it("closes without saving on Escape or when left empty", async () => {
    const { wrapper, save, input } = mountInput();
    await input.trigger("keydown", { key: "Escape" });
    await input.trigger("blur");
    expect(save).not.toHaveBeenCalled();
    expect(wrapper.emitted("done")).toHaveLength(1);
    wrapper.unmount();
  });
});
