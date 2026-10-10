import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent } from "vue";
import { authApi } from "@/features/auth/api/authApi";
import { HttpError } from "@/shared/api";
import CredentialsForm from "../CredentialsForm.vue";

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));
vi.mock("@/shared/lib/notify", () => ({
  notify: { info: vi.fn(), success: vi.fn(), error: vi.fn(), withAction: vi.fn() },
}));

const Stub = defineComponent({ template: "<div />" });

async function mountForm(mode: "login" | "register", startAt = "/login") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/login", name: "login", component: Stub },
      { path: "/register", name: "register", component: Stub },
      { path: "/todo", name: "tasks", component: Stub },
      { path: "/account", name: "account", component: Stub },
    ],
  });
  await router.push(startAt);
  const pinia = createPinia();
  setActivePinia(pinia);

  const wrapper = mount(CredentialsForm, {
    props: { mode },
    global: { plugins: [router, pinia] },
  });

  const fill = async (email: string, password: string) => {
    await wrapper.get('input[type="email"]').setValue(email);
    await wrapper.get('input[autocomplete$="password"]').setValue(password);
  };
  const submit = async () => {
    await wrapper.get("form").trigger("submit");
    await flushPromises();
  };

  return { wrapper, router, fill, submit };
}

const session = { token: "t", user: { id: "1", email: "me@example.com" } };

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("CredentialsForm", () => {
  it("shows field errors and does not call the API for invalid input", async () => {
    const { wrapper, fill, submit } = await mountForm("register");
    await fill("not-an-email", "123");
    await submit();

    expect(wrapper.text()).toContain("Enter a valid email address");
    expect(wrapper.text()).toContain("Use at least 6 characters");
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("logs in and returns to the page the user came from", async () => {
    vi.mocked(authApi.login).mockResolvedValue(session);
    const { router, fill, submit } = await mountForm("login", "/login?redirect=/account");

    await fill(" me@example.com ", "secret");
    await submit();

    expect(authApi.login).toHaveBeenCalledWith("me@example.com", "secret");
    expect(router.currentRoute.value.fullPath).toBe("/account");
  });

  it("goes to the task list when there is no redirect", async () => {
    vi.mocked(authApi.register).mockResolvedValue(session);
    const { router, fill, submit } = await mountForm("register");

    await fill("me@example.com", "secret");
    await submit();
    expect(router.currentRoute.value.name).toBe("tasks");
  });

  it("explains wrong credentials", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new HttpError("Unauthorized", 401));
    const { wrapper, fill, submit } = await mountForm("login");

    await fill("me@example.com", "wrong");
    await submit();
    expect(wrapper.get('[role="alert"]').text()).toBe("Incorrect email or password");
  });

  it("explains an email that is already registered", async () => {
    vi.mocked(authApi.register).mockRejectedValue(new HttpError("Conflict", 409));
    const { wrapper, fill, submit } = await mountForm("register");

    await fill("me@example.com", "secret");
    await submit();
    expect(wrapper.get('[role="alert"]').text()).toBe("An account with this email already exists");
  });
});
