import type { Label, LabelColor } from "@/features/tasks/model/types";

export type NewLabel = { name: string; color: LabelColor };
export type LabelPatch = Partial<NewLabel>;

/** Where labels are stored: the browser for guests, the server for accounts. */
export interface LabelRepository {
  list(): Promise<Label[]>;
  create(input: NewLabel): Promise<Label>;
  update(id: string, patch: LabelPatch): Promise<Label>;
  /** Deleting a label also removes it from tasks (the caller updates local state). */
  remove(id: string): Promise<void>;
}
