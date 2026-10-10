import type { Task } from "@/features/tasks/model/types";

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
  labels: [],
  completed: false,
  ...fields,
});

/** Example tasks for the landing page's product previews. */
export const sampleTasks = {
  labReport: task({
    id: "lab-report",
    text: "Submit the lab report",
    description: "Include the measurements from Tuesday",
    deadline: day(-1),
    priority: "high",
    labels: ["university"],
  }),
  pullRequest: task({
    id: "pull-request",
    text: "Review the pull request",
    deadline: day(0),
    labels: ["work"],
  }),
  coffee: task({
    id: "coffee",
    text: "Buy coffee beans",
    deadline: day(3),
    priority: "low",
    labels: ["shopping"],
  }),
  slides: task({
    id: "slides",
    text: "Prepare the demo slides",
    deadline: day(5),
    priority: "high",
    labels: ["work"],
  }),
  setup: task({ id: "setup", text: "Set up the project", labels: ["work"], completed: true }),
};
