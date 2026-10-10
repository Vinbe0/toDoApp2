import type { Label, LabelColor } from "./types";

export const LABEL_COLORS: readonly LabelColor[] = [
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
];

export const MAX_LABEL_NAME_LENGTH = 30;

/**
 * Labels a guest starts with. Their ids are the old fixed tag values, so
 * tasks saved by earlier versions of the app keep their labels.
 */
export const DEFAULT_LABELS: readonly Label[] = [
  { id: "work", name: "Work", color: "sky" },
  { id: "shopping", name: "Shopping", color: "amber" },
  { id: "university", name: "University", color: "violet" },
];

/** "  Side   project " → "Side project" (same rule as the backend). */
export const normalizeLabelName = (name: string) => name.trim().replace(/\s+/g, " ");

/** Names are compared ignoring case: "Work" and "work" are the same label. */
export const labelNameKey = (name: string) => normalizeLabelName(name).toLowerCase();

/** Returns a message if the name can't be used, otherwise null. */
export function validateLabelName(
  name: string,
  existing: readonly Label[],
  exceptId?: string,
): string | null {
  const normalized = normalizeLabelName(name);
  if (!normalized) return "Enter a name";
  if (normalized.length > MAX_LABEL_NAME_LENGTH) {
    return `Use at most ${MAX_LABEL_NAME_LENGTH} characters`;
  }
  if (normalized.startsWith("#")) return 'Leave out the "#"';
  const clash = existing.find(
    (label) => label.id !== exceptId && labelNameKey(label.name) === labelNameKey(normalized),
  );
  return clash ? `"${clash.name}" already exists` : null;
}

/** The first palette colour not in use yet, so new labels look different. */
export function nextLabelColor(existing: readonly Label[]): LabelColor {
  const used = new Set(existing.map((label) => label.color));
  return (
    LABEL_COLORS.find((color) => !used.has(color)) ??
    LABEL_COLORS[existing.length % LABEL_COLORS.length]!
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Validates labels loaded from storage, dropping anything malformed. */
export function normalizeLabelList(data: unknown): Label[] | null {
  if (!Array.isArray(data)) return null;
  return data.flatMap((item): Label[] =>
    isRecord(item) &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    LABEL_COLORS.includes(item.color as LabelColor)
      ? [{ id: item.id, name: item.name, color: item.color as LabelColor }]
      : [],
  );
}
