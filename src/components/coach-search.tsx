"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { CoachAvatar } from "@/components/coach-card";
import { cx } from "@/components/ui/primitives";
import { DEMO_COACHES } from "@/data/demo-coaches";
import { matchesQuery, normalizeQuery } from "@/lib/search";
import { DIVISIONS, labelFor } from "@/lib/taxonomy";

const MAX_SUGGESTIONS = 5;

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cx("size-5 shrink-0", className)}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm10.5 3-5.2-5.2"
      />
    </svg>
  );
}

/**
 * Search field with live suggestions from the demonstration set.
 *
 * It stays an `<input type="search">` (role `searchbox`) and uses
 * `aria-activedescendant` for the highlighted suggestion, so the surrounding
 * form keeps submitting exactly as before: Enter with nothing highlighted
 * submits the search, which is what records the demand signal. Picking a
 * suggestion just opens that profile.
 *
 * `/` focuses the field from anywhere on the page, unless someone is typing.
 */
export function CoachSearchField({
  id,
  value,
  onValueChange,
  onInput,
  placeholder = "Search by coach, team, Instagram, or TikTok handle",
  label = "Search by coach, team, Instagram, or TikTok handle",
  source,
  variant = "palette",
  anchorToForm = false,
  className,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Called on every keystroke; callers de-duplicate their own analytics. */
  onInput?: () => void;
  placeholder?: string;
  label?: string;
  /** Carried to the profile URL so an opened suggestion is attributable. */
  source: string;
  /** `bare` leaves the surrounding box to the caller (the hero). */
  variant?: "palette" | "pill" | "bare";
  /**
   * Position the suggestion list against the nearest positioned ancestor
   * instead of the field, so it drops below a submit button that stacks under
   * the field on phones rather than covering it.
   */
  anchorToForm?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const suggestions = useMemo(() => {
    if (normalizeQuery(value).length < 2) return [];
    return DEMO_COACHES.filter((coach) => matchesQuery(coach, value)).slice(0, MAX_SUGGESTIONS);
  }, [value]);

  const showList = focused && normalizeQuery(value).length >= 2;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const open = (slug: string) => {
    setFocused(false);
    router.push(`/coaches/${slug}?from=${encodeURIComponent(source)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList || suggestions.length === 0) {
      if (event.key === "Escape") setFocused(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setFocused(false);
      setActive(-1);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      open(suggestions[active].slug);
    }
  };

  const optionId = (index: number) => `${listId}-opt-${index}`;

  return (
    <div className={cx(anchorToForm ? "static" : "relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cx(
          "flex items-center gap-2.5 transition-[background-color,box-shadow,border-color] duration-200",
          variant === "palette" &&
            "border-line bg-surface-2 focus-within:border-line-strong focus-within:bg-surface min-h-12 rounded-[10px] border pr-2.5 pl-3.5 focus-within:shadow-[var(--shadow-card)]",
          variant === "pill" && "bg-surface text-paper h-10 rounded-full pr-3 pl-3.5",
          variant === "bare" && "px-3",
        )}
      >
        <SearchIcon className="text-muted" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          name="q"
          value={value}
          onChange={(event) => {
            onValueChange(event.currentTarget.value);
            onInput?.();
            setFocused(true);
            setActive(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          aria-describedby={showList ? `${listId}-status` : undefined}
          className={cx(
            "text-paper placeholder:text-subtle w-full flex-1 bg-transparent outline-none focus-visible:outline-none",
            variant === "pill" ? "h-10 text-sm" : "min-h-12 py-2",
          )}
        />
        {variant === "palette" ? (
          <kbd
            aria-hidden="true"
            className="border-line-strong bg-surface text-muted hidden rounded-[5px] border px-1.5 py-0.5 font-mono text-xs font-semibold sm:inline"
          >
            /
          </kbd>
        ) : null}
      </div>

      {showList ? (
        <div
          className={cx(
            "border-line bg-surface fade-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border p-1.5 shadow-[var(--shadow-lift)]",
            variant === "pill" && "min-w-80",
          )}
        >
          <p
            id={`${listId}-status`}
            className="text-subtle px-2.5 pt-1.5 pb-1 text-[0.6875rem] font-bold tracking-[0.1em] uppercase"
            aria-live="polite"
          >
            {suggestions.length > 0
              ? `Demonstration profiles · ${suggestions.length} ${suggestions.length === 1 ? "match" : "matches"}`
              : "No demonstration profile matches — press Enter to search"}
          </p>
          {suggestions.length > 0 ? (
            <ul role="listbox" id={listId} aria-label="Matching demonstration profiles">
              {suggestions.map((coach, index) => (
                <li
                  key={coach.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  // mousedown, not click: the input's blur would close the list first.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    open(coach.slug);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm",
                    index === active ? "bg-accent-soft" : "hover:bg-surface-2",
                  )}
                >
                  <CoachAvatar initials={coach.initials} size="sm" />
                  <span className="text-paper min-w-0 flex-1 truncate font-semibold">
                    {coach.name}
                  </span>
                  <span className="text-subtle hidden truncate text-xs sm:inline">
                    {coach.divisions
                      .slice(0, 2)
                      .map((division) => labelFor(DIVISIONS, division))
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
