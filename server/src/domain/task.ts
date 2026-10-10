export type Priority = "low" | "medium" | "high";
export type Label = "work" | "shopping" | "university";

export const PRIORITIES: readonly Priority[] = ["low", "medium", "high"];
export const ALLOWED_LABELS: readonly Label[] = ["work", "shopping", "university"];

export interface TaskProps {
  id: string;
  title: string;
  position: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  label?: Label;
  completed?: boolean;
}

/** A to-do item. Construction fails if any field breaks a business rule. */
export class Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  label: Label;
  completed: boolean;
  /** Lexicographic sort key within the owner's list. */
  position: string;

  constructor({
    id,
    title,
    position,
    description = "",
    dueDate = null,
    priority = "low",
    label = "work",
    completed = false,
  }: TaskProps) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.label = label;
    this.completed = completed;
    this.position = position;
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim() === "") {
      throw new Error("Task title cannot be empty");
    }
    if (this.dueDate && isNaN(Date.parse(this.dueDate))) {
      throw new Error("Invalid due date. Expected a valid date string or null.");
    }
    if (!PRIORITIES.includes(this.priority)) {
      throw new Error('Invalid priority level. Expected "low", "medium", or "high".');
    }
    if (!ALLOWED_LABELS.includes(this.label)) {
      throw new Error('Invalid label. Expected "work", "shopping", or "university".');
    }
  }

  toggleCompletion(): void {
    this.completed = !this.completed;
  }
}
