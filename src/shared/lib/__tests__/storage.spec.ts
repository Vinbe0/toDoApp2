import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonItem, stringItem } from "../storage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("stringItem", () => {
  it("round-trips a string", () => {
    const item = stringItem("token");
    item.set("abc");
    expect(item.get()).toBe("abc");
    expect(localStorage.getItem("token")).toBe("abc");
    item.remove();
    expect(item.get()).toBeNull();
  });

  it("rejects values outside the allowed list", () => {
    localStorage.setItem("theme", "purple");
    expect(stringItem("theme", ["light", "dark"] as const).get()).toBeNull();
  });
});

describe("jsonItem", () => {
  const isNumberList = (data: unknown) =>
    Array.isArray(data) && data.every((n) => typeof n === "number") ? (data as number[]) : null;

  it("serializes and validates JSON", () => {
    const item = jsonItem("numbers", isNumberList);
    item.set([1, 2]);
    expect(item.get()).toEqual([1, 2]);
  });

  it("returns null for corrupted JSON instead of throwing", () => {
    localStorage.setItem("numbers", "{not json");
    expect(jsonItem("numbers", isNumberList).get()).toBeNull();
  });

  it("returns null when validation fails", () => {
    localStorage.setItem("numbers", '["a"]');
    expect(jsonItem("numbers", isNumberList).get()).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => jsonItem("numbers", isNumberList).set([1])).not.toThrow();
  });
});
