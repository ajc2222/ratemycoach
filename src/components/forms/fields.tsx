"use client";

import { useId, type ReactNode } from "react";

import { cx } from "@/components/ui/primitives";
import type { Option } from "@/lib/taxonomy";

/**
 * Form primitives.
 *
 * Every control here is a real, labelled HTML control. Errors are wired with
 * `aria-describedby` + `aria-invalid`, required state is programmatic as well
 * as visual, and nothing relies on colour alone. Consent checkboxes are never
 * given a `defaultChecked`.
 */

const CONTROL =
  "w-full rounded-[var(--radius-control)] border bg-ink px-3.5 py-2.5 text-paper " +
  "placeholder:text-subtle transition-colors min-h-11 " +
  "border-line-strong hover:border-muted focus:border-accent";

const CONTROL_ERROR = "border-danger hover:border-danger focus:border-danger";

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-subtle mt-1.5 text-sm">
      {children}
    </p>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-danger mt-1.5 flex items-start gap-1.5 text-sm">
      <span aria-hidden="true">!</span>
      <span>{children}</span>
    </p>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  required,
  optional,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-paper mb-1.5 block text-sm font-semibold">
      {children}
      {required ? (
        <span className="text-accent ml-1" aria-hidden="true">
          *
        </span>
      ) : null}
      {optional ? <span className="text-subtle ml-2 font-normal">Optional</span> : null}
    </label>
  );
}

interface BaseFieldProps {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
}

export function TextField({
  name,
  label,
  hint,
  error,
  required,
  optional,
  type = "text",
  ...rest
}: BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div>
      <FieldLabel htmlFor={id} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cx(CONTROL, error && CONTROL_ERROR)}
        {...rest}
      />
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  error,
  required,
  optional,
  rows = 5,
  ...rest
}: BaseFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div>
      <FieldLabel htmlFor={id} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cx(CONTROL, "min-h-28 resize-y leading-relaxed", error && CONTROL_ERROR)}
        {...rest}
      />
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  required,
  optional,
  options,
  placeholder = "Choose one…",
  defaultValue,
  ...rest
}: BaseFieldProps & {
  options: readonly Option[];
  /** Label for the disabled first option. Not a real `placeholder` attribute. */
  placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "placeholder">) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div>
      <FieldLabel htmlFor={id} required={required} optional={optional}>
        {label}
      </FieldLabel>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cx(CONTROL, "appearance-none pr-10", error && CONTROL_ERROR)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%23A7A79E' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.9rem center",
        }}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  error,
  required,
  ...rest
}: BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
          {...rest}
        />
        <label htmlFor={id} className="text-paper cursor-pointer text-sm leading-relaxed">
          {label}
          {required ? (
            <span className="text-accent ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      </div>
      {hint ? (
        <div className="pl-8">
          <Hint id={hintId}>{hint}</Hint>
        </div>
      ) : null}
      {error ? (
        <div className="pl-8">
          <ErrorText id={errorId}>{error}</ErrorText>
        </div>
      ) : null}
    </div>
  );
}

export function FieldSet({
  legend,
  hint,
  error,
  children,
  required,
  className,
}: {
  legend: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <fieldset
      className={cx("min-w-0", className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="text-paper mb-1.5 text-sm font-semibold">
        {legend}
        {required ? (
          <span className="text-accent ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      {hint ? <p className="text-subtle mb-2 text-sm">{hint}</p> : null}
      {children}
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </fieldset>
  );
}

export function RadioGroup({
  name,
  options,
  columns = 1,
}: {
  name: string;
  options: readonly Option[];
  columns?: 1 | 2;
}) {
  return (
    <div className={cx("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
      {options.map((option) => (
        <label
          key={option.value}
          className="border-line bg-ink hover:border-muted has-checked:border-accent has-checked:bg-accent/5 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3.5 py-2 text-sm"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            className="size-4 shrink-0 accent-[var(--color-accent)]"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function CheckboxGroup({
  name,
  options,
  columns = 2,
}: {
  name: string;
  options: readonly Option[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cx(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="border-line bg-ink hover:border-muted has-checked:border-accent has-checked:bg-accent/5 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3.5 py-2 text-sm"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            className="size-4 shrink-0 accent-[var(--color-accent)]"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * 1–5 rating as a radio group with visible numeric labels. Not stars: an
 * icon-only control is harder to operate with a keyboard, harder to read with a
 * screen reader, and invites the kind of impressionistic rating that makes
 * review data useless.
 */
export function RatingField({
  name,
  label,
  hint,
  error,
  lowLabel = "Poor",
  highLabel = "Excellent",
  required,
}: BaseFieldProps & { lowLabel?: string; highLabel?: string }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="text-paper mb-1.5 text-sm font-semibold">
        {label}
        {required ? (
          <span className="text-accent ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      {hint ? <p className="text-subtle mb-2 text-sm">{hint}</p> : null}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            className="border-line bg-ink hover:border-muted has-checked:border-accent has-checked:bg-accent has-checked:text-accent-ink flex size-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border text-sm font-semibold"
          >
            <input type="radio" name={name} value={value} className="sr-only" />
            <span aria-hidden="true">{value}</span>
            <span className="sr-only">
              {value} out of 5
              {value === 1 ? ` — ${lowLabel}` : value === 5 ? ` — ${highLabel}` : ""}
            </span>
          </label>
        ))}
      </div>
      <div className="text-subtle mt-1.5 flex justify-between text-xs">
        <span>1 — {lowLabel}</span>
        <span>5 — {highLabel}</span>
      </div>
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </fieldset>
  );
}

/**
 * Honeypot. Hidden from people (off-screen, not `display:none`, which some bots
 * detect), excluded from the accessibility tree and from tab order.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website_url">Website (leave this empty)</label>
      <input
        id="website_url"
        name="website_url"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

/** Top-of-form error summary, announced to assistive technology. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="border-danger/50 bg-danger-bg text-danger rounded-[var(--radius-control)] border px-4 py-3 text-sm"
    >
      {message}
    </div>
  );
}
