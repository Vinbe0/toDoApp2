import { describe, expect, it } from "vitest";
import { Task } from "./task.js";

const valid = { id: "1", userId: "u1", title: "Write tests", position: 0 };

describe("Task", () => {
  it("applies defaults", () => {
    expect(new Task(valid)).toMatchObject({
      description: "",
      dueDate: null,
      priority: "low",
      labels: [],
      completed: false,
    });
  });

  it.each([
    [{ title: "  " }, "title cannot be empty"],
    [{ dueDate: "not a date" }, "Invalid due date"],
    [{ priority: "urgent" }, "Invalid priority"],
    [{ labels: ["work", "gym"] }, "Invalid label"],
    [{ position: -1 }, "Position must be a non-negative integer"],
  ])("rejects %j", (overrides, message) => {
    expect(() => new Task({ ...valid, ...(overrides as object) })).toThrow(message);
  });

  it("removes duplicate labels", () => {
    expect(new Task({ ...valid, labels: ["work", "shopping", "work"] }).labels).toEqual([
      "work",
      "shopping",
    ]);
  });

  it("knows its owner", () => {
    const task = new Task(valid);
    expect(task.isOwnedBy("u1")).toBe(true);
    expect(task.isOwnedBy("u2")).toBe(false);
  });

  it("toggles completion", () => {
    const task = new Task(valid);
    task.toggleCompletion();
    expect(task.completed).toBe(true);
  });
});
