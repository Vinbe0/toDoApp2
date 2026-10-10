import { describe, expect, it } from "vitest";
import { toApiCreateTask, toApiUpdateTask, toUiTask } from "@/api/mappers";

describe("task mappers", () => {
  it("maps an API task to the UI shape with defaults", () => {
    expect(toUiTask({ id: "1", title: "Write CV" })).toEqual({
      id: "1",
      text: "Write CV",
      description: "",
      deadline: null,
      priority: "low",
      completed: false,
      labels: [],
    });
  });

  it("maps a UI draft to the API create payload", () => {
    expect(toApiCreateTask({ text: "Ship", deadline: "2026-10-12", priority: "high" })).toEqual({
      title: "Ship",
      description: "",
      dueDate: "2026-10-12",
      priority: "high",
    });
  });

  it("only includes changed fields in the update payload", () => {
    expect(toApiUpdateTask({ completed: true })).toEqual({ completed: true });
    expect(toApiUpdateTask({ text: "Renamed", deadline: null })).toEqual({
      title: "Renamed",
      dueDate: null,
    });
  });
});
