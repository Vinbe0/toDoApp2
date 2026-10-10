import { describe, expect, it } from "vitest";
import {
  DEFAULT_LABELS,
  LABEL_COLORS,
  nextLabelColor,
  normalizeLabelList,
  validateLabelName,
} from "../label";
import { normalizeTask } from "../task";

describe("validateLabelName", () => {
  it("accepts a new name", () => {
    expect(validateLabelName("Gym", DEFAULT_LABELS)).toBeNull();
  });

  it.each([
    ["   ", "Enter a name"],
    ["x".repeat(31), "Use at most 30 characters"],
    ["#gym", 'Leave out the "#"'],
    [" work ", '"Work" already exists'],
  ])("rejects %j", (name, message) => {
    expect(validateLabelName(name, DEFAULT_LABELS)).toBe(message);
  });

  it("lets a label keep its own name when renaming", () => {
    expect(validateLabelName("WORK", DEFAULT_LABELS, "work")).toBeNull();
  });
});

describe("nextLabelColor", () => {
  it("picks the first colour that isn't used", () => {
    expect(nextLabelColor([])).toBe(LABEL_COLORS[0]);
    expect(nextLabelColor([{ id: "a", name: "A", color: "red" }])).toBe("orange");
  });
});

describe("normalizeLabelList", () => {
  it("keeps valid labels and drops malformed ones", () => {
    expect(
      normalizeLabelList([
        { id: "1", name: "Gym", color: "red" },
        { id: "2", name: "Bad colour", color: "gold" },
        "nope",
      ]),
    ).toEqual([{ id: "1", name: "Gym", color: "red" }]);
    expect(normalizeLabelList({})).toBeNull();
  });
});

describe("normalizeTask (stored guest tasks)", () => {
  it("reads label ids", () => {
    expect(normalizeTask({ text: "x", labelIds: ["a", 1, "b"] })?.labelIds).toEqual(["a", "b"]);
  });

  it("carries over tags saved by older versions as default label ids", () => {
    const task = normalizeTask({ text: "x", labels: ["work", "shopping"] });
    expect(task?.labelIds).toEqual(["work", "shopping"]);
    expect(DEFAULT_LABELS.map((label) => label.id)).toEqual(expect.arrayContaining(task!.labelIds));
  });
});
