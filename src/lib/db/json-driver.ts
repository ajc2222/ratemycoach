import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

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

/**
 * Append-only NDJSON storage.
 *
 * This exists so the smoke test runs with zero credentials — clone, `npm run
 * dev`, and every form works. It is explicitly a single-instance development
 * and low-volume-pilot driver: it holds the whole table in memory and rewrites
 * the file for the rare update (waitlist merge, deletion request).
 *
 * Production uses the Postgres driver. See docs/deployment.md.
 */
export class JsonFileDriver implements Repository {
  readonly driver = "json" as const;
  private readonly dir: string;
  private cache = new Map<TableName, Record<string, unknown>[]>();
  private loaded = new Set<TableName>();
  /** Serialises writes within the process; concurrent route handlers share it. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dir = process.env.LOCAL_DB_DIR ?? path.join(process.cwd(), ".data")) {
    this.dir = dir;
  }

  private file(table: TableName): string {
    return path.join(this.dir, `${table}.ndjson`);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  async healthcheck(): Promise<{ ok: boolean; detail?: string }> {
    try {
      await fs.mkdir(this.dir, { recursive: true });
      await fs.access(this.dir);
      return { ok: true, detail: `json:${this.dir}` };
    } catch (error) {
      return { ok: false, detail: (error as Error).message };
    }
  }

  private async load(table: TableName): Promise<Record<string, unknown>[]> {
    if (this.loaded.has(table)) return this.cache.get(table)!;
    let rows: Record<string, unknown>[] = [];
    try {
      const text = await fs.readFile(this.file(table), "utf8");
      rows = text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          try {
            return JSON.parse(line) as Record<string, unknown>;
          } catch {
            // A torn final line must not take the whole dataset down.
            return null;
          }
        })
        .filter((r): r is Record<string, unknown> => r !== null);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    this.cache.set(table, rows);
    this.loaded.add(table);
    return rows;
  }

  /** Runs `fn` with exclusive access to the write queue. */
  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async append(table: TableName, row: Record<string, unknown>): Promise<void> {
    // Load BEFORE writing. Loading afterwards would read the row back off disk
    // into the cache and then push it a second time, double-counting every
    // insert made before the table was first read.
    const rows = await this.load(table);
    await fs.mkdir(this.dir, { recursive: true });
    await fs.appendFile(this.file(table), `${JSON.stringify(row)}\n`, "utf8");
    rows.push(row);
  }

