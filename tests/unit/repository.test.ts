import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonFileDriver, buildFunnel, mergeWaitlist } from "@/lib/db/json-driver";
import { toCsv } from "@/lib/csv";
import type { WaitlistEntry } from "@/lib/db/types";
import { EMPTY_ATTRIBUTION } from "@/lib/db/types";

function waitlistRow(overrides: Partial<WaitlistEntry> = {}) {
  return {
    ...EMPTY_ATTRIBUTION,
    email: "person@example.com",
    email_hash: "hash-1",
    role: "athlete",
    primary_division: "bikini",
    intent: "now",
    consent_updates: true,
    consent_at: "2026-09-01T00:00:00.000Z",
    coach_searched: null,
    coach_searched_normalized: null,
    coach_handle: null,
    has_paid_for_coaching: null,
    budget_band: null,
    decision_factor: null,
    acquisition_source: null,
    trigger_page: null,
    trigger_coach_id: null,
    trigger_feature: null,
    form_source: "landing",
    visitor_id: "visitor-1",
    ...overrides,
  };
}

describe("JsonFileDriver", () => {
  let dir: string;
  let db: JsonFileDriver;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "pcr-test-"));
    db = new JsonFileDriver(dir);
    await db.init();
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("reports itself healthy and names its driver", async () => {
    expect(db.driver).toBe("json");
    expect((await db.healthcheck()).ok).toBe(true);
  });

  it("assigns an id and timestamp on insert", async () => {
    const row = await db.insert("coach_requests", {
      ...EMPTY_ATTRIBUTION,
      coach_name: "Someone",
      coach_name_normalized: "someone",
      team_name: null,
      instagram: null,
      tiktok: null,
      website: null,
      reason: null,
      email: null,
      email_hash: null,
      notify: false,
      source_query: null,
      visitor_id: "v1",
      form_source: "submit-a-coach",
    });
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.created_at).toBeTruthy();
    expect(await db.count("coach_requests")).toBe(1);
  });

  it("persists across driver instances, so a restart doesn't lose submissions", async () => {
    await db.insert("contact_submissions", {
      ...EMPTY_ATTRIBUTION,
      email: "a@example.com",
      email_hash: "h",
      topic: "general",
      message: "hello",
      visitor_id: null,
    });
    const reopened = new JsonFileDriver(dir);
    await reopened.init();
    expect(await reopened.count("contact_submissions")).toBe(1);
  });

  it("creates one waitlist row per email and merges repeat submissions", async () => {
    const first = await db.upsertWaitlist(waitlistRow());
    expect(first.duplicate).toBe(false);

    const second = await db.upsertWaitlist(
      waitlistRow({
        intent: "three-months",
        coach_searched: "A Coach",
        coach_searched_normalized: "a coach",
        trigger_feature: "ai-summary",
      }),
    );

    expect(second.duplicate).toBe(true);
    expect(second.entry.id).toBe(first.entry.id);
    expect(await db.count("waitlist_entries")).toBe(1);
    // Latest declared intent wins; new context is filled in.
    expect(second.entry.intent).toBe("three-months");
    expect(second.entry.coach_searched).toBe("A Coach");
    expect(second.entry.trigger_feature).toBe("ai-summary");
    expect(second.entry.submission_count).toBe(2);
  });

  it("keeps separate rows for different emails", async () => {
    await db.upsertWaitlist(waitlistRow());
    await db.upsertWaitlist(waitlistRow({ email: "other@example.com", email_hash: "hash-2" }));
    expect(await db.count("waitlist_entries")).toBe(2);
  });

  it("survives concurrent writes without losing a row", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        db.insert("search_events", {
          ...EMPTY_ATTRIBUTION,
          raw_query: `query ${i}`,
          normalized_query: `query ${i}`,
          result_count: i % 3,
          zero_results: i % 3 === 0,
          filters: {},
          visitor_id: `v${i}`,
          session_id: "s",
          page: "/coaches",
        }),
      ),
    );
    expect(await db.count("search_events")).toBe(25);
  });

  it("returns rows newest first by default", async () => {
    for (const name of ["first", "second", "third"]) {
      await db.insert("coach_requests", {
        ...EMPTY_ATTRIBUTION,
        coach_name: name,
        coach_name_normalized: name,
        team_name: null,
        instagram: null,
        tiktok: null,
        website: null,
        reason: null,
        email: null,
        email_hash: null,
        notify: false,
        source_query: null,
        visitor_id: null,
        form_source: "test",
      });
      // Timestamps have millisecond resolution; nudge them apart.
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    const rows = await db.list("coach_requests");
    expect(rows[0].coach_name).toBe("third");
    expect((await db.list("coach_requests", { order: "asc" }))[0].coach_name).toBe("first");
  });

  it("ranks coach demand by unique visitors and explicit requests", async () => {
    const search = (query: string, visitor: string, results: number) =>
      db.insert("search_events", {
        ...EMPTY_ATTRIBUTION,
        raw_query: query,
        normalized_query: query.toLowerCase(),
        result_count: results,
        zero_results: results === 0,
        filters: {},
        visitor_id: visitor,
        session_id: null,
        page: "/coaches",
      });

    await search("Popular Coach", "v1", 0);
    await search("Popular Coach", "v2", 0);
    await search("Popular Coach", "v3", 0);
    await search("Quiet Coach", "v4", 0);

    const demand = await db.coachDemand();
    expect(demand[0].normalized_query).toBe("popular coach");
    expect(demand[0].unique_visitors).toBe(3);
    expect(demand[0].zero_result_searches).toBe(3);
    expect(demand[0].searches).toBe(3);
  });

  it("aggregates scalar and array columns", async () => {
    await db.upsertWaitlist(waitlistRow());
    await db.upsertWaitlist(
      waitlistRow({ email: "b@example.com", email_hash: "h2", primary_division: "bikini" }),
    );
    await db.upsertWaitlist(
      waitlistRow({ email: "c@example.com", email_hash: "h3", primary_division: "wellness" }),
    );
    const byDivision = await db.countsBy("waitlist_entries", "primary_division");
    expect(byDivision[0]).toEqual({ value: "bikini", count: 2 });

    await db.insert("coach_claim_interest", {
      ...EMPTY_ATTRIBUTION,
      coach_name: "Coach",
      coach_name_normalized: "coach",
      team_name: null,
      business_email: "coach@example.com",
      email_hash: "h",
      instagram: null,
      tiktok: null,
      website: null,
      divisions: ["bikini", "wellness"],
      coaching_types: ["contest-prep"],
      focus: "both",
      monthly_price_band: null,
      accepting_clients: true,
      interests: ["claim-profile", "launch-updates"],
      demo_coach_id: null,
      consent_contact: true,
      consent_at: null,
      visitor_id: null,
    });
    const byInterest = await db.countsBy("coach_claim_interest", "interests");
    expect(byInterest.map((r) => r.value).sort()).toEqual(["claim-profile", "launch-updates"]);
  });

  it("deletes every row for an email hash, honouring a deletion request", async () => {
    await db.upsertWaitlist(waitlistRow());
    await db.insert("contact_submissions", {
      ...EMPTY_ATTRIBUTION,
      email: "person@example.com",
      email_hash: "hash-1",
      topic: "data-deletion",
      message: "please delete me",
      visitor_id: null,
    });
    expect(await db.deleteByEmailHash("hash-1")).toBe(2);
    expect(await db.count("waitlist_entries")).toBe(0);
    expect(await db.count("contact_submissions")).toBe(0);
  });

  it("ignores a torn final line rather than losing the whole file", async () => {
    await db.insert("contact_submissions", {
      ...EMPTY_ATTRIBUTION,
      email: "a@example.com",
      email_hash: "h",
      topic: "general",
      message: "hello",
      visitor_id: null,
    });
    await fs.appendFile(path.join(dir, "contact_submissions.ndjson"), '{"partial":', "utf8");
    const reopened = new JsonFileDriver(dir);
    await reopened.init();
    expect(await reopened.count("contact_submissions")).toBe(1);
  });

  it("reports zero counts for an empty database", async () => {
    const counts = await db.counts();
    expect(Object.values(counts).every((c) => c === 0)).toBe(true);
  });
});

