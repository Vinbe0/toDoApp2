import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import type { Label, Task } from "@/features/tasks/model/types";

/** A local calendar date relative to today, as YYYY-MM-DD. */
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const task = (fields: Partial<Task> & Pick<Task, "id" | "text">): Task => ({
  description: "",
  deadline: null,
  priority: "medium",
  labelIds: [],
  completed: false,
  ...fields,
});

/** Example tasks for the landing page's product previews (labels are the default ones). */
export const sampleTasks = {
  labReport: task({
    id: "lab-report",
    text: "Submit the lab report",
    description: "Include the measurements from Tuesday",
    deadline: day(-1),
    priority: "high",
    labelIds: ["university"],
  }),
  pullRequest: task({
    id: "pull-request",
    text: "Review the pull request",
    deadline: day(0),
    labelIds: ["work"],
  }),
  coffee: task({
    id: "coffee",
    text: "Buy coffee beans",
    deadline: day(3),
    priority: "low",
    labelIds: ["shopping"],
  }),
  slides: task({
    id: "slides",
    text: "Prepare the demo slides",
    deadline: day(5),
    priority: "high",
    labelIds: ["work"],
  }),
  setup: task({ id: "setup", text: "Set up the project", labelIds: ["work"], completed: true }),
};

/** The default labels a sample task has, for passing to TaskItem. */
export const sampleLabelsFor = (task: Task): Label[] =>
  DEFAULT_LABELS.filter((label) => task.labelIds.includes(label.id));
