"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  CheckboxField,
  FormError,
  Honeypot,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { bool, str, useFormSubmit } from "@/components/forms/use-form-submit";
import { Button, ButtonLink, Card } from "@/components/ui/primitives";
import { track } from "@/lib/analytics/client";

/**
 * "Submit a coach".
 *
 * Reached from a zero-result search with the query prefilled, or directly. A
 * submission here is the strongest demand signal the smoke test collects: a
 * named, real coach that someone wanted and we could not show them.
 */
export function CoachRequestForm() {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("coach") ?? "";
  const [notify, setNotify] = useState(false);

  const { state, submit, formRef, onFirstInteraction, isSubmitting } = useFormSubmit({
    endpoint: "/api/coach-request",
    completedEvent: "coach_requested",
    eventProps: { form: "submit-a-coach", source: prefilled ? "zero-results" : "direct" },
    serialize: (formData) => ({
      coach_name: str(formData, "coach_name") ?? "",
      team_name: str(formData, "team_name"),
      instagram: str(formData, "instagram"),
      tiktok: str(formData, "tiktok"),
      website: str(formData, "website"),
      reason: str(formData, "reason"),
      email: str(formData, "email"),
      notify: bool(formData, "notify"),
      source_query: prefilled || undefined,
      trigger_page: "/submit-a-coach",
    }),
  });

  if (state.status === "success") {
    return (
      <Card className="border-ok/40 bg-ok-bg">
        <h2 className="font-display text-2xl">Noted — thank you</h2>
        <div className="text-muted mt-4 space-y-3">
          <p>
            We&apos;ve recorded the request. Coaches who get requested most often are the ones
            we research first, so this genuinely changes what gets built.
          </p>
          <p>
            To be clear about what happens next: we will not contact this coach on your behalf,
            and we will not publish anything about them that isn&apos;t accurate and sourced.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/coaches" variant="secondary">
            Back to the directory
          </ButtonLink>
          <ButtonLink href="/review" variant="secondary">
            Review a coach you&apos;ve worked with
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onInput={onFirstInteraction}
      noValidate
      className="space-y-6"
    >
      <Honeypot />
      <FormError message={state.formError} />

      <TextField
        name="coach_name"
        label="Coach name"
        required
        defaultValue={prefilled}
        placeholder="Who were you trying to look up?"
        error={state.fieldErrors.coach_name}
      />
      <TextField
        name="team_name"
        label="Team name"
        optional
        error={state.fieldErrors.team_name}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          name="instagram"
          label="Instagram"
          optional
          placeholder="@handle"
          hint="Most useful field here."
          error={state.fieldErrors.instagram}
        />
        <TextField
          name="tiktok"
          label="TikTok"
          optional
          placeholder="@handle"
          error={state.fieldErrors.tiktok}
        />
        <TextField
          name="website"
          label="Website"
          optional
          inputMode="url"
          placeholder="theirsite.com"
          error={state.fieldErrors.website}
        />
      </div>

      <TextAreaField
        name="reason"
        label="What are you hoping to find out about them?"
        optional
        rows={4}
        hint="This tells us which questions the product actually has to answer. Please don't include accusations — we can't act on them and won't store them."
        placeholder="e.g. what their check-ins are actually like, whether they've coached my division, what's included at their price…"
        error={state.fieldErrors.reason}
      />

      <div className="border-line bg-surface-2 space-y-4 rounded-[var(--radius-card)] border p-4">
        <CheckboxField
          name="notify"
          label="Email me if this coach's profile becomes available."
          checked={notify}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            setNotify(checked);
            if (checked) track("waitlist_started", { form: "coach-request" });
          }}
        />
        {notify ? (
          <TextField
            name="email"
            label="Your email"
            type="email"
            autoComplete="email"
            required
            hint="Only used for this notification and launch updates. Never sold or shared."
            error={state.fieldErrors.email}
          />
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Sending…" : "Request this coach"}
      </Button>
    </form>
  );
}
