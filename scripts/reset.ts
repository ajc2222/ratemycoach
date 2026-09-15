import fs from "node:fs/promises";
import path from "node:path";

import { TABLE_NAMES } from "../src/lib/db/types";
import { createPool } from "./db-utils";

if (process.env.ALLOW_DB_RESET !== "true") {
  throw new Error("Refusing to reset data. Re-run with ALLOW_DB_RESET=true.");
}

if (process.env.DATABASE_URL?.trim()) {
  const pool = createPool();
  try {
    const names = [...TABLE_NAMES, "experiment_variants"].map((name) => `"${name}"`).join(", ");
    await pool.query(`truncate table ${names}`);
    console.log("reset PostgreSQL data");
  } finally {
    await pool.end();
  }
} else {
  const dir = path.resolve(process.env.LOCAL_DB_DIR ?? path.join(process.cwd(), ".data"));
  const allowedRoots = [
    path.resolve(process.cwd(), ".data"),
    path.resolve(process.cwd(), ".data-e2e"),
  ];
  if (!allowedRoots.includes(dir)) {
    throw new Error(`Refusing to reset unexpected local data directory: ${dir}`);
  }
  await fs.mkdir(dir, { recursive: true });
  await Promise.all(
    TABLE_NAMES.map((table) => fs.writeFile(path.join(dir, `${table}.ndjson`), "")),
  );
  console.log(`reset local data in ${dir}`);
}
