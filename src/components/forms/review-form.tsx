"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import { Button, ButtonLink, Card, cx } from "@/components/ui/primitives";
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

const STEPS = ["Who coached you", "The coaching", "Your experience", "Permissions"] as const;
const LAST_STEP = STEPS.length - 1;

/** Which step each validated field lives on, so a server error can jump back to it. */
const FIELD_STEP: Record<string, number> = {
  coach_name: 0,
  coach_handle: 0,
  relationship: 0,
  coaching_started: 0,
  coaching_ended: 0,
  coaching_types: 1,
  division: 1,
  monthly_price_band: 1,
  focus: 1,
  rating_overall: 2,
  rating_communication: 2,
  rating_personalization: 2,
  rating_value: 2,
  what_went_well: 2,
  what_could_improve: 2,
  would_hire_again: 2,
  email: 3,
  attestation: 3,
};

/**
 * The required answers for a step, checked before moving on. The server
 * remains the authority (lengths, content screening); this only stops someone
 * reaching the end to find an empty answer on page one.
 */
function missingOnStep(step: number, formData: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  const need = (key: string, message: string) => {
    if (!str(formData, key)) errors[key] = message;
  };
  if (step === 0) {
    need("coach_name", "Tell us who coached you.");
    need("relationship", "Choose current or former client.");
  } else if (step === 1) {
    if (strList(formData, "coaching_types").length === 0)
      errors.coaching_types = "Choose at least one.";
    need("division", "Choose your division.");
    need("focus", "Choose one option.");
  } else if (step === 2) {
    need("rating_overall", "Choose a rating.");
    need("rating_communication", "Choose a rating.");
    need("rating_personalization", "Choose a rating.");
    need("rating_value", "Choose a rating.");
    need("what_went_well", "Tell us what went well.");
    need("what_could_improve", "Tell us what could have been better.");
    need("would_hire_again", "Choose one option.");
  }
  return errors;
}

