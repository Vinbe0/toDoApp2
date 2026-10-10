import { describe, expect, it } from "vitest";
import { Label } from "./label.js";

const valid = { id: "1", userId: "u1", name: "Side project", color: "teal" as const };

describe("Label", () => {
  it("normalizes whitespace in the name", () => {
    expect(new Label({ ...valid, name: "  Side   project " }).name).toBe("Side project");
  });

  it("compares names case-insensitively", () => {
    expect(Label.nameKey(" WORK ")).toBe(Label.nameKey("work"));
  });

  it.each([
    [{ name: "   " }, "cannot be empty"],
    [{ name: "x".repeat(31) }, "at most 30 characters"],
    [{ name: "#work" }, 'should not start with "#"'],
    [{ color: "gold" }, "Invalid label colour"],
  ])("rejects %j", (overrides, message) => {
    expect(() => new Label({ ...valid, ...(overrides as object) })).toThrow(message);
  });

  it("knows its owner", () => {
    expect(new Label(valid).isOwnedBy("u1")).toBe(true);
    expect(new Label(valid).isOwnedBy("u2")).toBe(false);
  });
});
