import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../domain/errors.js";
import { DEFAULT_LABELS, LABEL_COLORS, Label, type LabelColor } from "../domain/label.js";
import type { LabelRepository } from "../domain/repositories.js";

export interface CreateLabelInput {
  name: string;
  color?: LabelColor;
}

export interface UpdateLabelInput {
  name?: string;
  color?: LabelColor;
}

/** Label use cases: each user manages their own set of labels. */
export class LabelService {
  constructor(private readonly labelRepository: LabelRepository) {}

  listLabels(userId: string): Promise<Label[]> {
    return this.labelRepository.listLabels(userId);
  }

  async createLabel(userId: string, input: CreateLabelInput): Promise<Label> {
    await this.ensureNameIsFree(userId, input.name);
    const existing = await this.labelRepository.listLabels(userId);

    return this.labelRepository.createLabel({
      id: randomUUID(),
      userId,
      name: input.name,
      color: input.color ?? LabelService.nextColor(existing),
    });
  }

  async updateLabel(userId: string, labelId: string, input: UpdateLabelInput): Promise<Label> {
    await this.getOwnedLabel(userId, labelId);
    if (input.name !== undefined) await this.ensureNameIsFree(userId, input.name, labelId);

    const updated = await this.labelRepository.updateLabel(labelId, input);
    if (!updated) throw new NotFoundError("Label", labelId);
    return updated;
  }

  async deleteLabel(userId: string, labelId: string): Promise<void> {
    await this.getOwnedLabel(userId, labelId);
    await this.labelRepository.deleteLabel(labelId);
  }

  /** Gives a new account the standard Work / Shopping / University labels. */
  async createDefaultLabels(userId: string): Promise<Label[]> {
    const created: Label[] = [];
    for (const { name, color } of DEFAULT_LABELS) {
      if (await this.labelRepository.findLabelByName(userId, name)) continue;
      created.push(
        await this.labelRepository.createLabel({ id: randomUUID(), userId, name, color }),
      );
    }
    return created;
  }

  /**
   * Throws NotFoundError unless every id is one of the user's labels.
   * Used when tasks reference labels.
   */
  async assertOwnsLabels(userId: string, labelIds: readonly string[]): Promise<void> {
    if (!labelIds.length) return;
    const owned = new Set((await this.labelRepository.listLabels(userId)).map((l) => l.id));
    const unknown = labelIds.find((id) => !owned.has(id));
    if (unknown) throw new NotFoundError("Label", unknown);
  }

  /** Loads a label only if it belongs to the user; others look like they don't exist. */
  private async getOwnedLabel(userId: string, labelId: string): Promise<Label> {
    const label = await this.labelRepository.getLabelById(labelId);
    if (!label || !label.isOwnedBy(userId)) throw new NotFoundError("Label", labelId);
    return label;
  }

  private async ensureNameIsFree(userId: string, name: string, exceptId?: string) {
    const clash = await this.labelRepository.findLabelByName(userId, name);
    if (clash && clash.id !== exceptId) {
      throw new ConflictError(`A label named "${clash.name}" already exists`);
    }
  }

  /** The first palette colour not in use yet, so new labels look different. */
  private static nextColor(existing: readonly Label[]): LabelColor {
    const used = new Set(existing.map((label) => label.color));
    return (
      LABEL_COLORS.find((color) => !used.has(color)) ??
      LABEL_COLORS[existing.length % LABEL_COLORS.length]!
    );
  }
}
