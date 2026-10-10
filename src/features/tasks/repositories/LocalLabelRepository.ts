import { DEFAULT_LABELS, normalizeLabelName } from "@/features/tasks/model/label";
import type { Label } from "@/features/tasks/model/types";
import type { StorageItem } from "@/shared/lib/storage";
import type { LabelPatch, LabelRepository, NewLabel } from "./LabelRepository";

/** Guest mode: labels live in the browser's storage, starting with the defaults. */
export class LocalLabelRepository implements LabelRepository {
  constructor(
    private readonly storage: StorageItem<Label[]>,
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async list() {
    return this.read();
  }

  async create(input: NewLabel) {
    const label: Label = {
      id: this.createId(),
      name: normalizeLabelName(input.name),
      color: input.color,
    };
    this.write([...this.read(), label]);
    return label;
  }

  async update(id: string, patch: LabelPatch) {
    const labels = this.read();
    const index = labels.findIndex((label) => label.id === id);
    const existing = labels[index];
    if (!existing) throw new Error("Label not found");

    const updated: Label = {
      ...existing,
      ...patch,
      ...(patch.name !== undefined ? { name: normalizeLabelName(patch.name) } : {}),
    };
    labels[index] = updated;
    this.write(labels);
    return updated;
  }

  async remove(id: string) {
    this.write(this.read().filter((label) => label.id !== id));
  }

  /** First use (nothing stored yet) starts with the default labels. */
  private read(): Label[] {
    return this.storage.get() ?? DEFAULT_LABELS.map((label) => ({ ...label }));
  }

  private write(labels: Label[]) {
    this.storage.set(labels);
  }
}
