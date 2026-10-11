import { Label, type LabelProps } from "../../domain/label.js";
import type { LabelRepository } from "../../domain/repositories.js";

/** Keeps labels in process memory, in creation order. */
export class InMemoryLabelRepository implements LabelRepository {
  private labels = new Map<string, Label>();

  async listLabels(userId: string): Promise<Label[]> {
    return [...this.labels.values()].filter((label) => label.isOwnedBy(userId));
  }

  async getLabelById(id: string): Promise<Label | null> {
    return this.labels.get(id) ?? null;
  }

  async findLabelByName(userId: string, name: string): Promise<Label | null> {
    const key = Label.nameKey(name);
    return (
      (await this.listLabels(userId)).find((label) => Label.nameKey(label.name) === key) ?? null
    );
  }

  async createLabel(props: LabelProps): Promise<Label> {
    const label = new Label(props);
    this.labels.set(label.id, label);
    return label;
  }

  async updateLabel(
    id: string,
    patch: Partial<Pick<LabelProps, "name" | "color">>,
  ): Promise<Label | null> {
    const existing = this.labels.get(id);
    if (!existing) return null;
    const updated = new Label({ ...existing, ...patch });
    this.labels.set(id, updated);
    return updated;
  }

  async deleteAllLabels(userId: string): Promise<void> {
    for (const label of await this.listLabels(userId)) this.labels.delete(label.id);
  }

  async deleteLabel(id: string): Promise<boolean> {
    return this.labels.delete(id);
  }
}
