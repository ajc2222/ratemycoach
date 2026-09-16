import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CoachAvatar, FocusChip } from "@/components/coach-card";
import {
  AiSummaryCard,
  ProfileActionPanel,
  ProfileFooterCta,
  ReviewEvidenceCard,
  SocialLinks,
} from "@/components/coach-profile-actions";
import { PageViewTracker } from "@/components/page-view-tracker";
import { Card, Chip, DemoBanner, ScoreBlock } from "@/components/ui/primitives";
import { DEMO_COACHES, getDemoCoach } from "@/data/demo-coaches";
import { priceRangeLabel } from "@/lib/search";
import {
  COACHING_TYPES,
  DELIVERY,
  DIVISIONS,
  FEDERATIONS,
  labelFor,
  labelsFor,
} from "@/lib/taxonomy";

export function generateStaticParams() {
  return DEMO_COACHES.map((coach) => ({ slug: coach.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/coaches/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const coach = getDemoCoach(slug);
  if (!coach) return { title: "Profile not found" };
  return {
    title: `${coach.name} — demonstration profile`,
    description: `A fictional demonstration profile showing how coach profiles will be laid out on PrepCoach Reviews. ${coach.name} is not a real coach.`,
    // Demonstration profiles must never be indexed as if they represented real
    // professionals, and must never appear in a search result for a real name.
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: `/coaches/${coach.slug}` },
  };
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-line border-b py-3 last:border-0 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-subtle text-sm">{label}</dt>
      <dd className="text-paper mt-1 text-sm sm:col-span-2 sm:mt-0">{value}</dd>
    </div>
  );
}

export default async function CoachProfilePage({ params }: PageProps<"/coaches/[slug]">) {
  const { slug } = await params;
  const coach = getDemoCoach(slug);
  if (!coach) notFound();

  return (
    <div className="container-page py-8 sm:py-12">
      <PageViewTracker
        event="coach_profile_opened"
        props={{ coach_id: coach.id, coach_slug: coach.slug, page: `/coaches/${coach.slug}` }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link href="/coaches" className="text-muted hover:text-paper font-semibold">
          ← Directory preview
        </Link>
      </nav>

      <DemoBanner className="mb-8" />

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <ScoreBlock size="lg" className="order-last sm:order-first" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <CoachAvatar initials={coach.initials} />
                <h1 className="text-4xl sm:text-5xl">{coach.name}</h1>
              </div>
              {coach.team ? (
                <p className="text-muted mt-2 text-lg font-medium">{coach.team}</p>
              ) : null}
              <p className="text-subtle mt-1 text-sm">
                {coach.location} · {coach.yearsCoaching} years coaching (demonstration data)
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip tone={coach.acceptingClients ? "ok" : "neutral"}>
                  {coach.acceptingClients ? "Taking clients" : "Not taking clients"}
                </Chip>
                <Chip>{labelFor(DELIVERY, coach.delivery)}</Chip>
                <Chip tone={coach.claimed ? "accent" : "muted"}>
                  {coach.claimed ? "Profile claimed" : "Profile unclaimed"}
                </Chip>
                <FocusChip focus={coach.focus} />
              </div>
              <div className="mt-4">
                <SocialLinks coach={coach} />
              </div>
            </div>
          </header>

          <section className="mt-10" aria-labelledby="about">
            <h2 id="about" className="text-2xl">
              About this coach
            </h2>
            <p className="text-muted mt-3">{coach.bio}</p>
          </section>

          <section className="mt-10" aria-labelledby="details">
            <h2 id="details" className="text-2xl">
              Coaching details
            </h2>
            <dl className="mt-4">
              <FactRow
                label="Divisions coached"
                value={labelsFor(DIVISIONS, coach.divisions).join(", ")}
              />
              <FactRow
                label="Federations"
                value={labelsFor(FEDERATIONS, coach.federations).join(", ")}
              />
              <FactRow
                label="Services"
                value={labelsFor(COACHING_TYPES, coach.coachingTypes).join(", ")}
              />
              <FactRow label="Specialties" value={coach.specialties.join(" · ")} />
              <FactRow
                label="Natural / enhanced focus"
                value={
                  coach.focus === "both"
                    ? "Works with both natural and enhanced athletes"
                    : coach.focus === "natural"
                      ? "Natural athletes only"
                      : "Enhanced athletes"
                }
              />
              <FactRow label="Delivery" value={labelFor(DELIVERY, coach.delivery)} />
              <FactRow
                label="Typical monthly price"
                value={`${priceRangeLabel(coach.priceMin, coach.priceMax)} (illustrative, not an offer)`}
              />
              <FactRow
                label="Accepting clients"
                value={coach.acceptingClients ? "Yes" : "Not currently"}
              />
              <FactRow
                label="Profile status"
                value={
                  coach.claimed
                    ? "Claimed by the coach in this demonstration"
                    : "Unclaimed in this demonstration"
                }
              />
            </dl>
          </section>

          <div className="mt-10 space-y-4">
            <ReviewEvidenceCard coach={coach} />
            <AiSummaryCard coach={coach} />
          </div>

          <ProfileFooterCta />
        </div>

        {/* Sticky action rail on desktop; inline below the fold on mobile. */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card>
              <h2 className="text-lg">Actions</h2>
              <p className="text-muted mt-2 mb-4 text-sm">
                These are the things you&apos;ll be able to do here. Two of them work today.
              </p>
              <ProfileActionPanel coach={coach} />
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
