import { ValidationError } from "./errors.js";

export type Priority = "low" | "medium" | "high";

export const PRIORITIES: readonly Priority[] = ["low", "medium", "high"];

export interface TaskProps {
  id: string;
  userId: string;
  title: string;
  position: number;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  /** Ids of the owner's labels. */
  labelIds?: string[];
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
  labelIds: string[];
  completed: boolean;
  /** 0-based place in the owner's list; lower comes first. */
  position: number;

  constructor({
    id,
    userId,
    title,
    position,
    description = "",
    dueDate = null,
    priority = "low",
    labelIds = [],
    completed = false,
  }: TaskProps) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    // Order-preserving de-duplication.
    this.labelIds = [...new Set(labelIds)];
    this.completed = completed;
    this.position = position;
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim() === "") {
      throw new ValidationError("Task title cannot be empty");
    }
    if (!Number.isInteger(this.position) || this.position < 0) {
      throw new ValidationError("Position must be a non-negative integer");
    }
    if (this.dueDate && isNaN(Date.parse(this.dueDate))) {
      throw new ValidationError("Invalid due date. Expected a valid date string or null.");
    }
    if (!PRIORITIES.includes(this.priority)) {
      throw new ValidationError('Invalid priority level. Expected "low", "medium", or "high".');
    }
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  hasLabel(labelId: string): boolean {
    return this.labelIds.includes(labelId);
  }

  toggleCompletion(): void {
    this.completed = !this.completed;
  }
}
