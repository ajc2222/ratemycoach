import type { Metadata } from "next";

import { Card, Chip } from "@/components/ui/primitives";
import { getDb, type TableName } from "@/lib/db";
import { EVENT_NAMES } from "@/lib/analytics/events";
import { DIVISIONS, INTENTS, labelFor, ROLES } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Operator view",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Operator view.
 *
 * Protected by HTTP Basic in `middleware.ts` — if `ADMIN_USER`/`ADMIN_PASSWORD`
 * are unset the route returns 503 rather than rendering, so this page can never
 * be reached anonymously. It is `noindex`, disallowed in robots.txt and absent
 * from the sitemap.
 *
 * It shows *counts and rankings*, plus recent rows with sensitive fields
 * abbreviated. The full data lives behind the CSV export, which requires the
 * same credentials.
 */

const DATASETS: { table: TableName; label: string; note: string }[] = [
  { table: "waitlist_entries", label: "Waitlist", note: "Deduplicated by email" },
  { table: "private_review_submissions", label: "Private reviews", note: "Never published" },
  { table: "coach_claim_interest", label: "Coach interest", note: "Listing and claims" },
  { table: "coach_requests", label: "Coach requests", note: "Missing-coach demand" },
  { table: "search_events", label: "Searches", note: "Includes zero-result terms" },
  { table: "analytics_events", label: "Events", note: "Behavioural stream" },
  { table: "contact_submissions", label: "Messages", note: "Incl. deletion requests" },
];

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-subtle text-xs tracking-wide uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl">{value}</p>
      {note ? <p className="text-subtle mt-1 text-xs">{note}</p> : null}
    </Card>
  );
}

function Rate({ numerator, denominator }: { numerator: number; denominator: number }) {
  if (denominator === 0) return <span className="text-subtle">—</span>;
  const pct = (numerator / denominator) * 100;
  return <span className="text-paper font-medium">{pct.toFixed(1)}%</span>;
}

