"use client";

import {
  FormError,
  Honeypot,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { str, useFormSubmit } from "@/components/forms/use-form-submit";
import { Button, Card } from "@/components/ui/primitives";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "data-deletion", label: "Delete my data" },
  { value: "data-access", label: "Send me a copy of my data" },
  { value: "coach", label: "I'm a coach with a question or concern" },
  { value: "correction", label: "Something on this site is wrong" },
  { value: "press", label: "Press or research" },
] as const;

export function ContactForm() {
  const { state, submit, formRef, isSubmitting } = useFormSubmit({
    endpoint: "/api/contact",
    serialize: (formData) => ({
      email: str(formData, "email") ?? "",
      topic: str(formData, "topic"),
      message: str(formData, "message") ?? "",
      trigger_page: "/contact",
    }),
  });

  if (state.status === "success") {
    return (
      <Card className="border-ok/40 bg-ok-bg">
        <h2 className="font-display text-xl">Message received</h2>
        <p className="text-muted mt-3">
          We read everything. Deletion and data-access requests are handled within 30 days and
          usually much sooner.
        </p>
      </Card>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      <Honeypot />
      <FormError message={state.formError} />
      <TextField
        name="email"
        label="Your email"
        type="email"
        required
        autoComplete="email"
        hint="So we can reply. For a deletion request, use the address you originally gave us."
        error={state.fieldErrors.email}
      />
      <SelectField
        name="topic"
        label="What's this about?"
        required
        options={TOPICS}
        error={state.fieldErrors.topic}
      />
      <TextAreaField
        name="message"
        label="Message"
        required
        rows={6}
        error={state.fieldErrors.message}
      />
      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
