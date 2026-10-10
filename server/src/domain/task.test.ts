import { describe, expect, it } from "vitest";
import { Task } from "./task.js";

const valid = { id: "1", userId: "u1", title: "Write tests", position: "a1" };

describe("Task", () => {
  it("applies defaults", () => {
    expect(new Task(valid)).toMatchObject({
      description: "",
      dueDate: null,
      priority: "low",
      label: "work",
      completed: false,
    });
  });

  it.each([
    [{ title: "  " }, "title cannot be empty"],
    [{ dueDate: "not a date" }, "Invalid due date"],
    [{ priority: "urgent" }, "Invalid priority"],
    [{ label: "gym" }, "Invalid label"],
  ])("rejects %j", (overrides, message) => {
    expect(() => new Task({ ...valid, ...(overrides as object) })).toThrow(message);
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
