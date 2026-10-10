import { describe, expect, it } from "vitest";
import { mount, RouterLinkStub } from "@vue/test-utils";
import BaseButton from "../BaseButton.vue";

describe("BaseButton", () => {
  it("renders a button with the given type", () => {
    const wrapper = mount(BaseButton, { props: { type: "submit" }, slots: { default: "Save" } });
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.attributes("type")).toBe("submit");
    expect(wrapper.text()).toBe("Save");
  });

  it("is disabled and shows a spinner while loading", () => {
    const wrapper = mount(BaseButton, { props: { loading: true } });
    expect(wrapper.attributes("disabled")).toBeDefined();
    expect(wrapper.find(".pi-spinner").exists()).toBe(true);
  });

  it("renders a router link when given a destination", () => {
    const wrapper = mount(BaseButton, {
      props: { to: "/todo" },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });
    expect(wrapper.findComponent(RouterLinkStub).props("to")).toBe("/todo");
  });
});
