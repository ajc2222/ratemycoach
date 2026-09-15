import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What PrepCoach Reviews collects during early validation, why, how long it is kept, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "15 September 2026";

export default function PrivacyPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="prose-page mx-auto">
        <h1 className="text-3xl sm:text-4xl">Privacy notice</h1>
        <p className="text-subtle mt-2 text-sm">Last updated {LAST_UPDATED}</p>

        <p className="text-muted mt-6 text-lg">
          {site.name} is a prelaunch validation site. We collect as little as we can get away
          with, and this page tells you exactly what that is.
        </p>

        <Card className="my-8">
          <h2 className="font-display mt-0 text-lg">The short version</h2>
          <ul className="mt-3 mb-0 space-y-1.5 text-sm">
            <li>We ask for your email only where you choose to give it.</li>
            <li>We never sell, rent or share your email with anyone.</li>
            <li>We don&apos;t run third-party advertising or tracking scripts.</li>
            <li>We don&apos;t store your IP address.</li>
            <li>Reviews you submit are private and are never published automatically.</li>
            <li>Email us and we&apos;ll delete everything we hold about you.</li>
          </ul>
        </Card>

        <h2>Who we are</h2>
        <p>
          {site.name} is an independent prelaunch project. For any privacy question, or to
          exercise any right below, contact <strong>{site.contactEmail}</strong> or use the{" "}
          <Link href="/contact">contact form</Link>.
        </p>

        <h2>What we collect, and why</h2>

        <h3>If you join the waitlist</h3>
        <p>
          Your email address, the role you selected, your division or interest, where you are in
          the process, and any optional details you chose to add (a coach you&apos;re
          researching, their handle, whether you&apos;ve paid for coaching before, a budget
          band, what matters most to you, and where you heard about us).
        </p>
        <p>
          <strong>Why:</strong> to email you at launch, and to understand who wants this and
          what to build first. <strong>Lawful basis:</strong> your consent, which you give by
          ticking the box — it is never pre-ticked.
        </p>

        <h3>If you submit a review</h3>
        <p>
          Your email, the coach or team name and handle, the dates and scope of the coaching,
          your division, your ratings, your written account, and your answers to the two
          permission questions.
        </p>
        <p>
          <strong>Why:</strong> to understand whether former clients will share firsthand
          experiences, and — only with your explicit permission, and only after moderation and
          verification — to publish at launch.{" "}
          <strong>We do not ask for and do not want documents, receipts or screenshots</strong>{" "}
          during validation, because we have not built somewhere appropriate to keep them.
        </p>

        <h3>If you request a coach or register as a coach</h3>
        <p>
          The coach or business details you type in, and your email if you provide one. Coaches
          give us a business email and public business information.
        </p>

        <h3>Searches</h3>
        <p>
          When you search the directory we store the search term, a normalised version of it,
          how many results it returned, and which filters were applied. We store this because it
          is the core question of this validation: which coaches do people actually want to
          research? Search terms are stored privately and are never published, and they are
          never sent to any analytics provider.
        </p>

        <h3>Analytics</h3>
        <p>
          We record which pages were viewed and which buttons were pressed, with an anonymous
          visitor identifier, an experiment variant, a coarse device type (mobile, tablet or
          desktop) and any campaign tags in the link you arrived from.
        </p>
        <p>
          <strong>
            We do not send names, email addresses, review text or search terms to analytics
          </strong>{" "}
          — the server enforces a strict allow-list of permitted properties, so it is not
          possible for the site to record them even by mistake.
        </p>

        <h3>Cookies</h3>
        <p>We set three first-party cookies. None are used for advertising.</p>
        <ul>
          <li>
            <code>pcr_vid</code> — a random anonymous visitor identifier so we can tell repeat
            visits from new ones. Contains no personal data. 180 days.
          </li>
          <li>
            <code>pcr_var</code> — which version of the landing page you were shown, so it stays
            consistent. 180 days.
          </li>
          <li>
            <code>pcr_attr</code> — the campaign tags and referring site from your first visit,
            so we can tell which channels bring people who care. 30 days.
          </li>
        </ul>
        <p>
          We also use your browser&apos;s session storage for a per-tab session identifier,
          which is discarded when you close the tab.
        </p>

        <h3>What we deliberately do not collect</h3>
        <ul>
          <li>
            Your IP address. It is used in memory to rate-limit form submissions, hashed with a
            secret salt, and never written to storage.
          </li>
          <li>Precise location, device fingerprints, or cross-site tracking identifiers.</li>
          <li>Special-category data. Please don&apos;t send us health or medical details.</li>
          <li>Anything about anyone other than you.</li>
        </ul>

        <h2>Who we share it with</h2>
        <p>
          Nobody, for marketing purposes — ever. Data is held in our database (PostgreSQL,
          hosted by Supabase) and the site is served by Vercel. Those providers process data on
          our instructions as infrastructure. We may use a privacy-focused analytics provider
          that does not use cookies and receives no personal data. We will disclose information
          if we are legally required to.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>
            <strong>Waitlist entries:</strong> until launch plus 12 months, or until you ask us
            to delete them.
          </li>
          <li>
            <strong>Review submissions:</strong> until this validation concludes, plus 12
            months. If the project is abandoned, review submissions are deleted.
          </li>
          <li>
            <strong>Search and analytics events:</strong> 24 months. They contain no direct
            identifiers.
          </li>
          <li>
            <strong>Coach and contact submissions:</strong> 24 months.
          </li>
        </ul>

        <h2>Your rights</h2>
        <p>
          Depending on where you live (including under the UK GDPR, EU GDPR and CCPA) you have
          the right to access a copy of your data, correct it, delete it, restrict or object to
          processing, take it elsewhere, and withdraw consent at any time.
        </p>
        <p>
          <strong>To exercise any of these, email {site.contactEmail}</strong> from the address
          you gave us, or use the <Link href="/contact">contact form</Link> and select the
          relevant option. We will respond within 30 days, and normally within a few days.
          Withdrawing consent does not affect processing that already happened.
        </p>
        <p>
          Deletion is handled by a person rather than an automatic button, deliberately: an
          unauthenticated &ldquo;delete everything for this email address&rdquo; endpoint would
          itself be a way to destroy someone else&apos;s data.
        </p>

        <h2>Security</h2>
        <p>
          Submissions are stored in a private database that is not reachable from the public
          internet, and no public page or API on this site returns review text, email addresses
          or coach contact details. Operator access requires authentication. We hash email
          addresses for use in logs so that our own logs never contain them.
        </p>

        <h2>Children</h2>
        <p>
          This site is not intended for anyone under 16. If you believe a child has given us
          information, email us and we will delete it.
        </p>

        <h2>Changes</h2>
        <p>
          If this notice changes materially we will update the date above and, where it affects
          data we already hold about you, tell you by email.
        </p>
      </div>
    </div>
  );
}
