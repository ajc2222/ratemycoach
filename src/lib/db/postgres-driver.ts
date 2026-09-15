import { Pool, type PoolConfig } from "pg";

import { buildFunnel, mergeWaitlist } from "./json-driver";
import type {
  DemandRow,
  FunnelCounts,
  ListOptions,
  Repository,
  TableName,
  Tables,
  WaitlistEntry,
} from "./types";
import { TABLE_NAMES } from "./types";

/** Guards against identifier injection on the few dynamic-table code paths. */
function assertTable(table: string): asserts table is TableName {
  if (!(TABLE_NAMES as string[]).includes(table)) {
    throw new Error(`Unknown table: ${table}`);
  }
}

const COLUMN_PATTERN = /^[a-z_][a-z0-9_]*$/;
function assertColumn(column: string): void {
  if (!COLUMN_PATTERN.test(column)) throw new Error(`Unsafe column name: ${column}`);
}

/**
 * Production driver. Targets Supabase Postgres (or any Postgres) over the
 * pooled connection string. Every query is parameterised; the only dynamic SQL
 * is table and column identifiers, which are validated against the known
 * schema above before interpolation.
 */
export class PostgresDriver implements Repository {
  readonly driver = "postgres" as const;
  private pool: Pool;

  constructor(connectionString: string) {
    const sslMode = process.env.DATABASE_SSL;
    const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);
    const config: PoolConfig = {
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    };
    if (sslMode === "require" || (sslMode !== "disable" && !isLocal)) {
      // Supabase's pooler presents a certificate chain Node does not ship a
      // root for; transport is still encrypted.
      config.ssl = { rejectUnauthorized: false };
    }
    this.pool = new Pool(config);
    this.pool.on("error", (err) => {
      console.error(JSON.stringify({ level: "error", msg: "pg pool error", err: err.message }));
    });
  }

  async init(): Promise<void> {
    await this.pool.query("select 1");
  }

  async healthcheck(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const res = await this.pool.query<{ now: string }>("select now()::text as now");
      return { ok: true, detail: `postgres:${res.rows[0]?.now ?? "ok"}` };
    } catch (error) {
      return { ok: false, detail: (error as Error).message };
    }
  }

  async insert<T extends TableName>(
    table: T,
    row: Omit<Tables[T], "id" | "created_at"> & Partial<Pick<Tables[T], "id" | "created_at">>,
  ): Promise<Tables[T]> {
    assertTable(table);
    const entries = Object.entries(row as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    for (const [key] of entries) assertColumn(key);
    const columns = entries.map(([k]) => `"${k}"`).join(", ");
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
    const values = entries.map(([, v]) => (isJsonColumn(v) ? JSON.stringify(v) : v));
    const sql = `insert into "${table}" (${columns}) values (${placeholders}) returning *`;
    const res = await this.pool.query(sql, values);
    return res.rows[0] as Tables[T];
  }

  async insertMany<T extends TableName>(
    table: T,
    rows: (Omit<Tables[T], "id" | "created_at"> &
      Partial<Pick<Tables[T], "id" | "created_at">>)[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    assertTable(table);
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      for (const row of rows) {
        const entries = Object.entries(row as Record<string, unknown>).filter(
          ([, v]) => v !== undefined,
        );
        for (const [key] of entries) assertColumn(key);
        const columns = entries.map(([k]) => `"${k}"`).join(", ");
        const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
        const values = entries.map(([, v]) => (isJsonColumn(v) ? JSON.stringify(v) : v));
        await client.query(
          `insert into "${table}" (${columns}) values (${placeholders})`,
          values,
        );
      }
      await client.query("commit");
      return rows.length;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertWaitlist(
    row: Omit<WaitlistEntry, "id" | "created_at" | "updated_at" | "submission_count">,
  ): Promise<{ entry: WaitlistEntry; duplicate: boolean }> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      // A row lock cannot protect the "no row exists" case. Serialise by the
      // stable email hash so concurrent first submissions cannot race into two
      // inserts (or turn one otherwise-valid request into a unique violation).
      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [
        row.email_hash,
      ]);
      const existing = await client.query<WaitlistEntry>(
        `select * from waitlist_entries where email_hash = $1 for update`,
        [row.email_hash],
      );
      if (existing.rows.length === 0) {
        const insertRow = {
          ...row,
          updated_at: new Date().toISOString(),
          submission_count: 1,
        };
        const entries = Object.entries(insertRow);
        for (const [key] of entries) assertColumn(key);
        const columns = entries.map(([key]) => `"${key}"`).join(", ");
        const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
        const values = entries.map(([, value]) =>
          isJsonColumn(value) ? JSON.stringify(value) : value,
        );
        const inserted = await client.query<WaitlistEntry>(
          `insert into waitlist_entries (${columns}) values (${placeholders}) returning *`,
          values,
        );
        await client.query("commit");
        return { entry: inserted.rows[0], duplicate: false };
      }
      const merged = mergeWaitlist(existing.rows[0], row, new Date().toISOString());
      const entries = Object.entries(merged).filter(([k]) => k !== "id" && k !== "created_at");
      for (const [key] of entries) assertColumn(key);
      const assignments = entries.map(([k], i) => `"${k}" = $${i + 2}`).join(", ");
      const res = await client.query<WaitlistEntry>(
        `update waitlist_entries set ${assignments} where id = $1 returning *`,
        [merged.id, ...entries.map(([, v]) => (isJsonColumn(v) ? JSON.stringify(v) : v))],
      );
      await client.query("commit");
      return { entry: res.rows[0], duplicate: true };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async list<T extends TableName>(table: T, options: ListOptions = {}): Promise<Tables[T][]> {
    assertTable(table);
    const direction = options.order === "asc" ? "asc" : "desc";
    const res = await this.pool.query(
      `select * from "${table}" order by created_at ${direction} limit $1 offset $2`,
      [options.limit ?? 500, options.offset ?? 0],
    );
    return res.rows as Tables[T][];
  }

  async count(table: TableName): Promise<number> {
    assertTable(table);
    const res = await this.pool.query<{ count: string }>(`select count(*) from "${table}"`);
    return Number(res.rows[0].count);
  }

  async counts(): Promise<Record<TableName, number>> {
    const entries = await Promise.all(
      TABLE_NAMES.map(async (t) => [t, await this.count(t)] as const),
    );
    return Object.fromEntries(entries) as Record<TableName, number>;
  }

  async coachDemand(limit = 50): Promise<DemandRow[]> {
    const res = await this.pool.query<DemandRow>(
      `
      with combined as (
        select normalized_query as key, raw_query as raw, visitor_id,
               case when zero_results then 1 else 0 end as zero, 0 as req
          from search_events
         where normalized_query <> ''
        union all
        select coach_name_normalized as key, coach_name as raw, visitor_id, 0 as zero, 1 as req
          from coach_requests
      )
      select key as normalized_query,
             min(raw) as raw_example,
             count(*) filter (where req = 0)::int as searches,
             count(distinct visitor_id)::int as unique_visitors,
             coalesce(sum(zero), 0)::int as zero_result_searches,
             coalesce(sum(req), 0)::int as requests
        from combined
       group by key
       order by (coalesce(sum(req),0) + count(distinct visitor_id)) desc, searches desc
       limit $1
      `,
      [limit],
    );
    return res.rows;
  }

  async eventCountsByName(): Promise<Record<string, number>> {
    const res = await this.pool.query<{ name: string; count: string }>(
      `select name, count(*) as count from analytics_events group by name`,
    );
    return Object.fromEntries(res.rows.map((r) => [r.name, Number(r.count)]));
  }

  async funnel(): Promise<FunnelCounts> {
    return buildFunnel(await this.eventCountsByName());
  }

  async countsBy(
    table: TableName,
    column: string,
  ): Promise<{ value: string; count: number }[]> {
    assertTable(table);
    assertColumn(column);
    const arrayColumns = new Set(["interests", "coaching_types", "divisions"]);
    const valueSource = arrayColumns.has(column)
      ? `select unnest(coalesce("${column}"::text[], array[]::text[])) as value from "${table}"`
      : `select "${column}"::text as value from "${table}"`;
    const res = await this.pool.query<{ value: string; count: string }>(
      `
      select value, count(*) as count from (
        ${valueSource}
      ) t
      where value is not null and value <> ''
      group by value order by count desc
      `,
    );
    return res.rows.map((r) => ({ value: r.value, count: Number(r.count) }));
  }

  async deleteByEmailHash(emailHash: string): Promise<number> {
    let removed = 0;
    for (const table of TABLE_NAMES) {
      const hasColumn = await this.pool.query(
        `select 1 from information_schema.columns
          where table_name = $1 and column_name = 'email_hash' limit 1`,
        [table],
      );
      if (hasColumn.rowCount === 0) continue;
      const res = await this.pool.query(`delete from "${table}" where email_hash = $1`, [
        emailHash,
      ]);
      removed += res.rowCount ?? 0;
    }
    return removed;
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

function isJsonColumn(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}
