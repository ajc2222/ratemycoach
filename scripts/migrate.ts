import fs from "node:fs/promises";
import path from "node:path";

import { createPool } from "./db-utils";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const pool = createPool();

try {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  if (files.length === 0) throw new Error(`No migrations found in ${migrationsDir}`);

  await pool.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const file of files) {
    const applied = await pool.query("select 1 from schema_migrations where name = $1", [file]);
    if (applied.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
