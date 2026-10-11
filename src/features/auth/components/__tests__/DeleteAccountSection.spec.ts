import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent } from "vue";
import { authApi } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { HttpError } from "@/shared/api";
import { notify } from "@/shared/lib/notify";
import DeleteAccountSection from "../DeleteAccountSection.vue";

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), deleteAccount: vi.fn() },
}));
vi.mock("@/shared/lib/notify", () => ({
  notify: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    fromError: vi.fn(),
    withAction: vi.fn(),
  },
}));

const Stub = defineComponent({ template: "<div />" });

async function setup() {
  localStorage.setItem("token", "t");
  localStorage.setItem("auth_user", JSON.stringify({ id: "u1", email: "me@example.com" }));
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: Stub },
      { path: "/account", name: "account", component: Stub },
    ],
  });
  await router.push("/account");
  const wrapper = mount(DeleteAccountSection, {
    props: { taskCount: 3, labelCount: 1 },
    global: { plugins: [pinia, router] },
  });
  const open = () =>
    wrapper
      .findAll("button")
      .find((b) => b.text() === "Delete account…")!
      .trigger("click");
  const submit = async (password: string) => {
    await wrapper.get('input[autocomplete="current-password"]').setValue(password);
    await wrapper.get("form").trigger("submit");
    await flushPromises();
  };
  return { wrapper, router, open, submit };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("DeleteAccountSection", () => {
  it("says what will be deleted and asks for confirmation first", async () => {
    const { wrapper, open } = await setup();
    expect(wrapper.text()).toContain("its 3 tasks and 1 label");
    expect(wrapper.find("form").exists()).toBe(false);

    await open();
    expect(wrapper.find("form").exists()).toBe(true);
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
  });

  it("requires the password", async () => {
    const { wrapper, open, submit } = await setup();
    await open();
    await submit("");
    expect(wrapper.text()).toContain("Enter your password to confirm");
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
  });

  it("shows a clear message for a wrong password and keeps the user signed in", async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(new HttpError("Incorrect password", 403));
    const { wrapper, open, submit } = await setup();
    await open();
    await submit("wrong-password");

    expect(wrapper.text()).toContain("Incorrect password");
    expect(useAuthStore().isRegistered).toBe(true);
  });

  it("deletes the account, signs out and goes home", async () => {
    vi.mocked(authApi.deleteAccount).mockResolvedValue(undefined);
    const { router, open, submit } = await setup();
    await open();
    await submit("password123");

    expect(authApi.deleteAccount).toHaveBeenCalledWith("password123");
    expect(useAuthStore().isGuest).toBe(true);
    expect(router.currentRoute.value.name).toBe("home");
    expect(notify.success).toHaveBeenCalledWith("Your account and its data have been deleted");
  });

  it("can be cancelled", async () => {
    const { wrapper, open } = await setup();
    await open();
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Cancel")!
      .trigger("click");
    expect(wrapper.find("form").exists()).toBe(false);
  });
});
