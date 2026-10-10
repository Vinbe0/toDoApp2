import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ViewMenu from "../ViewMenu.vue";

const mountMenu = (canReset = false) =>
  mount(ViewMenu, { props: { sort: "manual", canReset }, attachTo: document.body });

describe("ViewMenu", () => {
  it("opens, changes the sort order and closes on Escape", async () => {
    const wrapper = mountMenu();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.get("button").trigger("click");
    const priority = wrapper.findAll("button").find((b) => b.text() === "Priority")!;
    await priority.trigger("click");
    expect(wrapper.emitted("update:sort")).toEqual([["priority"]]);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("offers Reset only when filters are active, and closes after an action", async () => {
    const wrapper = mountMenu(true);
    await wrapper.get("button").trigger("click");

    const reset = wrapper.findAll("button").find((b) => b.text().includes("Reset filters"))!;
    await reset.trigger("click");
    expect(wrapper.emitted("reset")).toHaveLength(1);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
