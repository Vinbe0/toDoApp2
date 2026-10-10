import type { HttpClient } from "@/shared/api";
import type { Label } from "@/features/tasks/model/types";
import type { LabelPatch, LabelRepository, NewLabel } from "./LabelRepository";

/** Account mode: labels are stored by the backend (see server /api/labels). */
export class ApiLabelRepository implements LabelRepository {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Label[]>("/api/labels");
  }

  create(input: NewLabel) {
    return this.http.post<Label>("/api/labels", input);
  }

  update(id: string, patch: LabelPatch) {
    return this.http.put<Label>(`/api/labels/${encodeURIComponent(id)}`, patch);
  }

  async remove(id: string) {
    await this.http.delete(`/api/labels/${encodeURIComponent(id)}`);
  }
}
