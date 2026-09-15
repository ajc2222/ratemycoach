import type { Metadata } from "next";

import { ContactForm } from "@/components/forms/contact-form";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & data requests",
  description:
    "Get in touch with PrepCoach Reviews — general questions, corrections, coach concerns, and data access or deletion requests.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Talk to us"
            lead={`Email ${site.contactEmail}, or use the form. A person reads everything.`}
          />
          <div className="mt-8 space-y-4">
            <Card>
              <h2 className="font-display text-lg">Deleting your data</h2>
              <p className="text-muted mt-2 text-sm">
                Choose &ldquo;Delete my data&rdquo; and send it from the address you gave us.
                We&apos;ll remove your waitlist entry, any review you submitted, and any coach
                request or contact message tied to that address. We confirm when it&apos;s done,
                within 30 days and usually much sooner.
              </p>
              <p className="text-muted mt-2 text-sm">
                We handle this manually on purpose — an automatic endpoint that deleted
                everything for any address typed into it would be a way to destroy someone
                else&apos;s data.
              </p>
            </Card>
            <Card>
              <h2 className="font-display text-lg">If you&apos;re a coach</h2>
              <p className="text-muted mt-2 text-sm">
                Nothing is published about any real coach. If you have a concern about the
                concept, or want to know what claiming a profile would mean, say so here — that
                feedback is part of what we&apos;re testing, and a coach telling us this is a
                bad idea is useful data.
              </p>
            </Card>
            <Card>
              <h2 className="font-display text-lg">Something wrong on this site?</h2>
              <p className="text-muted mt-2 text-sm">
                Tell us and we&apos;ll fix it. That includes anything that reads as misleading
                about what this product currently is.
              </p>
            </Card>
          </div>
        </div>
        <Card>
          <h2 className="font-display text-xl">Send a message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
