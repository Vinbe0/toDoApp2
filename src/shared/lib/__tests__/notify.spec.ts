import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/shared/api";
import { notify } from "../notify";

const toast = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), success: vi.fn() }));
vi.mock("vue-toastification", () => ({ useToast: () => toast }));

describe("notify.fromError", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the error's message", () => {
    notify.fromError(new HttpError("Name taken", 409), "Could not save");
    expect(toast.error).toHaveBeenCalledWith("Name taken");
  });

  it("explains an expired session", () => {
    notify.fromError(new HttpError("Unauthorized", 401), "Could not save");
    expect(toast.error).toHaveBeenCalledWith("Your session has expired. Please log in again.");
  });

  it("falls back when there is no message", () => {
    notify.fromError("???", "Could not save");
    expect(toast.error).toHaveBeenCalledWith("Could not save");
  });
});
