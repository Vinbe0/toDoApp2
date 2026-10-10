export type Priority = "high" | "medium" | "low";
export type Label = "work" | "shopping" | "university";
export interface Task {
  id: string;
  text: string;
  description: string;
  completed: boolean;
  deadline: string | null;
  priority: Priority;
  labels: Label[];
}
