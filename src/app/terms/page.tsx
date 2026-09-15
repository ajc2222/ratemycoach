import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & disclaimers",
  description:
    "Terms of use and prelaunch disclaimers for PrepCoach Reviews, including the status of demonstration profiles and submitted reviews.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "15 September 2026";

export default function TermsPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="prose-page mx-auto">
        <h1 className="text-3xl sm:text-4xl">Terms and disclaimers</h1>
        <p className="text-subtle mt-2 text-sm">Last updated {LAST_UPDATED}</p>

        <Card className="border-demo/40 bg-demo-bg my-8">
          <h2 className="font-display text-demo mt-0 text-lg">Prelaunch disclosures</h2>
          <ul className="text-demo/90 mt-3 mb-0 space-y-1.5 text-sm">
            <li>{site.name} is in early validation and has not launched.</li>
            <li>All coach profiles shown are fictional demonstrations, not real coaches.</li>
            <li>Reviews submitted now are private and are not published.</li>
            <li>No AI summaries are generated from live forum or social data.</li>
            <li>This site does not provide medical, nutritional or pharmacological advice.</li>
            <li>We are not affiliated with any bodybuilding federation.</li>
            <li>Future public content will be moderated before publication.</li>
            <li>No coaching outcome can be guaranteed by us or by any coach.</li>
            <li>
              &ldquo;Natural&rdquo; and &ldquo;enhanced&rdquo; describe a coach&apos;s stated
              coaching focus. They are not claims about any individual athlete&apos;s drug use.
            </li>
          </ul>
        </Card>

        <h2>1. What this site is</h2>
        <p>
          {site.name} is a prelaunch website used to test whether an independent coach discovery
          and review platform should be built. It is an information and research tool. It is not
          a marketplace, it does not broker or process coaching services, and it takes no part
          in any agreement between you and a coach.
        </p>

        <h2>2. Demonstration content</h2>
        <p>
          Every coach profile currently on this site is fictional and labelled as a
          demonstration. The names, teams, biographies, handles, prices and details are invented
          to illustrate how the interface will work. Any resemblance to a real person or
          business is unintended. No ratings, reviews, client outcomes or testimonials appear
          anywhere on this site, for fictional or real people.
        </p>

        <h2>3. Reviews you submit</h2>
        <p>
          By submitting a review you confirm it describes your own firsthand experience as a
          client and is accurate to the best of your knowledge. You keep ownership of what you
          write. You grant us permission to store it and — only if you separately tick the
          publication permission, and only after moderation and verification — to publish it in
          whole or in part, without your email address.
        </p>
        <p>We will not accept or store submissions that:</p>
        <ul>
          <li>describe someone else&apos;s experience rather than your own;</li>
          <li>accuse a named person of a crime, abuse or other unlawful conduct;</li>
          <li>contain other people&apos;s personal or contact information;</li>
          <li>contain threats, harassment or abuse;</li>
          <li>are knowingly false, or are submitted to damage a competitor.</li>
        </ul>
        <p>
          If something unlawful has happened, please report it to the police or the relevant
          federation. We are not an investigative or enforcement body.
        </p>

        <h2>4. Coaches</h2>
        <p>
          Registering interest does not create a listing, a contract or an obligation on either
          side. If profiles go live, claiming one will let you correct factual information and
          publicly reply to reviews. Claiming a profile will not allow you to alter ratings or
          remove legitimate reviews, and no payment will ever buy that.
        </p>
        <p>
          If you believe something published about you is inaccurate,{" "}
          <Link href="/contact">contact us</Link> and we will review it against our{" "}
          <Link href="/methodology">moderation standards</Link>.
        </p>

        <h2>5. No professional advice</h2>
        <p>
          Nothing on this site is medical, nutritional, pharmacological, psychological or
          financial advice. Competitive bodybuilding involves extreme dieting and training and
          carries real health risks. Consult an appropriately qualified professional before
          making decisions about your health. Reviews are individual opinions and experiences,
          not clinical assessments.
        </p>

        <h2>6. No guarantees</h2>
        <p>
          We make no guarantee about the accuracy, completeness or usefulness of information on
          this site, about any coach&apos;s services, or about any physique, health or
          competitive outcome. Your choice of coach, and your agreement with them, is entirely
          between you and them.
        </p>

        <h2>7. Independence</h2>
        <p>
          We are not affiliated with, endorsed by or connected to the IFBB, NPC, WNBF, OCB,
          INBF, UKBFF, CPA or any other federation, nor with any coach, team or brand.
          Federation names are used only to describe where coaches have experience. If we ever
          accept money for promoted placement it will be labelled where it appears and will
          never affect reviews, ratings or moderation.
        </p>

        <h2>8. Acceptable use</h2>
        <p>
          Don&apos;t submit false information, don&apos;t attempt to flood or automate the
          forms, don&apos;t attempt to access data you aren&apos;t entitled to, and don&apos;t
          use this site to harass anyone. We may refuse or remove any submission and restrict
          access where these terms are broken.
        </p>

        <h2>9. Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any loss arising from
          your use of this site or from any coaching relationship you enter into. Nothing here
          limits liability that cannot lawfully be limited, including for death or personal
          injury caused by negligence, or for fraud.
        </p>

        <h2>10. Changes</h2>
        <p>
          This is an evolving prelaunch project and these terms may change. Material changes
          will be reflected in the date above.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions, corrections and complaints: <strong>{site.contactEmail}</strong> or the{" "}
          <Link href="/contact">contact form</Link>. See also our{" "}
          <Link href="/privacy">privacy notice</Link> and{" "}
          <Link href="/methodology">methodology</Link>.
        </p>
      </div>
    </div>
  );
}
