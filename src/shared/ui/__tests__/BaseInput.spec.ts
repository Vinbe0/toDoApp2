import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BaseInput from "../BaseInput.vue";

describe("BaseInput", () => {
  it("links the label to the input", () => {
    const wrapper = mount(BaseInput, { props: { label: "Email" } });
    const id = wrapper.get("input").attributes("id");
    expect(wrapper.get("label").attributes("for")).toBe(id);
  });

  it("supports v-model", async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: "" } });
    await wrapper.get("input").setValue("hello");
    expect(wrapper.emitted("update:modelValue")).toEqual([["hello"]]);
  });

  it("puts layout classes on the wrapper and other attributes on the input", () => {
    const wrapper = mount(BaseInput, { attrs: { class: "flex-1", placeholder: "Search" } });
    expect(wrapper.classes()).toContain("flex-1");
    expect(wrapper.get("input").attributes("placeholder")).toBe("Search");
  });

  it("announces errors", () => {
    const wrapper = mount(BaseInput, { props: { error: "Required" } });
    const input = wrapper.get("input");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get(`#${input.attributes("aria-describedby")}`).text()).toBe("Required");
  });

  it("renders a textarea in multiline mode", () => {
    expect(
      mount(BaseInput, { props: { multiline: true } })
        .find("textarea")
        .exists(),
    ).toBe(true);
  });
});
