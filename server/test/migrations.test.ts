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
    expect(rows.map((r) => r.column_name)).not.toContain("labels");
    expect(rows.map((r) => r.column_name)).not.toContain("label");
    const { rows: tables } = await db.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    expect(tables.map((t) => t.table_name)).toEqual(
      expect.arrayContaining(["users", "tasks", "labels", "task_labels"]),
    );
  });

  it("convert text positions to integers, keeping each user's order", async () => {
    db = new PGlite();
    const before = migrations.filter((file) => file < "0003");
    const after = migrations.filter((file) => file >= "0003");
    for (const file of before) await runMigration(db, file);

    await db.exec(`
      INSERT INTO users (id, email, password_hash) VALUES
        ('00000000-0000-0000-0000-000000000001', 'a@b.co', 'x'),
        ('00000000-0000-0000-0000-000000000002', 'c@d.co', 'x');
      INSERT INTO tasks (id, user_id, title, position) VALUES
        ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'A2', 'a2'),
        ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'B0', 'b0'),
        ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'A1', 'a1'),
        ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000002', 'Other', 'a5');
    `);
    for (const file of after) await runMigration(db, file);

    const { rows } = await db.query<{ title: string; position: number }>(
      "SELECT title, position FROM tasks ORDER BY user_id, position",
    );
    expect(rows).toEqual([
      { title: "A1", position: 0 },
      { title: "A2", position: 1 },
      { title: "B0", position: 2 },
      { title: "Other", position: 0 },
    ]);
  });

  it("keep each task's old single label when moving to multiple labels", async () => {
    db = new PGlite();
    const [init, ...rest] = migrations.filter((file) => file < "0003");
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

  it("turn old tag names into per-user labels and link tasks to them", async () => {
    db = new PGlite();
    for (const file of migrations.filter((f) => f < "0005")) await runMigration(db, file);
    await db.exec(`
      INSERT INTO users (id, email, password_hash) VALUES
        ('00000000-0000-0000-0000-000000000001', 'a@b.co', 'x'),
        ('00000000-0000-0000-0000-000000000002', 'c@d.co', 'x');
      INSERT INTO tasks (id, user_id, title, labels, position) VALUES
        ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001',
         'Report', '{work,shopping}', 0),
        ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001',
         'Run', '{gym}', 1);
    `);

    for (const file of migrations.filter((f) => f >= "0005")) await runMigration(db, file);

    const labelsOf = async (userId: string) =>
      (
        await db.query<{ name: string }>(
          `SELECT name FROM labels WHERE user_id = '${userId}' ORDER BY seq`,
        )
      ).rows.map((r) => r.name);
    // Everyone gets the defaults; other old tags are kept as labels too.
    expect(await labelsOf("00000000-0000-0000-0000-000000000001")).toEqual([
      "Work",
      "Shopping",
      "University",
      "Gym",
    ]);
    expect(await labelsOf("00000000-0000-0000-0000-000000000002")).toEqual([
      "Work",
      "Shopping",
      "University",
    ]);

    const { rows } = await db.query<{ title: string; name: string }>(`
      SELECT t.title, l.name FROM task_labels tl
      JOIN tasks t ON t.id = tl.task_id JOIN labels l ON l.id = tl.label_id
      ORDER BY t.title, l.seq`);
    expect(rows).toEqual([
      { title: "Report", name: "Work" },
      { title: "Report", name: "Shopping" },
      { title: "Run", name: "Gym" },
    ]);
  });
});
