import { describe, expect, it } from "vitest";
import {
  applyReorder,
  countTasks,
  createDefaultQuery,
  isQueryActive,
  queryTasks,
  type TaskQuery,
} from "../query";
import type { Task } from "../types";

let nextId = 0;
const task = (overrides: Partial<Task>): Task => ({
  id: String(++nextId),
  text: "Task",
  description: "",
  completed: false,
  deadline: null,
  priority: "medium",
  labels: [],
  ...overrides,
});

const titles = (list: Task[]) => list.map((t) => t.text);
const query = (overrides: Partial<TaskQuery>) => ({ ...createDefaultQuery(), ...overrides });

describe("queryTasks", () => {
  const open = task({ text: "Open" });
  const done = task({ text: "Done", completed: true });

  it("returns everything in manual order by default", () => {
    expect(titles(queryTasks([open, done], createDefaultQuery()))).toEqual(["Open", "Done"]);
  });

  it("filters by status", () => {
    expect(titles(queryTasks([open, done], query({ status: "active" })))).toEqual(["Open"]);
    expect(titles(queryTasks([open, done], query({ status: "completed" })))).toEqual(["Done"]);
  });

  it("searches titles case-insensitively and ignores surrounding spaces", () => {
    const list = [task({ text: "Buy Milk" }), task({ text: "Write report" })];
    expect(titles(queryTasks(list, query({ search: "  milk " })))).toEqual(["Buy Milk"]);
  });

  it("matches any selected label by default and all when requested", () => {
    const list = [
      task({ text: "Work", labels: ["work"] }),
      task({ text: "Work + uni", labels: ["work", "university"] }),
      task({ text: "Shopping", labels: ["shopping"] }),
    ];
    const labels: TaskQuery["labels"] = ["work", "university"];

    expect(titles(queryTasks(list, query({ labels })))).toEqual(["Work", "Work + uni"]);
    expect(titles(queryTasks(list, query({ labels, matchAllLabels: true })))).toEqual([
      "Work + uni",
    ]);
  });

  it("sorts by deadline with undated tasks last, then by priority", () => {
    const list = [
      task({ text: "No date" }),
      task({ text: "Later", deadline: "2026-12-01" }),
      task({ text: "Sooner low", deadline: "2026-11-01", priority: "low" }),
      task({ text: "Sooner high", deadline: "2026-11-01", priority: "high" }),
    ];
    expect(titles(queryTasks(list, query({ sort: "deadline" })))).toEqual([
      "Sooner high",
      "Sooner low",
      "Later",
      "No date",
    ]);
  });

  it("sorts by priority, then deadline", () => {
    const list = [
      task({ text: "Low", priority: "low" }),
      task({ text: "High later", priority: "high", deadline: "2026-12-01" }),
      task({ text: "High sooner", priority: "high", deadline: "2026-11-01" }),
    ];
    expect(titles(queryTasks(list, query({ sort: "priority" })))).toEqual([
      "High sooner",
      "High later",
      "Low",
    ]);
  });

  it("combines filters and sorting", () => {
    const list = [
      task({ text: "Report draft", priority: "low", labels: ["work"] }),
      task({ text: "Report final", priority: "high", labels: ["work"] }),
      task({ text: "Report old", priority: "high", labels: ["work"], completed: true }),
      task({ text: "Groceries", priority: "high", labels: ["shopping"] }),
    ];
    const result = queryTasks(
      list,
      query({ status: "active", search: "report", labels: ["work"], sort: "priority" }),
    );
    expect(titles(result)).toEqual(["Report final", "Report draft"]);
  });

  it("does not mutate the input", () => {
    const list = [task({ priority: "low" }), task({ priority: "high" })];
    const copy = [...list];
    queryTasks(list, query({ sort: "priority" }));
    expect(list).toEqual(copy);
  });
});

describe("helpers", () => {
  it("counts tasks by status", () => {
    expect(countTasks([task({}), task({ completed: true }), task({})])).toEqual({
      all: 3,
      active: 2,
      completed: 1,
    });
  });

  it("detects whether any filter is applied", () => {
    expect(isQueryActive(createDefaultQuery())).toBe(false);
    expect(isQueryActive(query({ sort: "priority" }))).toBe(false);
    expect(isQueryActive(query({ search: "x" }))).toBe(true);
  });

  it("applies a reorder of visible tasks while keeping hidden ones in place", () => {
    const [a, b, c, d] = ["A", "B", "C", "D"].map((text) => task({ text })) as [
      Task,
      Task,
      Task,
      Task,
    ];
    // B and D are visible; the user drags D above B.
    expect(titles(applyReorder([a, b, c, d], [d, b]))).toEqual(["A", "D", "C", "B"]);
  });
});
