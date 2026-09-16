"use client";

import Link from "next/link";
import { useState } from "react";

import {
  CheckboxField,
  FieldSet,
  FormError,
  Honeypot,
  RadioGroup,
  SelectField,
  TextField,
} from "@/components/forms/fields";
import { bool, str, triBool, useFormSubmit } from "@/components/forms/use-form-submit";
import { Button, cx } from "@/components/ui/primitives";
import { labelFor } from "@/lib/taxonomy";
import {
  ACQUISITION_SOURCES,
  BUDGET_BANDS,
  DECISION_FACTORS,
  DIVISIONS,
  GATED_FEATURES,
  INTENTS,
  ROLES,
} from "@/lib/taxonomy";

export interface WaitlistFormProps {
  /** Where the form was rendered — used for the funnel breakdown. */
  formSource: string;
  /** Prefilled when the visitor reached this from a specific coach or feature. */
  triggerCoachId?: string | null;
  triggerCoachName?: string | null;
  triggerFeature?: string | null;
  triggerPage?: string | null;
  defaultDivision?: string;
  /** Compact layout for the dialog; full layout for the dedicated page. */
  compact?: boolean;
  onCompleted?: () => void;
}

export function WaitlistForm({
  formSource,
  triggerCoachId = null,
  triggerCoachName = null,
  triggerFeature = null,
  triggerPage = null,
  defaultDivision,
  compact = false,
  onCompleted,
}: WaitlistFormProps) {
  const [showOptional, setShowOptional] = useState(!compact);

  const { state, submit, formRef, onFirstInteraction, isSubmitting } = useFormSubmit({
    endpoint: "/api/waitlist",
    startedEvent: "waitlist_started",
    completedEvent: "waitlist_completed",
    eventProps: {
      form: formSource,
      feature: triggerFeature,
      coach_id: triggerCoachId,
    },
    onSuccess: onCompleted,
    serialize: (formData) => ({
      email: str(formData, "email") ?? "",
      role: str(formData, "role"),
      primary_division: str(formData, "primary_division"),
      intent: str(formData, "intent"),
      consent_updates: bool(formData, "consent_updates"),
      coach_searched: str(formData, "coach_searched"),
      coach_handle: str(formData, "coach_handle"),
      has_paid_for_coaching: triBool(formData, "has_paid_for_coaching"),
      budget_band: str(formData, "budget_band"),
      decision_factor: str(formData, "decision_factor"),
      acquisition_source: str(formData, "acquisition_source"),
      form_source: formSource,
      trigger_page: triggerPage ?? undefined,
      trigger_coach_id: triggerCoachId ?? undefined,
      trigger_feature: triggerFeature ?? undefined,
    }),
  });

  if (state.status === "success") {
    return (
      <div
        className="border-ok/40 bg-ok-bg rounded-[var(--radius-card)] border p-5"
        role="status"
      >
        <h3 className="text-paper text-lg">
          {state.result?.duplicate ? "You're already on the list" : "You're on the list"}
        </h3>
        <p className="text-muted mt-2 text-sm">
          {state.result?.duplicate
            ? "We've updated your entry with what you told us this time. You'll hear from us once — when there's something real to show you."
            : "We'll email you once there's something real to show you. No drip sequence, no reselling your address."}
        </p>
        {triggerCoachName ? (
          <p className="text-muted mt-2 text-sm">
            We’ve noted that you were looking into{" "}
            <strong className="text-paper">{triggerCoachName}</strong>.
          </p>
        ) : null}
        <p className="mt-4 text-sm">
          <Link
            href="/review"
            className="text-accent hover:text-accent-hover underline underline-offset-4"
          >
            Coached before? Write the review you wish you’d been able to read →
          </Link>
        </p>
      </div>
    );
  }

  const featureLabel = triggerFeature
    ? labelFor(GATED_FEATURES, triggerFeature).toLowerCase()
    : null;

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onInput={onFirstInteraction}
      noValidate
      className="space-y-5"
    >
      <Honeypot />
      <FormError message={state.formError} />

      {featureLabel ? (
        <p className="border-line bg-surface-2 text-muted rounded-[var(--radius-control)] border px-4 py-3 text-sm">
          We’ll tell you when <strong className="text-paper">{featureLabel}</strong> is ready
          {triggerCoachName ? (
            <>
              {" "}
              and note that you were researching{" "}
              <strong className="text-paper">{triggerCoachName}</strong>
            </>
          ) : null}
          .
        </p>
      ) : null}

      <TextField
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={state.fieldErrors.email}
      />

      <div className={cx("field-row grid gap-5", !compact && "sm:grid-cols-2")}>
        <SelectField
          name="role"
          label="Which best describes you?"
          required
          options={ROLES}
          error={state.fieldErrors.role}
        />
        <SelectField
          name="primary_division"
          label="Primary division or interest"
          required
          options={DIVISIONS}
          defaultValue={defaultDivision}
          error={state.fieldErrors.primary_division}
        />
      </div>

      <FieldSet legend="Where are you right now?" required error={state.fieldErrors.intent}>
        <RadioGroup name="intent" options={INTENTS} columns={compact ? 1 : 2} />
      </FieldSet>

      {triggerCoachName ? (
        <input type="hidden" name="coach_searched" value={triggerCoachName} />
      ) : null}

      {compact ? (
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
          className="text-accent hover:text-accent-hover text-sm underline underline-offset-4"
        >
          {showOptional ? "Hide optional questions" : "Add a bit more detail (optional)"}
        </button>
      ) : null}

      {showOptional ? (
        <div className="border-line space-y-5 border-t pt-5">
          {!compact ? (
            <p className="text-subtle text-sm">
              Everything below is optional. It helps us build the right thing first.
            </p>
          ) : null}

          {!triggerCoachName ? (
            <div className={cx("field-row grid gap-5", !compact && "sm:grid-cols-2")}>
              <TextField
                name="coach_searched"
                label="A coach you're researching"
                optional
                placeholder="Name or team"
                error={state.fieldErrors.coach_searched}
              />
              <TextField
                name="coach_handle"
                label="Their Instagram or TikTok"
                optional
                placeholder="@handle"
                error={state.fieldErrors.coach_handle}
              />
            </div>
          ) : (
            <TextField
              name="coach_handle"
              label="Their Instagram or TikTok"
              optional
              placeholder="@handle"
              error={state.fieldErrors.coach_handle}
            />
          )}

          <FieldSet legend="Have you paid for online coaching before?">
            <RadioGroup
              name="has_paid_for_coaching"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              columns={2}
            />
          </FieldSet>

          <div className={cx("field-row grid gap-5", !compact && "sm:grid-cols-2")}>
            <SelectField
              name="budget_band"
              label="Budget you have in mind"
              optional
              options={BUDGET_BANDS}
              placeholder="Prefer not to say"
              error={state.fieldErrors.budget_band}
            />
            <SelectField
              name="decision_factor"
              label="What matters most to you?"
              optional
              options={DECISION_FACTORS}
              placeholder="Prefer not to say"
              error={state.fieldErrors.decision_factor}
            />
          </div>

          <SelectField
            name="acquisition_source"
            label="Where did you hear about us?"
            optional
            options={ACQUISITION_SOURCES}
            placeholder="Prefer not to say"
            error={state.fieldErrors.acquisition_source}
          />
        </div>
      ) : null}

      <CheckboxField
        name="consent_updates"
        label="Email me when PrepCoach Reviews launches."
        hint="One launch email. No newsletter, no partners, no selling your address. Unsubscribe any time."
        required
        error={state.fieldErrors.consent_updates}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Adding you…" : "Join the waitlist"}
        </Button>
        <p className="text-subtle text-xs">
          See our{" "}
          <Link href="/privacy" className="hover:text-muted underline underline-offset-2">
            privacy notice
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