  private async rewrite(table: TableName, rows: Record<string, unknown>[]): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    const body = rows.map((r) => JSON.stringify(r)).join("\n");
    const tmp = `${this.file(table)}.tmp`;
    await fs.writeFile(tmp, body.length > 0 ? `${body}\n` : "", "utf8");
    await fs.rename(tmp, this.file(table));
    this.cache.set(table, rows);
    this.loaded.add(table);
  }

  async insert<T extends TableName>(
    table: T,
    row: Omit<Tables[T], "id" | "created_at"> & Partial<Pick<Tables[T], "id" | "created_at">>,
  ): Promise<Tables[T]> {
    return this.serialize(async () => {
      const complete = {
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...row,
      } as unknown as Tables[T];
      await this.append(table, complete as unknown as Record<string, unknown>);
      return complete;
    });
  }

  async insertMany<T extends TableName>(
    table: T,
    rows: (Omit<Tables[T], "id" | "created_at"> &
      Partial<Pick<Tables[T], "id" | "created_at">>)[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    return this.serialize(async () => {
      for (const row of rows) {
        const complete = {
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...row,
        } as unknown as Record<string, unknown>;
        await this.append(table, complete);
      }
      return rows.length;
    });
  }

  async upsertWaitlist(
    row: Omit<WaitlistEntry, "id" | "created_at" | "updated_at" | "submission_count">,
  ): Promise<{ entry: WaitlistEntry; duplicate: boolean }> {
    return this.serialize(async () => {
      const rows = (await this.load("waitlist_entries")) as unknown as WaitlistEntry[];
      const now = new Date().toISOString();
      const index = rows.findIndex((r) => r.email_hash === row.email_hash);
      if (index === -1) {
        const entry: WaitlistEntry = {
          ...row,
          id: randomUUID(),
          created_at: now,
          updated_at: now,
          submission_count: 1,
        };
        await this.append("waitlist_entries", entry as unknown as Record<string, unknown>);
        return { entry, duplicate: false };
      }
      const existing = rows[index];
      const merged = mergeWaitlist(existing, row, now);
      const next = [...rows] as unknown as Record<string, unknown>[];
      next[index] = merged as unknown as Record<string, unknown>;
      await this.rewrite("waitlist_entries", next);
      return { entry: merged, duplicate: true };
    });
  }

  async list<T extends TableName>(table: T, options: ListOptions = {}): Promise<Tables[T][]> {
    const rows = [...((await this.load(table)) as unknown as Tables[T][])];
    rows.sort((a, b) => {
      const at = String((a as { created_at: string }).created_at);
      const bt = String((b as { created_at: string }).created_at);
      return options.order === "asc" ? at.localeCompare(bt) : bt.localeCompare(at);
    });
    const offset = options.offset ?? 0;
    return rows.slice(offset, options.limit ? offset + options.limit : undefined);
  }

  async count(table: TableName): Promise<number> {
    return (await this.load(table)).length;
  }

  async counts(): Promise<Record<TableName, number>> {
    const entries = await Promise.all(
      TABLE_NAMES.map(async (t) => [t, await this.count(t)] as const),
    );
    return Object.fromEntries(entries) as Record<TableName, number>;
  }

  async coachDemand(limit = 50): Promise<DemandRow[]> {
    const searches = (await this.load("search_events")) as unknown as Tables["search_events"][];
    const requests = (await this.load(
      "coach_requests",
    )) as unknown as Tables["coach_requests"][];
    const map = new Map<string, DemandRow & { visitors: Set<string> }>();

    const bucket = (key: string, raw: string) => {
      let row = map.get(key);
      if (!row) {
        row = {
          normalized_query: key,
          raw_example: raw,
          searches: 0,
          unique_visitors: 0,
          zero_result_searches: 0,
          requests: 0,
          visitors: new Set<string>(),
        };
        map.set(key, row);
      }
      return row;
    };

    for (const s of searches) {
      if (!s.normalized_query) continue;
      const row = bucket(s.normalized_query, s.raw_query);
      row.searches += 1;
      if (s.zero_results) row.zero_result_searches += 1;
      if (s.visitor_id) row.visitors.add(s.visitor_id);
    }
    for (const r of requests) {
      const row = bucket(r.coach_name_normalized, r.coach_name);
      row.requests += 1;
      if (r.visitor_id) row.visitors.add(r.visitor_id);
    }
    return [...map.values()]
      .map(({ visitors, ...rest }) => ({ ...rest, unique_visitors: visitors.size }))
      .sort(
        (a, b) =>
          b.requests + b.unique_visitors - (a.requests + a.unique_visitors) ||
          b.searches - a.searches,
      )
      .slice(0, limit);
  }

  async eventCountsByName(): Promise<Record<string, number>> {
    const rows = (await this.load(
      "analytics_events",
    )) as unknown as Tables["analytics_events"][];
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.name] = (counts[row.name] ?? 0) + 1;
    return counts;
  }

  async funnel(): Promise<FunnelCounts> {
    return buildFunnel(await this.eventCountsByName());
  }

  async countsBy(
    table: TableName,
    column: string,
  ): Promise<{ value: string; count: number }[]> {
    const rows = (await this.load(table)) as Record<string, unknown>[];
    const counts = new Map<string, number>();
    for (const row of rows) {
      const raw = row[column];
      const values = Array.isArray(raw) ? raw : [raw];
      for (const v of values) {
        if (v === null || v === undefined || v === "") continue;
        const key = String(v);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  async deleteByEmailHash(emailHash: string): Promise<number> {
    return this.serialize(async () => {
      let removed = 0;
      for (const table of TABLE_NAMES) {
        const rows = (await this.load(table)) as Record<string, unknown>[];
        const kept = rows.filter((r) => r["email_hash"] !== emailHash);
        if (kept.length !== rows.length) {
          removed += rows.length - kept.length;
          await this.rewrite(table, kept);
        }
      }
      return removed;
    });
  }
}

/**
 * Shared by both drivers: a repeat signup keeps one row, updates the stated
 * intent (people change their minds and the latest answer is the true one) and
 * fills in any context that was previously empty without destroying the
 * first-touch attribution.
 */
export function mergeWaitlist(
  existing: WaitlistEntry,
  incoming: Omit<WaitlistEntry, "id" | "created_at" | "updated_at" | "submission_count">,
  now: string,
): WaitlistEntry {
  const fillIfEmpty = <K extends keyof WaitlistEntry>(key: K): WaitlistEntry[K] => {
    const current = existing[key];
    const next = incoming[key as keyof typeof incoming] as WaitlistEntry[K];
    const isEmpty = current === null || current === undefined || current === "";
    return isEmpty && next !== null && next !== undefined && next !== ""
      ? next
      : (current as WaitlistEntry[K]);
  };
  return {
    ...existing,
    updated_at: now,
    submission_count: existing.submission_count + 1,
    // Latest declared state wins — these are answers to "right now" questions.
    role: incoming.role || existing.role,
    primary_division: incoming.primary_division || existing.primary_division,
    intent: incoming.intent || existing.intent,
    consent_updates: incoming.consent_updates || existing.consent_updates,
    consent_at: incoming.consent_updates ? (existing.consent_at ?? now) : existing.consent_at,
    // New behavioural context is additive; first-touch attribution is preserved.
    coach_searched: fillIfEmpty("coach_searched"),
    coach_searched_normalized: fillIfEmpty("coach_searched_normalized"),
    coach_handle: fillIfEmpty("coach_handle"),
    has_paid_for_coaching: existing.has_paid_for_coaching ?? incoming.has_paid_for_coaching,
    budget_band: fillIfEmpty("budget_band"),
    decision_factor: fillIfEmpty("decision_factor"),
    acquisition_source: fillIfEmpty("acquisition_source"),
    trigger_feature: fillIfEmpty("trigger_feature"),
    trigger_coach_id: fillIfEmpty("trigger_coach_id"),
    trigger_page: fillIfEmpty("trigger_page"),
    utm_source: existing.utm_source ?? incoming.utm_source,
    utm_medium: existing.utm_medium ?? incoming.utm_medium,
    utm_campaign: existing.utm_campaign ?? incoming.utm_campaign,
    utm_term: existing.utm_term ?? incoming.utm_term,
    utm_content: existing.utm_content ?? incoming.utm_content,
    referrer: existing.referrer ?? incoming.referrer,
    landing_page: existing.landing_page ?? incoming.landing_page,
    variant: existing.variant ?? incoming.variant,
    device: incoming.device ?? existing.device,
  };
}

export function buildFunnel(counts: Record<string, number>): FunnelCounts {
  const n = (k: string) => counts[k] ?? 0;
  return {
    landing_viewed: n("landing_viewed"),
    hero_search_started: n("hero_search_started"),
    coach_search_submitted: n("coach_search_submitted"),
    coach_search_zero_results: n("coach_search_zero_results"),
    coach_profile_opened: n("coach_profile_opened"),
    feature_intent_clicks:
      n("review_feature_clicked") +
      n("ai_summary_clicked") +
      n("compare_clicked") +
      n("save_coach_clicked"),
    waitlist_started: n("waitlist_started"),
    waitlist_completed: n("waitlist_completed"),
    review_form_started: n("review_form_started"),
    review_form_completed: n("review_form_completed"),
    coach_claim_completed: n("coach_claim_completed"),
    coach_requested: n("coach_requested"),
  };
}
