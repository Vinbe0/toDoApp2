import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";

const folder = fileURLToPath(new URL("../drizzle", import.meta.url));
const migrations = readdirSync(folder)
  .filter((file) => file.endsWith(".sql"))
  .sort();

/** Runs migration files one by one, so tests can insert data in between. */
async function runMigration(db: PGlite, file: string) {
  const sql = readFileSync(`${folder}/${file}`, "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim()) await db.exec(statement);
  }
}

describe("migrations", () => {
  let db: PGlite;
  afterEach(() => db.close());

  it("apply cleanly to an empty database", async () => {
    db = new PGlite();
    for (const file of migrations) await runMigration(db, file);

    const { rows } = await db.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'",
    );
    expect(rows.map((r) => r.column_name)).toContain("labels");
    expect(rows.map((r) => r.column_name)).not.toContain("label");
  });

  it("keep each task's old single label when moving to multiple labels", async () => {
    db = new PGlite();
    const [init, ...rest] = migrations;
    await runMigration(db, init!);
    await db.exec(`
      INSERT INTO users (id, email, password_hash)
        VALUES ('00000000-0000-0000-0000-000000000001', 'a@b.co', 'x');
      INSERT INTO tasks (id, user_id, title, label, position)
        VALUES ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-000000000001',
                'Old task', 'shopping', 'a1');
    `);

    for (const file of rest) await runMigration(db, file);

    const { rows } = await db.query<{ labels: string[] }>("SELECT labels FROM tasks");
    expect(rows).toEqual([{ labels: ["shopping"] }]);
  });
});
