"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  CheckboxField,
  CheckboxGroup,
  FieldSet,
  FormError,
  Honeypot,
  RadioGroup,
  RatingField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { bool, str, strList, useFormSubmit } from "@/components/forms/use-form-submit";
import { Button, ButtonLink, Card } from "@/components/ui/primitives";
import { copy } from "@/lib/site";
import {
  BUDGET_BANDS,
  CLIENT_RELATIONSHIPS,
  COACHING_TYPES,
  DIVISIONS,
  WOULD_HIRE_AGAIN,
} from "@/lib/taxonomy";

/**
 * The private founding-review form.
 *
 * This is the hardest thing to ask for and the most valuable thing to receive,
 * so the design does three things deliberately:
 *   - it states what happens to the submission *before* the first field;
 *   - it asks for structure (ratings, dates, scope) so the answer is usable,
 *     not just a paragraph of feeling;
 *   - it separates "may we contact you" from "may we publish this", because
 *     bundling those two consents would make both of them meaningless.
 */

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line border-t pt-8 first:border-0 first:pt-0">
      <p className="text-accent text-xs font-semibold tracking-[0.15em] uppercase">
        Section {step} of 4
      </p>
      <h2 className="font-display mt-1 text-xl">{title}</h2>
      {description ? <p className="text-muted mt-2 text-sm">{description}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function ReviewForm() {
  const searchParams = useSearchParams();
  const prefilledCoach = searchParams.get("coach") ?? "";
  const demoCoachId = searchParams.get("demo") ?? undefined;

  const { state, submit, formRef, onFirstInteraction, isSubmitting } = useFormSubmit({
    endpoint: "/api/review",
    startedEvent: "review_form_started",
    completedEvent: "review_form_completed",
    eventProps: { form: "review", coach_id: demoCoachId ?? null },
    serialize: (formData) => ({
      coach_name: str(formData, "coach_name") ?? "",
      coach_handle: str(formData, "coach_handle"),
      demo_coach_id: demoCoachId,
      relationship: str(formData, "relationship"),
      coaching_started: str(formData, "coaching_started"),
      coaching_ended: str(formData, "coaching_ended"),
      coaching_types: strList(formData, "coaching_types"),
      division: str(formData, "division"),
      focus: str(formData, "focus"),
      monthly_price_band: str(formData, "monthly_price_band"),
      rating_overall: str(formData, "rating_overall"),
      rating_communication: str(formData, "rating_communication"),
      rating_personalization: str(formData, "rating_personalization"),
      rating_value: str(formData, "rating_value"),
      what_went_well: str(formData, "what_went_well") ?? "",
      what_could_improve: str(formData, "what_could_improve") ?? "",
      would_hire_again: str(formData, "would_hire_again"),
      permission_contact: bool(formData, "permission_contact"),
      permission_publish: bool(formData, "permission_publish"),
      attestation: bool(formData, "attestation"),
      email: str(formData, "email") ?? "",
      join_founding_reviewers: bool(formData, "join_founding_reviewers"),
      trigger_page: "/review",
    }),
  });

  if (state.status === "success") {
    return (
      <Card className="border-ok/40 bg-ok-bg">
        <h2 className="font-display text-2xl">Thank you — that&apos;s genuinely useful</h2>
        <div className="text-muted mt-4 space-y-3">
          <p>
            Your review has been stored privately. It is not published, it is not visible to
            anyone but us, and it will not appear anywhere without passing moderation and
            verification first — and then only if you gave permission.
          </p>
          <p>
            If you told us we could contact you, we may email once to ask a follow-up question
            about your experience. That&apos;s it.
          </p>
          <p>
            Changed your mind? Email us and we&apos;ll delete it — see{" "}
            <Link href="/privacy" className="text-accent underline underline-offset-4">
              the privacy notice
            </Link>
            .
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/coaches" variant="secondary">
            Back to the directory
          </ButtonLink>
          <ButtonLink href="/waitlist" variant="secondary">
            Join the waitlist
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
      className="space-y-8"
    >
      <Honeypot />
      <FormError message={state.formError} />

      <Section
        step={1}
        title="Who coached you?"
        description="Use the name you'd search for. If they coach under a team name, that's fine too."
      >
        <TextField
          name="coach_name"
          label="Coach or team name"
          required
          defaultValue={prefilledCoach}
          placeholder="e.g. their name, or the team they coach under"
          error={state.fieldErrors.coach_name}
        />
        <TextField
          name="coach_handle"
          label="Their Instagram or TikTok"
          optional
          placeholder="@handle"
          hint="This is the most reliable way for us to match your review to the right person."
          error={state.fieldErrors.coach_handle}
        />
        <FieldSet
          legend="Are you a current or former client?"
          required
          error={state.fieldErrors.relationship}
        >
          <RadioGroup name="relationship" options={CLIENT_RELATIONSHIPS} columns={2} />
        </FieldSet>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="coaching_started"
            label="Roughly when did it start?"
            type="month"
            optional
            error={state.fieldErrors.coaching_started}
          />
          <TextField
            name="coaching_ended"
            label="And when did it end?"
            type="month"
            optional
            hint="Leave blank if it's ongoing."
            error={state.fieldErrors.coaching_ended}
          />
        </div>
      </Section>

      <Section
        step={2}
        title="What was the coaching?"
        description="Scope matters. A £150 training-only service and a £600 full prep service should not be judged by the same yardstick."
      >
        <FieldSet
          legend="What did the coaching cover?"
          required
          hint="Choose everything that applied."
          error={state.fieldErrors.coaching_types}
        >
          <CheckboxGroup name="coaching_types" options={COACHING_TYPES} columns={2} />
        </FieldSet>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="division"
            label="Your division"
            required
            options={DIVISIONS}
            error={state.fieldErrors.division}
          />
          <SelectField
            name="monthly_price_band"
            label="Roughly what did it cost per month?"
            optional
            options={BUDGET_BANDS}
            placeholder="Prefer not to say"
            error={state.fieldErrors.monthly_price_band}
          />
        </div>
        <FieldSet
          legend="Were you competing natural or enhanced at the time?"
          required
          hint="This helps us judge whether the coaching was appropriate to the context. It stays private, like everything else here."
          error={state.fieldErrors.focus}
        >
          <RadioGroup
            name="focus"
            options={[
              { value: "natural", label: "Natural" },
              { value: "enhanced", label: "Enhanced" },
              { value: "not-applicable", label: "Prefer not to say / not applicable" },
            ]}
          />
        </FieldSet>
      </Section>

      <Section
        step={3}
        title="Your experience"
        description="Be specific and be fair. Describe what happened and what it was like to be coached — not what you've heard about them from other people."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <RatingField
            name="rating_overall"
            label="Overall experience"
            required
            error={state.fieldErrors.rating_overall}
          />
          <RatingField
            name="rating_communication"
            label="Communication"
            required
            lowLabel="Unreliable"
            highLabel="Always there"
            error={state.fieldErrors.rating_communication}
          />
          <RatingField
            name="rating_personalization"
            label="Personalisation"
            required
            lowLabel="Copy-paste"
            highLabel="Built for me"
            error={state.fieldErrors.rating_personalization}
          />
          <RatingField
            name="rating_value"
            label="Value for money"
            required
            lowLabel="Poor value"
            highLabel="Worth every penny"
            error={state.fieldErrors.rating_value}
          />
        </div>

        <TextAreaField
          name="what_went_well"
          label="What went well?"
          required
          rows={6}
          hint="A couple of sentences at minimum. Concrete examples are far more useful than adjectives."
          placeholder="What did they do that actually helped? How did check-ins work? What did you get that you didn't expect?"
          error={state.fieldErrors.what_went_well}
        />
        <TextAreaField
          name="what_could_improve"
          label="What could have been better?"
          required
          rows={6}
          hint="Please stick to your own experience of the service. We can't accept accusations of criminal or abusive conduct — if something unlawful happened, report it to the police or the federation."
          placeholder="Response times, changes you asked for, things that weren't included, how peak week or post-show was handled…"
          error={state.fieldErrors.what_could_improve}
        />
        <FieldSet
          legend="Would you hire them again?"
          required
          error={state.fieldErrors.would_hire_again}
        >
          <RadioGroup name="would_hire_again" options={WOULD_HIRE_AGAIN} columns={2} />
        </FieldSet>
      </Section>

      <Section
        step={4}
        title="Permissions and contact"
        description="Two separate questions, deliberately. Neither is ticked for you."
      >
        <TextField
          name="email"
          label="Your email"
          type="email"
          required
          autoComplete="email"
          hint="Used to verify your review is real and to contact you if you allow it. It is never shown publicly and never attached to a published review."
          error={state.fieldErrors.email}
        />
        <CheckboxField
          name="permission_contact"
          label="You may contact me about this review."
          hint="One follow-up email at most, to ask a clarifying question."
        />
        <CheckboxField
          name="permission_publish"
          label="You may consider this review for publication after moderation and verification."
          hint="If you leave this unticked your review stays private permanently and is used only to help us understand whether this platform should exist."
        />
        <CheckboxField
          name="join_founding_reviewers"
          label="Add me to the founding-reviewer list."
          hint="You'll hear when the review system opens."
        />
        <div className="border-line bg-surface-2 rounded-[var(--radius-control)] border p-4">
          <CheckboxField
            name="attestation"
            label="I confirm this is my own firsthand experience as a paying client, and that it is accurate to the best of my knowledge."
            required
            error={state.fieldErrors.attestation}
          />
        </div>
      </Section>

      <div className="border-line flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Sending privately…" : "Submit privately"}
        </Button>
        <p className="text-subtle text-sm">{copy.reviewPrivacy}</p>
      </div>
    </form>
  );
}
