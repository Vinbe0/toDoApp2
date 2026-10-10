import { describe, expect, it } from "vitest";
import type { Task } from "@/features/tasks/model/types";
import { describeDue } from "../taskDisplay";

// Saturday 10 October 2026, mid-day.
const now = new Date("2026-10-10T12:00:00");

const task = (deadline: string | null, completed = false): Task => ({
  id: "1",
  text: "x",
  description: "",
  deadline,
  priority: "medium",
  labelIds: [],
  completed,
});

describe("describeDue", () => {
  it("returns null without a deadline", () => {
    expect(describeDue(task(null), now)).toBeNull();
  });

  it.each([
    ["2026-10-09", "Yesterday", "overdue"],
    ["2026-10-01", "1 Oct", "overdue"],
    ["2026-10-10", "Today", "today"],
    ["2026-10-11", "Tomorrow", "soon"],
    ["2026-10-14", "Wednesday", "soon"],
    ["2026-10-17", "17 Oct", "later"],
    ["2027-01-05", "5 Jan 2027", "later"],
  ])("describes %s as %s (%s)", (deadline, text, tone) => {
    expect(describeDue(task(deadline), now)).toEqual({ text, tone });
  });

  it("does not mark completed tasks as overdue", () => {
    expect(describeDue(task("2026-10-01", true), now)?.tone).not.toBe("overdue");
  });
});
