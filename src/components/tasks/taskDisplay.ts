import type { Label, Priority, Task } from "@/types/todo";

export const priorityOptions: Array<{ value: Priority; label: string; tone: "red" | "amber" | "blue" }> = [
  { value: "high", label: "High", tone: "red" },
  { value: "medium", label: "Medium", tone: "amber" },
  { value: "low", label: "Low", tone: "blue" },
];

export const priorityTone = (priority: Priority) =>
  priorityOptions.find((option) => option.value === priority)?.tone ?? "blue";

export const priorityLabel = (priority: Priority) =>
  priorityOptions.find((option) => option.value === priority)?.label ?? priority;

export const labelName = (label: Label) => label.charAt(0).toUpperCase() + label.slice(1);

const todayIso = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const isOverdue = (task: Task) =>
  !task.completed && !!task.deadline && task.deadline.slice(0, 10) < todayIso();

export const isDueToday = (task: Task) =>
  !!task.deadline && task.deadline.slice(0, 10) === todayIso();

export const formatDate = (value: string) =>
  new Date(value.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
