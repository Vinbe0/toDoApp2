import { ValidationError } from "./errors.js";

export type Priority = "low" | "medium" | "high";
export type Label = "work" | "shopping" | "university";

export const PRIORITIES: readonly Priority[] = ["low", "medium", "high"];
export const ALLOWED_LABELS: readonly Label[] = ["work", "shopping", "university"];

export interface TaskProps {
  id: string;
  userId: string;
  title: string;
  position: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  labels?: Label[];
  completed?: boolean;
}

/** A to-do item. Construction fails if any field breaks a business rule. */
export class Task {
  id: string;
  /** Owner. Only this user may read or change the task. */
  userId: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  labels: Label[];
  completed: boolean;
  /** Lexicographic sort key within the owner's list. */
  position: string;

  constructor({
    id,
    userId,
    title,
    position,
    description = "",
    dueDate = null,
    priority = "low",
    labels = [],
    completed = false,
  }: TaskProps) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    // Order-preserving de-duplication: ["work", "work"] → ["work"].
    this.labels = [...new Set(labels)];
    this.completed = completed;
    this.position = position;
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim() === "") {
      throw new ValidationError("Task title cannot be empty");
    }
    if (this.dueDate && isNaN(Date.parse(this.dueDate))) {
      throw new ValidationError("Invalid due date. Expected a valid date string or null.");
    }
    if (!PRIORITIES.includes(this.priority)) {
      throw new ValidationError('Invalid priority level. Expected "low", "medium", or "high".');
    }
    if (!this.labels.every((label) => ALLOWED_LABELS.includes(label))) {
      throw new ValidationError('Invalid label. Expected "work", "shopping", or "university".');
    }
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  hasLabel(label: Label): boolean {
    return this.labels.includes(label);
  }

  toggleCompletion(): void {
    this.completed = !this.completed;
  }
}
