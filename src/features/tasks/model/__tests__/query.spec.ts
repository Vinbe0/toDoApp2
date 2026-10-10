import { describe, expect, it } from "vitest";
import {
  applyReorder,
  countOpenByLabel,
  countTasks,
  createDefaultQuery,
  groupByDue,
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

  it("counts open tasks per label", () => {
    const list = [
      task({ labels: ["work"] }),
      task({ labels: ["work", "shopping"] }),
      task({ labels: ["work"], completed: true }),
    ];
    expect(countOpenByLabel(list, ["work", "shopping", "university"])).toEqual({
      work: 2,
      shopping: 1,
      university: 0,
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

describe("groupByDue", () => {
  // Saturday 10 October 2026
  const now = new Date(2026, 9, 10, 15, 0);

  it("puts tasks into date sections in a fixed order and skips empty ones", () => {
    const list = [
      task({ text: "Later", deadline: "2026-11-01" }),
      task({ text: "No date" }),
      task({ text: "Late", deadline: "2026-10-08" }),
      task({ text: "Done late", deadline: "2026-10-08", completed: true }),
      task({ text: "Today", deadline: "2026-10-10" }),
      task({ text: "Tomorrow", deadline: "2026-10-11" }),
      task({ text: "Thursday", deadline: "2026-10-15" }),
    ];

    expect(groupByDue(list, now).map((g) => [g.title, titles(g.tasks)])).toEqual([
      ["Overdue", ["Late"]],
      ["Earlier", ["Done late"]],
      ["Today", ["Today"]],
      ["Tomorrow", ["Tomorrow"]],
      ["Next 7 days", ["Thursday"]],
      ["Later", ["Later"]],
      ["No date", ["No date"]],
    ]);
  });

  it("keeps the incoming order within a section", () => {
    const list = [
      task({ text: "B", deadline: "2026-10-10" }),
      task({ text: "A", deadline: "2026-10-10" }),
    ];
    expect(titles(groupByDue(list, now)[0]!.tasks)).toEqual(["B", "A"]);
  });

  it("returns no sections for no tasks", () => {
    expect(groupByDue([], now)).toEqual([]);
  });
});
