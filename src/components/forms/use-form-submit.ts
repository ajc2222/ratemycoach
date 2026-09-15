"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSessionId, track } from "@/lib/analytics/client";
import type { EventName } from "@/lib/analytics/events";

/**
 * Shared client-side submit behaviour for every form on the site.
 *
 * What it guarantees, so no individual form has to remember:
 *  - entered values survive an error (the form element is never re-rendered
 *    from scratch, and nothing is cleared on failure);
 *  - the "started" analytics event fires exactly once, on first interaction;
 *  - the elapsed time and session id are attached for the bot traps;
 *  - field errors from the server are surfaced and focus moves to the first
 *    invalid control, which is what makes a long form recoverable.
 */

export interface SubmitState {
  status: "idle" | "submitting" | "success" | "error";
  formError: string | null;
  fieldErrors: Record<string, string>;
  result: { id?: string | null; duplicate?: boolean } | null;
}

const INITIAL: SubmitState = {
  status: "idle",
  formError: null,
  fieldErrors: {},
  result: null,
};

export interface UseFormSubmitOptions {
  endpoint: string;
  startedEvent?: EventName;
  completedEvent?: EventName;
  /** Extra analytics properties attached to the completed event. */
  eventProps?: Record<string, string | number | boolean | null>;
  /** Turns the raw FormData into the JSON body the endpoint expects. */
  serialize: (formData: FormData) => Record<string, unknown>;
  onSuccess?: (result: { id?: string | null; duplicate?: boolean }) => void;
}

export function useFormSubmit({
  endpoint,
  startedEvent,
  completedEvent,
  eventProps,
  serialize,
  onSuccess,
}: UseFormSubmitOptions) {
  const [state, setState] = useState<SubmitState>(INITIAL);
  const mountedAt = useRef(0);
  const startedFired = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  /** Fire the "started" event on the first real interaction, never on render. */
  const handleFirstInteraction = useCallback(() => {
    if (startedFired.current || !startedEvent) return;
    startedFired.current = true;
    track(startedEvent, eventProps ?? {});
  }, [startedEvent, eventProps]);

  const focusFirstError = useCallback((fieldErrors: Record<string, string>) => {
    const form = formRef.current;
    if (!form) return;
    const firstKey = Object.keys(fieldErrors)[0];
    if (!firstKey) return;
    const control = form.querySelector<HTMLElement>(
      `[name="${CSS.escape(firstKey)}"], [data-field="${CSS.escape(firstKey)}"]`,
    );
    control?.focus();
    control?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      setState({ status: "submitting", formError: null, fieldErrors: {}, result: null });

      const formData = new FormData(form);
      const body = {
        ...serialize(formData),
        website_url: String(formData.get("website_url") ?? ""),
        elapsed_ms: Date.now() - mountedAt.current,
        session_id: getSessionId(),
      };

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const payload = (await response.json().catch(() => null)) as
          | { ok: true; data: { id?: string | null; duplicate?: boolean } }
          | { ok: false; error: string; fieldErrors?: Record<string, string> }
          | null;

        if (response.ok && payload && payload.ok) {
          if (completedEvent) {
            track(completedEvent, {
              ...eventProps,
              duplicate: payload.data?.duplicate ?? false,
            });
          }
          setState({
            status: "success",
            formError: null,
            fieldErrors: {},
            result: payload.data ?? null,
          });
          onSuccess?.(payload.data ?? {});
          return;
        }

        const fieldErrors = (payload && !payload.ok && payload.fieldErrors) || {};
        const message =
          (payload && !payload.ok && payload.error) ||
          "Something went wrong. Please try again.";
        setState({ status: "error", formError: message, fieldErrors, result: null });
        // Let the error render before moving focus into it.
        requestAnimationFrame(() => focusFirstError(fieldErrors));
      } catch {
        setState({
          status: "error",
          formError:
            "We couldn't reach the server. Check your connection — your answers are still here.",
          fieldErrors: {},
          result: null,
        });
      }
    },
    [endpoint, serialize, completedEvent, eventProps, onSuccess, focusFirstError],
  );

  const reset = useCallback(() => {
    setState(INITIAL);
    mountedAt.current = Date.now();
  }, []);

  return {
    state,
    submit,
    reset,
    formRef,
    onFirstInteraction: handleFirstInteraction,
    isSubmitting: state.status === "submitting",
  };
}

/* ------------------------------------------------------------------ */
/* FormData helpers — the serialisers in each form are built on these. */
/* ------------------------------------------------------------------ */

export function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function strList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

/** Tri-state: a radio group that may legitimately be left unanswered. */
export function triBool(formData: FormData, key: string): boolean | undefined {
  const value = formData.get(key);
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

export function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
