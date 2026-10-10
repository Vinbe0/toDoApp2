import { describe, expect, it } from "vitest";
import { safeRedirect } from "../safeRedirect";

describe("safeRedirect", () => {
  it("accepts in-app paths", () => {
    expect(safeRedirect("/account")).toBe("/account");
  });

  it.each([undefined, "", "https://evil.example", "//evil.example", ["/a"]])(
    "falls back for %j",
    (value) => {
      expect(safeRedirect(value)).toBe("/todo");
    },
  );
});
