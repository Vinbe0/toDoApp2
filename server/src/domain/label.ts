import { ValidationError } from "./errors.js";

/** Colours a label can have; the frontend maps each to its own shades. */
export const LABEL_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "sky",
  "blue",
  "violet",
  "pink",
  "slate",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const MAX_LABEL_NAME_LENGTH = 30;

/** Labels every new account (and guest) starts with. */
export const DEFAULT_LABELS: ReadonlyArray<{ name: string; color: LabelColor }> = [
  { name: "Work", color: "sky" },
  { name: "Shopping", color: "amber" },
  { name: "University", color: "violet" },
];

export interface LabelProps {
  id: string;
  userId: string;
  name: string;
  color: LabelColor;
}

/** A user-defined tag. Names are unique per user, ignoring case. */
export class Label {
  readonly id: string;
  readonly userId: string;
  name: string;
  color: LabelColor;

  constructor({ id, userId, name, color }: LabelProps) {
    this.id = id;
    this.userId = userId;
    this.name = Label.normalizeName(name);
    this.color = color;
    this.validate();
  }

  /** Trims and collapses inner whitespace: "  Side   project " → "Side project". */
  static normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
  }

  /** Key used to compare names: "Work" and "work" are the same label. */
  static nameKey(name: string): string {
    return Label.normalizeName(name).toLowerCase();
  }

  private validate(): void {
    if (!this.name) throw new ValidationError("Label name cannot be empty");
    if (this.name.length > MAX_LABEL_NAME_LENGTH) {
      throw new ValidationError(
        `Label name must be at most ${MAX_LABEL_NAME_LENGTH} characters long`,
      );
    }
    if (this.name.startsWith("#")) {
      throw new ValidationError('Label name should not start with "#"');
    }
    if (!LABEL_COLORS.includes(this.color)) {
      throw new ValidationError(
        `Invalid label colour. Expected one of: ${LABEL_COLORS.join(", ")}.`,
      );
    }
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }
}
