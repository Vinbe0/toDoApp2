import { and, asc, eq, sql } from "drizzle-orm";
import { ConflictError } from "../../domain/errors.js";
import { Label, type LabelColor, type LabelProps } from "../../domain/label.js";
import type { LabelRepository } from "../../domain/repositories.js";
import type { Database } from "../db/client.js";
import { labels, type LabelRow } from "../db/schema.js";
import { isUniqueViolation } from "./postgresErrors.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toLabel = (row: LabelRow) =>
  new Label({ id: row.id, userId: row.userId, name: row.name, color: row.color as LabelColor });

/** The unique index is the final guard against two labels with the same name. */
function rethrowDuplicate(error: unknown, name: string): never {
  if (isUniqueViolation(error)) throw new ConflictError(`A label named "${name}" already exists`);
  throw error;
}

export class DrizzleLabelRepository implements LabelRepository {
  constructor(private readonly db: Database) {}

  async listLabels(userId: string): Promise<Label[]> {
    const rows = await this.db
      .select()
      .from(labels)
      .where(eq(labels.userId, userId))
      .orderBy(asc(labels.seq));
    return rows.map(toLabel);
  }

  async getLabelById(id: string): Promise<Label | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.db.select().from(labels).where(eq(labels.id, id));
    return row ? toLabel(row) : null;
  }

  async findLabelByName(userId: string, name: string): Promise<Label | null> {
    const [row] = await this.db
      .select()
      .from(labels)
      .where(and(eq(labels.userId, userId), sql`lower(${labels.name}) = ${Label.nameKey(name)}`));
    return row ? toLabel(row) : null;
  }

  async createLabel(props: LabelProps): Promise<Label> {
    const label = new Label(props);
    try {
      await this.db.insert(labels).values({
        id: label.id,
        userId: label.userId,
        name: label.name,
        color: label.color,
      });
    } catch (error) {
      rethrowDuplicate(error, label.name);
    }
    return label;
  }

  async updateLabel(
    id: string,
    patch: Partial<Pick<LabelProps, "name" | "color">>,
  ): Promise<Label | null> {
    const existing = await this.getLabelById(id);
    if (!existing) return null;

    const next = new Label({ ...existing, ...patch });
    try {
      await this.db
        .update(labels)
        .set({ name: next.name, color: next.color })
        .where(eq(labels.id, id));
    } catch (error) {
      rethrowDuplicate(error, next.name);
    }
    return next;
  }

  async deleteLabel(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.db
      .delete(labels)
      .where(eq(labels.id, id))
      .returning({ id: labels.id });
    return deleted.length > 0;
  }
}
