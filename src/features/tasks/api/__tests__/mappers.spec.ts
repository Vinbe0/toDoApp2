import { describe, expect, it } from "vitest";
import { toApiCreateTask, toApiUpdateTask, toUiTask } from "@/features/tasks/api/mappers";

describe("task mappers", () => {
  it("maps an API task to the UI shape with defaults", () => {
    expect(toUiTask({ id: "1", title: "Write CV" })).toEqual({
      id: "1",
      text: "Write CV",
      description: "",
      deadline: null,
      priority: "low",
      completed: false,
      labelIds: [],
    });
  });

  it("maps a UI draft to the API create payload", () => {
    expect(toApiCreateTask({ text: "Ship", deadline: "2026-10-12", priority: "high" })).toEqual({
      title: "Ship",
      description: "",
      dueDate: "2026-10-12",
      priority: "high",
      labelIds: [],
    });
  });

  it("keeps the completed state when creating (guest import)", () => {
    expect(toApiCreateTask({ text: "Done", completed: true }).completed).toBe(true);
    expect(toApiCreateTask({ text: "New" })).not.toHaveProperty("completed");
  });

  it("maps label ids in both directions", () => {
    expect(toUiTask({ id: "1", title: "x", labelIds: ["work", "shopping"] }).labelIds).toEqual([
      "work",
      "shopping",
    ]);
    expect(toApiCreateTask({ text: "x", labelIds: ["university"] }).labelIds).toEqual([
      "university",
    ]);
    expect(toApiUpdateTask({ labelIds: [] })).toEqual({ labelIds: [] });
  });

  it("only includes changed fields in the update payload", () => {
    expect(toApiUpdateTask({ completed: true })).toEqual({ completed: true });
    expect(toApiUpdateTask({ text: "Renamed", deadline: null })).toEqual({
      title: "Renamed",
      dueDate: null,
    });
  });
});
