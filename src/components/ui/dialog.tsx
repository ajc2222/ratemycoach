"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";

import { cx } from "./primitives";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog.
 *
 * Deliberately hand-rolled rather than pulled from a component library: the app
 * needs exactly one dialog pattern, and this keeps the production dependency
 * list at four packages. It implements the APG dialog pattern — focus moves in
 * on open, is trapped while open, Escape closes, and focus returns to whatever
 * opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = labelledBy ?? `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    target?.focus();

    document.addEventListener("keydown", handleKeyDown, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="bg-navy/55 fade-in fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(
          "border-line bg-surface max-sm:sheet-in sm:fade-in relative w-full max-w-lg rounded-t-2xl border p-5 shadow-2xl",
          "sm:rounded-[var(--radius-card)] sm:p-6",
          "max-h-[92vh] overflow-y-auto",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:bg-surface-2 hover:text-paper -m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)]"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
            <span className="sr-only">Close</span>
          </button>
        </div>
        {description ? (
          <div id={descriptionId} className="text-muted mt-3 text-sm">
            {description}
          </div>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