function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-subtle py-6 text-sm">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="border-line text-subtle border-b py-2 pr-4 text-left text-xs font-semibold tracking-wide uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((value, cellIndex) => (
                <td key={cellIndex} className="border-line/60 text-muted border-b py-2 pr-4">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminPage() {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    return (
      <div className="container-page py-12">
        <Card className="border-danger/50 bg-danger-bg">
          <h1 className="font-display text-danger text-xl">Database unavailable</h1>
          <p className="text-muted mt-2 text-sm">{(error as Error).message}</p>
        </Card>
      </div>
    );
  }

  const [counts, funnel, demand, eventCounts, waitlist, reviews, claims, requests, searches] =
    await Promise.all([
      db.counts(),
      db.funnel(),
      db.coachDemand(25),
      db.eventCountsByName(),
      db.list("waitlist_entries", { limit: 15 }),
      db.list("private_review_submissions", { limit: 10 }),
      db.list("coach_claim_interest", { limit: 10 }),
      db.list("coach_requests", { limit: 10 }),
      db.list("search_events", { limit: 15 }),
    ]);

  const [byDivision, byIntent, byRole, bySource] = await Promise.all([
    db.countsBy("waitlist_entries", "primary_division"),
    db.countsBy("waitlist_entries", "intent"),
    db.countsBy("waitlist_entries", "role"),
    db.countsBy("waitlist_entries", "utm_source"),
  ]);

  const visitors = funnel.landing_viewed;
  const featureClicks = funnel.feature_intent_clicks;
  const zeroResultSearches = searches.filter((s) => s.zero_results).length;

  return (
    <div className="container-page py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Operator view</h1>
          <p className="text-subtle mt-1 text-sm">
            Storage driver: <strong className="text-muted">{db.driver}</strong> · Generated{" "}
            {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DATASETS.map((dataset) => (
            <a
              key={dataset.table}
              href={`/admin/export/${dataset.table}`}
              className="border-line text-muted hover:border-accent hover:text-accent inline-flex min-h-9 items-center rounded-[var(--radius-control)] border px-3 py-1.5 text-xs"
            >
              ↓ {dataset.label}.csv
            </a>
          ))}
        </div>
      </header>

      <section className="mt-8" aria-labelledby="totals">
        <h2 id="totals" className="font-display mb-3 text-xl">
          Collected
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {DATASETS.map((dataset) => (
            <Stat
              key={dataset.table}
              label={dataset.label}
              value={counts[dataset.table] ?? 0}
              note={dataset.note}
            />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="funnel">
        <h2 id="funnel" className="font-display mb-3 text-xl">
          Funnel
        </h2>
        <Card>
          <Table
            headers={["Step", "Count", "Of landing views", "Threshold"]}
            rows={[
              ["Landing viewed", visitors, "—", "≥300 qualified"],
              [
                "Search started",
                funnel.hero_search_started,
                <Rate key="s" numerator={funnel.hero_search_started} denominator={visitors} />,
                "≥20%",
              ],
              [
                "Search submitted",
                funnel.coach_search_submitted,
                <Rate
                  key="ss"
                  numerator={funnel.coach_search_submitted}
                  denominator={visitors}
                />,
                "—",
              ],
              [
                "Zero-result searches",
                funnel.coach_search_zero_results,
                <Rate
                  key="z"
                  numerator={funnel.coach_search_zero_results}
                  denominator={Math.max(funnel.coach_search_submitted, 1)}
                />,
                "of searches",
              ],
              [
                "Profile opened",
                funnel.coach_profile_opened,
                <Rate key="p" numerator={funnel.coach_profile_opened} denominator={visitors} />,
                "≥10%",
              ],
              [
                "Feature-intent clicks",
                featureClicks,
                <Rate key="f" numerator={featureClicks} denominator={visitors} />,
                "—",
              ],
              [
                "Waitlist completed",
                funnel.waitlist_completed,
                <Rate key="w" numerator={funnel.waitlist_completed} denominator={visitors} />,
                "8–12%",
              ],
              [
                "Review started",
                funnel.review_form_started,
                <Rate key="rs" numerator={funnel.review_form_started} denominator={visitors} />,
                "≥5%",
              ],
              [
                "Review completed",
                funnel.review_form_completed,
                <Rate
                  key="rc"
                  numerator={funnel.review_form_completed}
                  denominator={visitors}
                />,
                "≥10 total",
              ],
              [
                "Coach claim completed",
                funnel.coach_claim_completed,
                <Rate
                  key="c"
                  numerator={funnel.coach_claim_completed}
                  denominator={visitors}
                />,
                "≥5 total",
              ],
              [
                "Coach requested",
                funnel.coach_requested,
                <Rate key="cr" numerator={funnel.coach_requested} denominator={visitors} />,
                "—",
              ],
            ]}
            empty="No events recorded yet."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="evidence-demand">
        <h2 id="evidence-demand" className="font-display mb-3 text-xl">
          Which evidence layer do people want?
        </h2>
        <Card>
          <Table
            headers={["Feature", "Clicks", "Share of feature intent"]}
            rows={[
              [
                "Client reviews",
                eventCounts.review_feature_clicked ?? 0,
                <Rate
                  key="a"
                  numerator={eventCounts.review_feature_clicked ?? 0}
                  denominator={featureClicks}
                />,
              ],
              [
                "AI public-source summary",
                eventCounts.ai_summary_clicked ?? 0,
                <Rate
                  key="b"
                  numerator={eventCounts.ai_summary_clicked ?? 0}
                  denominator={featureClicks}
                />,
              ],
              [
                "Compare coaches",
                eventCounts.compare_clicked ?? 0,
                <Rate
                  key="c"
                  numerator={eventCounts.compare_clicked ?? 0}
                  denominator={featureClicks}
                />,
              ],
              [
                "Save coach",
                eventCounts.save_coach_clicked ?? 0,
                <Rate
                  key="d"
                  numerator={eventCounts.save_coach_clicked ?? 0}
                  denominator={featureClicks}
                />,
              ],
            ]}
            empty="No feature-gate clicks yet."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="demand">
        <h2 id="demand" className="font-display mb-1 text-xl">
          Coach demand ranking
        </h2>
        <p className="text-subtle mb-3 text-sm">
          Searched and requested coach names, normalised and ranked by unique visitors plus
          explicit requests. This is the research queue.
        </p>
        <Card>
          <Table
            headers={[
              "Normalised term",
              "As typed",
              "Searches",
              "Unique visitors",
              "Zero-result",
              "Requests",
            ]}
            rows={demand.map((row) => [
              row.normalized_query,
              row.raw_example,
              row.searches,
              row.unique_visitors,
              row.zero_result_searches,
              row.requests,
            ])}
            empty="No searches or coach requests yet."
          />
        </Card>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2" aria-labelledby="segments">
        <h2 id="segments" className="sr-only">
          Segments
        </h2>
        <Card>
          <h3 className="font-display mb-3 text-lg">Waitlist by division</h3>
          <Table
            headers={["Division", "Count"]}
            rows={byDivision.map((row) => [labelFor(DIVISIONS, row.value), row.count])}
            empty="No waitlist entries yet."
          />
        </Card>
        <Card>
          <h3 className="font-display mb-3 text-lg">Waitlist by intent</h3>
          <Table
            headers={["Intent", "Count"]}
            rows={byIntent.map((row) => [labelFor(INTENTS, row.value), row.count])}
            empty="No waitlist entries yet."
          />
        </Card>
        <Card>
          <h3 className="font-display mb-3 text-lg">Waitlist by role</h3>
          <Table
            headers={["Role", "Count"]}
            rows={byRole.map((row) => [labelFor(ROLES, row.value), row.count])}
            empty="No waitlist entries yet."
          />
        </Card>
        <Card>
          <h3 className="font-display mb-3 text-lg">Waitlist by channel</h3>
          <Table
            headers={["utm_source", "Count"]}
            rows={bySource.map((row) => [row.value, row.count])}
            empty="No tagged traffic yet."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="recent-reviews">
        <h2 id="recent-reviews" className="font-display mb-1 text-xl">
          Recent private reviews
        </h2>
        <p className="text-subtle mb-3 text-sm">
          Stored privately, never published. Full text is in the CSV export.
        </p>
        <Card>
          <Table
            headers={["When", "Coach", "Division", "Overall", "Publish?", "Contact?", "Flags"]}
            rows={reviews.map((review) => [
              shortDate(review.created_at),
              review.coach_name,
              labelFor(DIVISIONS, review.division),
              `${review.rating_overall}/5`,
              review.permission_publish ? "Yes" : "No",
              review.permission_contact ? "Yes" : "No",
              review.screening_flags.length > 0 ? (
                <Chip tone="demo">{review.screening_flags.join(", ")}</Chip>
              ) : (
                "—"
              ),
            ])}
            empty="No reviews submitted yet. This is the number that decides the project."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="recent-coaches">
        <h2 id="recent-coaches" className="font-display mb-3 text-xl">
          Recent coach interest
        </h2>
        <Card>
          <Table
            headers={["When", "Name", "Team", "Interests", "Divisions"]}
            rows={claims.map((claim) => [
              shortDate(claim.created_at),
              claim.coach_name,
              claim.team_name ?? "—",
              claim.interests.join(", "),
              claim.divisions.length,
            ])}
            empty="No coaches have registered interest yet."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="recent-requests">
        <h2 id="recent-requests" className="font-display mb-3 text-xl">
          Recent coach requests
        </h2>
        <Card>
          <Table
            headers={["When", "Coach", "Instagram", "Notify?", "From search"]}
            rows={requests.map((request) => [
              shortDate(request.created_at),
              request.coach_name,
              request.instagram ? `@${request.instagram}` : "—",
              request.notify ? "Yes" : "No",
              request.source_query ?? "—",
            ])}
            empty="No coach requests yet."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="recent-searches">
        <h2 id="recent-searches" className="font-display mb-1 text-xl">
          Recent searches
        </h2>
        <p className="text-subtle mb-3 text-sm">
          {zeroResultSearches} of the last {searches.length} returned nothing.
        </p>
        <Card>
          <Table
            headers={["When", "Query", "Normalised", "Results", "Channel"]}
            rows={searches.map((search) => [
              shortDate(search.created_at),
              search.raw_query,
              search.normalized_query,
              search.zero_results ? <Chip tone="demo">0</Chip> : search.result_count,
              search.utm_source ?? "direct",
            ])}
            empty="No searches recorded yet."
          />
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="recent-waitlist">
        <h2 id="recent-waitlist" className="font-display mb-3 text-xl">
          Recent waitlist entries
        </h2>
        <Card>
          <Table
            headers={["When", "Role", "Division", "Intent", "Trigger", "Channel", "Repeat"]}
            rows={waitlist.map((entry) => [
              shortDate(entry.created_at),
              labelFor(ROLES, entry.role),
              entry.primary_division
                ? labelFor(DIVISIONS, entry.primary_division)
                : "Not provided",
              labelFor(INTENTS, entry.intent),
              entry.trigger_feature ?? entry.form_source,
              entry.utm_source ?? "direct",
              entry.submission_count > 1 ? `×${entry.submission_count}` : "—",
            ])}
            empty="No waitlist entries yet."
          />
        </Card>
        <p className="text-subtle mt-3 text-xs">
          Email addresses are deliberately not rendered here. They are in the CSV export, which
          requires the same credentials.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="event-coverage">
        <h2 id="event-coverage" className="font-display mb-1 text-xl">
          Event coverage
        </h2>
        <p className="text-subtle mb-3 text-sm">
          Every event in the specification. A zero here after real traffic means the
          instrumentation is broken, not that nobody did it.
        </p>
        <Card>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_NAMES.map((name) => (
              <li key={name} className="flex items-center justify-between gap-2 text-sm">
                <code className="text-muted">{name}</code>
                <span
                  className={
                    (eventCounts[name] ?? 0) > 0 ? "text-ok font-medium" : "text-subtle"
                  }
                >
                  {eventCounts[name] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
