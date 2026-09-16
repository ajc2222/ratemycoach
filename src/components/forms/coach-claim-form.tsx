"use client";

import { useSearchParams } from "next/navigation";

import {
  CheckboxField,
  CheckboxGroup,
  FieldSet,
  FormError,
  Honeypot,
  RadioGroup,
  SelectField,
  TextField,
} from "@/components/forms/fields";
import { bool, str, strList, triBool, useFormSubmit } from "@/components/forms/use-form-submit";
import { Button, ButtonLink, Card } from "@/components/ui/primitives";
import { copy } from "@/lib/site";
import {
  BUDGET_BANDS,
  COACHING_TYPES,
  COACH_INTERESTS,
  DIVISIONS,
  FOCUSES,
} from "@/lib/taxonomy";

/**
 * Coach listing and claim interest.
 *
 * The claim limitation is stated twice — once before the interest question and
 * once immediately above the submit button — because a coach who only discovers
 * after signing up that they cannot remove reviews is a coach who will be
 * (reasonably) angry, and that anger is exactly the risk this smoke test needs
 * to measure honestly rather than defer.
 */
export function CoachClaimForm() {
  const searchParams = useSearchParams();
  const prefilledCoach = searchParams.get("coach") ?? "";
  const demoCoachId = searchParams.get("demo") ?? undefined;

  const { state, submit, formRef, onFirstInteraction, isSubmitting } = useFormSubmit({
    endpoint: "/api/coach-claim",
    startedEvent: "coach_claim_started",
    completedEvent: "coach_claim_completed",
    eventProps: { form: "coach-claim", coach_id: demoCoachId ?? null },
    serialize: (formData) => ({
      coach_name: str(formData, "coach_name") ?? "",
      team_name: str(formData, "team_name"),
      business_email: str(formData, "business_email") ?? "",
      instagram: str(formData, "instagram"),
      tiktok: str(formData, "tiktok"),
      website: str(formData, "website"),
      divisions: strList(formData, "divisions"),
      coaching_types: strList(formData, "coaching_types"),
      focus: str(formData, "focus"),
      monthly_price_band: str(formData, "monthly_price_band"),
      accepting_clients: triBool(formData, "accepting_clients"),
      interests: strList(formData, "interests"),
      demo_coach_id: demoCoachId,
      consent_contact: bool(formData, "consent_contact"),
      trigger_page: "/for-coaches",
    }),
  });

  if (state.status === "success") {
    return (
      <Card className="border-ok/40 bg-ok-bg">
        <h2 className="font-display text-2xl">Thanks — we&apos;ve got your details</h2>
        <div className="text-muted mt-4 space-y-3">
          <p>
            You&apos;re on the coach list. We&apos;ll be in touch before anything goes live, and
            we&apos;ll show you your profile before anyone else sees it.
          </p>
          <p>
            To be direct about it: this platform exists to serve athletes deciding who to hire.
            That means we&apos;ll publish what former clients say, within our rules, whether or
            not it flatters you. What claiming gives you is accuracy and a right of reply.
          </p>
        </div>
        <div className="mt-6">
          <ButtonLink href="/methodology" variant="secondary">
            Read our moderation standards
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

      <FieldSet
        legend="What are you interested in?"
        required
        hint="Choose everything that applies."
        error={state.fieldErrors.interests}
      >
        <CheckboxGroup name="interests" options={COACH_INTERESTS} columns={2} />
      </FieldSet>

      <div className="border-accent/30 bg-accent/5 rounded-[var(--radius-card)] border p-4">
        <p className="text-muted text-sm">
          <strong className="text-paper">Before you go further:</strong> {copy.claimLimitation}
        </p>
      </div>

      <div className="field-row grid gap-5 sm:grid-cols-2">
        <TextField
          name="coach_name"
          label="Your name"
          required
          defaultValue={prefilledCoach}
          autoComplete="name"
          error={state.fieldErrors.coach_name}
        />
        <TextField
          name="team_name"
          label="Team or company"
          optional
          error={state.fieldErrors.team_name}
        />
      </div>

      <TextField
        name="business_email"
        label="Business email"
        type="email"
        required
        autoComplete="email"
        hint="We'll use this to verify you are who you say you are before any profile is handed over."
        error={state.fieldErrors.business_email}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          name="instagram"
          label="Instagram"
          optional
          placeholder="@handle"
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
          placeholder="yoursite.com"
          error={state.fieldErrors.website}
        />
      </div>

      <FieldSet
        legend="Which divisions do you coach?"
        required
        error={state.fieldErrors.divisions}
      >
        <CheckboxGroup name="divisions" options={DIVISIONS} columns={3} />
      </FieldSet>

      <FieldSet legend="What do you offer?" required error={state.fieldErrors.coaching_types}>
        <CheckboxGroup name="coaching_types" options={COACHING_TYPES} columns={2} />
      </FieldSet>

      <FieldSet
        legend="Coaching focus"
        required
        hint="Describes the athletes you work with — not a statement about anyone's personal choices."
        error={state.fieldErrors.focus}
      >
        <RadioGroup name="focus" options={FOCUSES} columns={2} />
      </FieldSet>

      <div className="field-row grid gap-5 sm:grid-cols-2">
        <SelectField
          name="monthly_price_band"
          label="Typical monthly price"
          optional
          options={BUDGET_BANDS}
          placeholder="Prefer not to say"
          error={state.fieldErrors.monthly_price_band}
        />
        <FieldSet legend="Are you taking clients?">
          <RadioGroup
            name="accepting_clients"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "Not right now" },
            ]}
            columns={2}
          />
        </FieldSet>
      </div>

      <div className="border-line bg-surface-2 rounded-[var(--radius-card)] border p-4">
        <p className="text-muted mb-4 text-sm">{copy.claimLimitation}</p>
        <CheckboxField
          name="consent_contact"
          label="You may contact me about listing or claiming a profile."
          required
          error={state.fieldErrors.consent_contact}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Sending…" : "Register my interest"}
      </Button>
    </form>
  );
}
