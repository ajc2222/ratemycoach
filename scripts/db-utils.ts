import { config as loadEnv } from "dotenv";
import { Pool, type PoolConfig } from "pg";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

export function databaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required for this command.");
  return value;
}

export function createPool(): Pool {
  const connectionString = databaseUrl();
  const sslMode = process.env.DATABASE_SSL;
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);
  const options: PoolConfig = { connectionString, max: 1 };
  if (sslMode === "require" || (sslMode !== "disable" && !isLocal)) {
    options.ssl = { rejectUnauthorized: false };
  }
  return new Pool(options);
}
