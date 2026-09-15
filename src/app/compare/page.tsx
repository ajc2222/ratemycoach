import type { Metadata } from "next";

import { CoachAvatar } from "@/components/coach-card";
import { GateButton } from "@/components/feature-gate";
import { Card, Chip, DemoBadge, SectionHeading } from "@/components/ui/primitives";
import { DEMO_COACHES } from "@/data/demo-coaches";
import { priceRangeLabel } from "@/lib/search";
import { COACHING_TYPES, DELIVERY, DIVISIONS, labelFor, labelsFor } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Coach comparison preview",
  description:
    "A preview of how side-by-side coach comparison will work on PrepCoach Reviews. The profiles shown are fictional demonstrations.",
  alternates: { canonical: "/compare" },
  robots: { index: true, follow: false },
};

/** Two demonstration coaches chosen to contrast on price, scope and focus. */
const LEFT = DEMO_COACHES[0];
const RIGHT = DEMO_COACHES[8];

const ROWS: {
  label: string;
  value: (coach: (typeof DEMO_COACHES)[number]) => React.ReactNode;
}[] = [
  { label: "Team", value: (c) => c.team ?? "Independent" },
  { label: "Divisions", value: (c) => labelsFor(DIVISIONS, c.divisions).join(", ") },
  {
    label: "Services",
    value: (c) => labelsFor(COACHING_TYPES, c.coachingTypes).join(", "),
  },
  {
    label: "Focus",
    value: (c) =>
      c.focus === "both"
        ? "Natural & enhanced"
        : c.focus === "natural"
          ? "Natural"
          : "Enhanced",
  },
  { label: "Monthly price", value: (c) => priceRangeLabel(c.priceMin, c.priceMax) },
  { label: "Delivery", value: (c) => labelFor(DELIVERY, c.delivery) },
  { label: "Taking clients", value: (c) => (c.acceptingClients ? "Yes" : "Not currently") },
  { label: "Years coaching", value: (c) => `${c.yearsCoaching}` },
  {
    label: "Client reviews",
    value: () => <span className="text-subtle">Not collected yet</span>,
  },
  {
    label: "Public-source summary",
    value: () => <span className="text-subtle">Not generated yet</span>,
  },
];

const GATE_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] " +
  "bg-accent px-5 py-2.5 font-semibold text-accent-ink transition-colors hover:bg-accent-hover";

export default function ComparePage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <SectionHeading
        eyebrow="Comparison preview"
        title="Two coaches, side by side"
        lead="Comparing coaches on what they actually offer — rather than on whose client photos look best — is the point of the product. This is a static preview built from two demonstration profiles; choosing your own coaches to compare isn't built yet."
      />

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">
            Comparison of two fictional demonstration coach profiles
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border-line w-40 border-b p-3 text-left align-bottom">
                <span className="sr-only">Attribute</span>
              </th>
              {[LEFT, RIGHT].map((coach) => (
                <th key={coach.id} scope="col" className="border-line border-b p-3 text-left">
                  <div className="flex items-center gap-3">
                    <CoachAvatar initials={coach.initials} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-semibold">
                          {coach.name}
                        </span>
                        <DemoBadge />
                      </div>
                      <span className="text-subtle text-xs font-normal">{coach.location}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="align-top">
                <th
                  scope="row"
                  className="border-line text-subtle border-b p-3 text-left font-normal"
                >
                  {row.label}
                </th>
                {[LEFT, RIGHT].map((coach) => (
                  <td key={coach.id} className="border-line text-muted border-b p-3">
                    {row.value(coach)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="border-demo/40 bg-demo-bg mt-8">
        <p className="text-demo text-sm">
          <strong className="font-semibold">Both columns are demonstration profiles.</strong>{" "}
          The coaches, teams and details above are invented to show the layout. No ratings or
          reviews appear because none have been collected.
        </p>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl">
              Want to compare coaches you&apos;re considering?
            </h2>
            <p className="text-muted mt-2 text-sm">
              Choosing your own coaches to compare is one of the first things we&apos;ll build
              if this validates. Tell us which two you&apos;d put side by side.
            </p>
          </div>
          <GateButton feature="compare" page="/compare" className={GATE_BUTTON}>
            Compare my coaches
          </GateButton>
        </div>
      </Card>

      <ul className="mt-6 flex flex-wrap gap-2">
        {[LEFT, RIGHT].map((coach) => (
          <li key={coach.id}>
            <Chip>{coach.name} — demonstration profile</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}
