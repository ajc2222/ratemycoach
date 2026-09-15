"use client";

import { useEffect } from "react";

import { Button, ButtonLink, Card } from "@/components/ui/primitives";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only safe identifier to surface; the message may
    // contain internals and never reaches the visitor.
    console.error(
      JSON.stringify({ level: "error", msg: "client boundary", digest: error.digest }),
    );
  }, [error]);

  return (
    <div className="container-page py-20">
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl">Something went wrong at our end</h1>
        <p className="text-muted mt-3">
          That&apos;s our fault, not yours. Try again — and if it keeps happening, we&apos;d
          genuinely like to know.
        </p>
        {error.digest ? (
          <p className="text-subtle mt-3 text-xs">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/contact" variant="secondary">
            Tell us what happened
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
