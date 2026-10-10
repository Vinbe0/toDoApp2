import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import pg from "pg";
import * as schema from "./schema.js";

/** Works with both drivers, so repositories don't care which one is used. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export type DatabaseConnection = {
  db: Database;
  driver: "postgres" | "pglite";
  close(): Promise<void>;
};

const migrationsFolder = fileURLToPath(new URL("../../../drizzle", import.meta.url));

export type DatabaseOptions =
  /** A real PostgreSQL server. */
  | { url: string }
  /** Embedded Postgres (WebAssembly). Use "memory://" for a throwaway database. */
  | { pgliteDataDir: string };

/** Connects to the database and applies pending migrations. */
export async function connectDatabase(options: DatabaseOptions): Promise<DatabaseConnection> {
  if ("url" in options) {
    const pool = new pg.Pool({ connectionString: options.url });
    const db = drizzleNodePg(pool, { schema });
    await migrateNodePg(db, { migrationsFolder });
    return { db: db as unknown as Database, driver: "postgres", close: () => pool.end() };
  }

  const { pgliteDataDir } = options;
  if (!pgliteDataDir.includes("://")) mkdirSync(pgliteDataDir, { recursive: true });
  const client = new PGlite(pgliteDataDir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder });
  return { db: db as unknown as Database, driver: "pglite", close: () => client.close() };
}
