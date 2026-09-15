import Link from "next/link";

import { ButtonLink, Card } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <Card className="mx-auto max-w-lg text-center">
        <p className="font-display text-accent text-5xl">404</p>
        <h1 className="font-display mt-4 text-2xl">We couldn&apos;t find that page</h1>
        <p className="text-muted mt-3">
          If you were looking for a specific coach, they aren&apos;t listed yet — no real
          coaches are. Tell us who, and they go on the research list.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/coaches">Open the directory</ButtonLink>
          <ButtonLink href="/submit-a-coach" variant="secondary">
            Request a coach
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-accent underline underline-offset-4">
            Back to the home page
          </Link>
        </p>
      </Card>
    </div>
  );
}
