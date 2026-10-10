export type Priority = "high" | "medium" | "low";

/** Must match the backend palette (server/src/domain/label.ts). */
export type LabelColor =
  "red" | "orange" | "amber" | "green" | "teal" | "sky" | "blue" | "violet" | "pink" | "slate";

/** A user-defined tag. */
export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Task {
  id: string;
  text: string;
  description: string;
  completed: boolean;
  deadline: string | null;
  priority: Priority;
  /** Ids of the labels this task has. */
  labelIds: string[];
}
