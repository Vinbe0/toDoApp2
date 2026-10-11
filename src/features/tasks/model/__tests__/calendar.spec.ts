import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import {
  addDays,
  openTasksByDay,
  overdueTasks,
  startOfWeek,
  toIsoDate,
  weekOf,
  weekTitle,
} from "../calendar";

let id = 0;
const task = (deadline: string | null, completed = false): Task => ({
  id: String(++id),
  text: `Task ${id}`,
  description: "",
  deadline,
  priority: "medium",
  labelIds: [],
  completed,
});

describe("dates", () => {
  it("formats local dates without shifting to UTC", () => {
    expect(toIsoDate(new Date(2026, 9, 11, 23, 59))).toBe("2026-10-11");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("adds calendar days across a daylight-saving change", () => {
    // Europe moves clocks back on 25 Oct 2026; one day later is still the 26th.
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05"); // Sunday → previous Monday
    expect(startOfWeek("2026-10-12")).toBe("2026-10-12"); // Monday
    expect(weekOf("2026-10-14")).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
  });

  it("titles a week by month, covering weeks that span two months or years", () => {
    expect(weekTitle(weekOf("2026-10-14"))).toBe("October 2026");
    expect(weekTitle(weekOf("2026-09-30"))).toBe("September – October 2026");
    expect(weekTitle(weekOf("2026-12-31"))).toBe("December 2026 – January 2027");
  });
});

describe("tasks by day", () => {
  it("groups open tasks by deadline for the given days only", () => {
    const monday = task("2026-10-12");
    const alsoMonday = task("2026-10-12T09:00:00Z");
    const done = task("2026-10-12", true);
    const nextWeek = task("2026-10-20");
    const undated = task(null);

    const byDay = openTasksByDay(
      [monday, alsoMonday, done, nextWeek, undated],
      weekOf("2026-10-12"),
    );
    expect(byDay["2026-10-12"]).toEqual([monday, alsoMonday]);
    expect(byDay["2026-10-13"]).toEqual([]);
    expect(Object.values(byDay).flat()).toHaveLength(2);
  });

  it("finds open tasks due before today", () => {
    const late = task("2026-10-09");
    const doneLate = task("2026-10-09", true);
    const today = task("2026-10-11");
    expect(overdueTasks([late, doneLate, today, task(null)], "2026-10-11")).toEqual([late]);
  });
});