function StepProgress({
  current,
  furthest,
  onSelect,
}: {
  current: number;
  furthest: number;
  onSelect: (step: number) => void;
}) {
  return (
    <nav aria-label="Review progress">
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= furthest && !active;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(index)}
                aria-current={active ? "step" : undefined}
                className="group flex w-full flex-col items-start gap-2 text-left disabled:cursor-default"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "h-1.5 w-full rounded-full transition-colors duration-300",
                    done || active ? "bg-accent" : "bg-line",
                  )}
                />
                <span
                  className={cx(
                    "text-xs font-semibold",
                    active ? "text-paper" : "text-subtle hidden sm:block",
                    reachable && "group-hover:text-accent",
                  )}
                >
                  <span className="sr-only">
                    Step {index + 1}
                    {done ? ", completed" : ""}:{" "}
                  </span>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Section({
  step,
  current,
  title,
  description,
  headingRef,
  children,
}: {
  step: number;
  current: number;
  title: string;
  description?: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  children: React.ReactNode;
}) {
  const active = step === current;
  // Inactive steps stay mounted (hidden) so their answers are still submitted.
  return (
    <section hidden={!active} className="fade-in">
      <p className="text-accent text-xs font-bold tracking-[0.15em] uppercase">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2
        ref={active ? headingRef : undefined}
        tabIndex={-1}
        className="mt-1 text-2xl outline-none"
      >
        {title}
      </h2>
      {description ? <p className="text-muted mt-2 text-sm">{description}</p> : null}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export function ReviewForm() {
  const searchParams = useSearchParams();
  const prefilledCoach = searchParams.get("coach") ?? "";
  const demoCoachId = searchParams.get("demo") ?? undefined;

  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hasMoved, setHasMoved] = useState(false);

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

  const fieldErrors = { ...state.fieldErrors, ...stepErrors };

  // Move focus to the new step's heading, but not on first render.
  useEffect(() => {
    if (!hasMoved) return;
    headingRef.current?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step, hasMoved, formRef]);

  // A server-side field error sends the visitor back to the step it belongs to.
  // Adjusted during render (not in an effect) when a new error set arrives.
  const [seenErrors, setSeenErrors] = useState(state.fieldErrors);
  if (seenErrors !== state.fieldErrors) {
    setSeenErrors(state.fieldErrors);
    const steps = Object.keys(state.fieldErrors)
      .map((key) => FIELD_STEP[key])
      .filter((value) => value !== undefined);
    if (steps.length > 0) {
      setHasMoved(true);
      setStep(Math.min(...steps));
    }
  }

  const goTo = (next: number) => {
    setHasMoved(true);
    setStepErrors({});
    setStep(next);
    setFurthest((value) => Math.max(value, next));
  };

  const advance = () => {
    const form = formRef.current;
    if (!form) return;
    const missing = missingOnStep(step, new FormData(form));
    setStepErrors(missing);
    const first = Object.keys(missing)[0];
    if (first) {
      form
        .querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)
        ?.focus({ preventScroll: false });
      return;
    }
    goTo(step + 1);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Enter on an earlier step means "next", not "send".
    if (step < LAST_STEP) {
      event.preventDefault();
      advance();
      return;
    }
    setStepErrors({});
    void submit(event);
  };

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
      onSubmit={onSubmit}
      onInput={onFirstInteraction}
      noValidate
      className="scroll-mt-24 space-y-8"
    >
      <Honeypot />
      <StepProgress current={step} furthest={furthest} onSelect={goTo} />
      <FormError
        message={
          Object.keys(stepErrors).length > 0
            ? "Please answer the highlighted questions to continue."
            : state.formError
        }
      />

      <Section
        step={0}
        current={step}
        headingRef={headingRef}
        title="Who coached you?"
        description="Use the name you'd search for. If they coach under a team name, that's fine too."
      >
        <TextField
          name="coach_name"
          label="Coach or team name"
          required
          defaultValue={prefilledCoach}
          placeholder="e.g. their name, or the team they coach under"
          error={fieldErrors.coach_name}
        />
        <TextField
          name="coach_handle"
          label="Their Instagram or TikTok"
          optional
          placeholder="@handle"
          hint="This is the most reliable way for us to match your review to the right person."
          error={fieldErrors.coach_handle}
        />
        <FieldSet
          legend="Are you a current or former client?"
          required
          error={fieldErrors.relationship}
        >
          <RadioGroup name="relationship" options={CLIENT_RELATIONSHIPS} columns={2} />
        </FieldSet>
        <div className="field-row grid gap-5 sm:grid-cols-2">
          <TextField
            name="coaching_started"
            label="Roughly when did it start?"
            type="month"
            optional
            error={fieldErrors.coaching_started}
          />
          <TextField
            name="coaching_ended"
            label="And when did it end?"
            type="month"
            optional
            hint="Leave blank if it's ongoing."
            error={fieldErrors.coaching_ended}
          />
        </div>
      </Section>

      <Section
        step={1}
        current={step}
        headingRef={headingRef}
        title="What was the coaching?"
        description="Scope matters. A $150 training-only service and a $600 full prep service should not be judged by the same yardstick."
      >
        <FieldSet
          legend="What did the coaching cover?"
          required
          hint="Choose everything that applied."
          error={fieldErrors.coaching_types}
        >
          <CheckboxGroup name="coaching_types" options={COACHING_TYPES} columns={2} />
        </FieldSet>
        <div className="field-row grid gap-5 sm:grid-cols-2">
          <SelectField
            name="division"
            label="Your division"
            required
            options={DIVISIONS}
            error={fieldErrors.division}
          />
          <SelectField
            name="monthly_price_band"
            label="Roughly what did it cost per month?"
            optional
            options={BUDGET_BANDS}
            placeholder="Prefer not to say"
            error={fieldErrors.monthly_price_band}
          />
        </div>
        <FieldSet
          legend="Were you competing natural or enhanced at the time?"
          required
          hint="This helps us judge whether the coaching was appropriate to the context. It stays private, like everything else here."
          error={fieldErrors.focus}
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
        step={2}
        current={step}
        headingRef={headingRef}
        title="Your experience"
        description="Be specific and be fair. Describe what happened and what it was like to be coached — not what you've heard about them from other people."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <RatingField
            name="rating_overall"
            label="Overall experience"
            required
            error={fieldErrors.rating_overall}
          />
          <RatingField
            name="rating_communication"
            label="Communication"
            required
            lowLabel="Unreliable"
            highLabel="Always there"
            error={fieldErrors.rating_communication}
          />
          <RatingField
            name="rating_personalization"
            label="Personalisation"
            required
            lowLabel="Copy-paste"
            highLabel="Built for me"
            error={fieldErrors.rating_personalization}
          />
          <RatingField
            name="rating_value"
            label="Value for money"
            required
            lowLabel="Poor value"
            highLabel="Worth every penny"
            error={fieldErrors.rating_value}
          />
        </div>

        <TextAreaField
          name="what_went_well"
          label="What went well?"
          required
          rows={6}
          hint="A couple of sentences at minimum. Concrete examples are far more useful than adjectives."
          placeholder="What did they do that actually helped? How did check-ins work? What did you get that you didn't expect?"
          error={fieldErrors.what_went_well}
        />
        <TextAreaField
          name="what_could_improve"
          label="What could have been better?"
          required
          rows={6}
          hint="Please stick to your own experience of the service. We can't accept accusations of criminal or abusive conduct — if something unlawful happened, report it to the police or the federation."
          placeholder="Response times, changes you asked for, things that weren't included, how peak week or post-show was handled…"
          error={fieldErrors.what_could_improve}
        />
        <FieldSet
          legend="Would you hire them again?"
          required
          error={fieldErrors.would_hire_again}
        >
          <RadioGroup name="would_hire_again" options={WOULD_HIRE_AGAIN} columns={2} />
        </FieldSet>
      </Section>

      <Section
        step={3}
        current={step}
        headingRef={headingRef}
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
          error={fieldErrors.email}
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
            error={fieldErrors.attestation}
          />
        </div>
      </Section>

      <div className="border-line border-t pt-6">
        <div className="flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
              ← Back
            </Button>
          ) : null}
          <div className="ml-auto">
            {step < LAST_STEP ? (
              <Button type="button" onClick={advance}>
                Continue <span aria-hidden="true">→</span>
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? "Sending privately…" : "Submit privately"}
              </Button>
            )}
          </div>
        </div>
        {step === LAST_STEP ? (
          <p className="text-subtle mt-4 text-sm">{copy.reviewPrivacy}</p>
        ) : null}
      </div>
    </form>
  );
}