describe("mergeWaitlist", () => {
  const existing: WaitlistEntry = {
    ...EMPTY_ATTRIBUTION,
    ...waitlistRow(),
    id: "id-1",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    submission_count: 1,
    utm_source: "reddit",
    variant: "a",
  };

  it("preserves first-touch attribution when a second submission arrives from elsewhere", () => {
    const merged = mergeWaitlist(
      existing,
      waitlistRow({ utm_source: "instagram", variant: "b" }),
      "2026-09-02T00:00:00.000Z",
    );
    expect(merged.utm_source).toBe("reddit");
    expect(merged.variant).toBe("a");
  });

  it("does not overwrite a recorded coach with a later blank", () => {
    const withCoach = { ...existing, coach_searched: "A Coach" };
    const merged = mergeWaitlist(withCoach, waitlistRow(), "2026-09-02T00:00:00.000Z");
    expect(merged.coach_searched).toBe("A Coach");
  });

  it("never downgrades consent, and keeps the original consent timestamp", () => {
    const merged = mergeWaitlist(
      existing,
      waitlistRow({ consent_updates: false }),
      "2026-09-02T00:00:00.000Z",
    );
    expect(merged.consent_updates).toBe(true);
    expect(merged.consent_at).toBe(existing.consent_at);
  });

  it("increments the submission count and updates the timestamp", () => {
    const merged = mergeWaitlist(existing, waitlistRow(), "2026-09-02T00:00:00.000Z");
    expect(merged.submission_count).toBe(2);
    expect(merged.updated_at).toBe("2026-09-02T00:00:00.000Z");
  });
});

describe("buildFunnel", () => {
  it("sums the four gate events into one feature-intent figure", () => {
    const funnel = buildFunnel({
      landing_viewed: 100,
      review_feature_clicked: 5,
      ai_summary_clicked: 3,
      compare_clicked: 2,
      save_coach_clicked: 1,
    });
    expect(funnel.landing_viewed).toBe(100);
    expect(funnel.feature_intent_clicks).toBe(11);
  });

  it("defaults missing events to zero", () => {
    expect(buildFunnel({}).waitlist_completed).toBe(0);
  });
});

describe("CSV export", () => {
  it("quotes and escapes values containing delimiters", () => {
    const csv = toCsv([{ id: "1", text: 'He said "hi", then left' }]);
    expect(csv).toContain('"He said ""hi"", then left"');
  });

  it("neutralises formula injection in exported cells", () => {
    expect(toCsv([{ id: "1", note: "=cmd|'/c calc'!A1" }])).toContain("'=cmd");
  });

  it("puts identity columns first and keeps a stable header", () => {
    const csv = toCsv([{ zebra: 1, id: "x", created_at: "t", apple: 2 }]);
    expect(csv.split("\r\n")[0]).toBe("id,created_at,apple,zebra");
  });

  it("serialises arrays and objects readably", () => {
    const csv = toCsv([{ id: "1", list: ["a", "b"], obj: { k: "v" } }]);
    expect(csv).toContain("a; b");
    expect(csv).toContain('{""k"":""v""}');
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCsv([{ id: "1", a: null, b: undefined }])).toContain("1,,");
  });

  it("handles an empty dataset without throwing", () => {
    expect(toCsv([])).toBe("\r\n");
  });
});
