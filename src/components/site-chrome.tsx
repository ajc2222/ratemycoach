"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CoachSearchField, SearchIcon } from "@/components/coach-search";
import { ButtonLink, cx, PrelaunchPill } from "@/components/ui/primitives";
import { track } from "@/lib/analytics/client";
import { queryLengthBand } from "@/lib/analytics/events";
import { site } from "@/lib/site";

const NAV = [
  { href: "/coaches", label: "Find a coach" },
  { href: "/review", label: "Review a coach" },
  { href: "/for-coaches", label: "For coaches" },
  { href: "/methodology", label: "How this works" },
] as const;

/** Pages that already lead with their own search field. */
const PAGES_WITH_SEARCH = ["/", "/coaches"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark({ onNavy = false }: { onNavy?: boolean }) {
  return (
    <Link
      href="/"
      className={cx(
        "flex shrink-0 items-center gap-2.5 rounded-[var(--radius-control)] py-1 text-lg font-extrabold tracking-tight",
        onNavy ? "text-on-navy" : "text-paper",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "grid size-7 place-items-center rounded-[5px] text-sm font-extrabold",
          onNavy ? "bg-on-navy text-navy" : "bg-navy text-on-navy",
        )}
      >
        P
      </span>
      <span>
        PrepCoach{" "}
        <span className={cx("font-medium", onNavy ? "text-on-navy-muted" : "text-muted")}>
          Reviews
        </span>
      </span>
    </Link>
  );
}

function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        track("hero_search_started", {
          page: pathname,
          query_length: queryLengthBand(trimmed),
          has_query: true,
          source: "header",
        });
        router.push(`/coaches?q=${encodeURIComponent(trimmed)}`);
        setQuery("");
      }}
    >
      <CoachSearchField
        id="header-search"
        variant="pill"
        value={query}
        onValueChange={setQuery}
        label="Search coaches by name, team or handle"
        placeholder="Coach name, team, or @handle"
        source="header"
      />
    </form>
  );
}

/** Solid navy bar with an inline search, after RateMyProfessors. */
export function SiteHeader() {
  const pathname = usePathname();
  const showSearch = !PAGES_WITH_SEARCH.includes(pathname);

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="on-navy border-navy-line sticky top-0 z-40 border-b"
    >
      <div className="container-page flex h-14 items-center gap-5 lg:h-16">
        <Wordmark onNavy />

        {showSearch ? <HeaderSearch className="hidden max-w-md flex-1 xl:block" /> : null}

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "bg-on-navy/15 text-on-navy"
                    : "text-on-navy-muted hover:bg-on-navy/10 hover:text-on-navy",
                  // With the search box visible, "Find a coach" is redundant.
                  item.href === "/coaches" && showSearch && "xl:hidden",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/waitlist"
          className="bg-on-navy text-navy ml-auto hidden min-h-10 items-center rounded-full px-4 text-sm font-bold whitespace-nowrap transition-[opacity,transform] hover:opacity-90 active:scale-95 sm:inline-flex lg:ml-0"
        >
          Join the waitlist
        </Link>
      </div>
    </header>
  );
}

function TabIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={d}
      />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Home", icon: <TabIcon d="M3 11 12 4l9 7v9h-6v-6H9v6H3v-9Z" /> },
  { href: "/coaches", label: "Find a coach", icon: <SearchIcon /> },
  {
    href: "/review",
    label: "Review",
    icon: <TabIcon d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" />,
  },
];

const SHEET_LINKS = [
  { href: "/for-coaches", label: "For coaches", hint: "List or claim a profile" },
  { href: "/methodology", label: "How this works", hint: "Methodology & trust" },
  { href: "/submit-a-coach", label: "Request a coach", hint: "Tell us who to research" },
  { href: "/contact", label: "Contact", hint: "Questions & data requests" },
] as const;

/**
 * Phone navigation: a bottom tab bar for the three things people do most, and
 * a sheet for everything else. The Menu icon morphs into a close icon.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const close = () => setMenuPath(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPath(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const tabClass = (active: boolean) =>
    cx(
      "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition-colors",
      active ? "text-accent" : "text-subtle hover:text-paper",
    );

  return (
    <div className="lg:hidden">
      {menuOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            className="bg-navy/40 fade-in fixed inset-0 z-40 backdrop-blur-[2px]"
          />
          <nav
            id="mobile-menu"
            aria-label="More"
            className="bg-surface sheet-in fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 rounded-t-3xl px-5 pt-3 pb-5 shadow-[0_-12px_32px_rgb(15_27_61/0.18)]"
          >
            <div
              aria-hidden="true"
              className="bg-line-strong mx-auto mb-3 h-1 w-10 rounded-full"
            />
            <ul>
              {SHEET_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="hover:bg-surface-2 -mx-2 flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 py-2"
                  >
                    <span>
                      <span className="text-paper block font-semibold">{item.label}</span>
                      <span className="text-subtle block text-xs">{item.hint}</span>
                    </span>
                    <span aria-hidden="true" className="text-subtle">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href="/waitlist" onClick={close} className="mt-4 w-full">
              Join the waitlist
            </ButtonLink>
            <PrelaunchPill className="mt-4" />
          </nav>
        </>
      ) : null}

      <nav
        aria-label="Primary"
        style={{ viewTransitionName: "tab-bar" }}
        className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={tabClass(active && !menuOpen)}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuPath((current) => (current === pathname ? null : pathname))}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className={cx(tabClass(menuOpen), "w-full")}
            >
              <span className="grid size-5 place-items-center">
                <span className="burger" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
              {menuOpen ? "Close" : "Menu"}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

const FOOTER_PRODUCT = [
  { href: "/coaches", label: "Coach directory preview" },
  { href: "/review", label: "Review a coach" },
  { href: "/for-coaches", label: "List or claim a profile" },
  { href: "/submit-a-coach", label: "Request a coach" },
  { href: "/waitlist", label: "Join the waitlist" },
];

const FOOTER_TRUST = [
  { href: "/methodology", label: "Methodology & trust" },
  { href: "/privacy", label: "Privacy notice" },
  { href: "/terms", label: "Terms & disclaimers" },
  { href: "/contact", label: "Contact & data requests" },
];

/** A call-to-action banner, then a quiet row of links and the disclosures. */
export function SiteFooter() {
  return (
    <footer className="mt-20">
      <div className="container-page">
        <div className="bg-accent text-accent-ink reveal flex flex-col items-start justify-between gap-6 rounded-3xl px-6 py-9 sm:px-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
              Help us decide whether to build this.
            </p>
            <p className="mt-2 text-sm">
              Join the waitlist and tell us which coach you&apos;re researching. That&apos;s how
              we choose who to cover first.
            </p>
          </div>
          <ButtonLink href="/waitlist" variant="secondary" className="shrink-0">
            Join the waitlist <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>

        <div className="border-line mt-12 grid gap-8 border-t pt-8 lg:grid-cols-[1fr_auto_auto] lg:gap-14">
          <div>
            <Wordmark />
            <p className="text-muted mt-3 max-w-sm text-sm">
              An independent research tool for athletes choosing an online bodybuilding coach.
              Not affiliated with any federation, coach, team or supplement brand.
            </p>
            <PrelaunchPill className="mt-4" />
          </div>

          {[
            { label: "Product", items: FOOTER_PRODUCT },
            { label: "Trust and legal", items: FOOTER_TRUST },
          ].map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <ul className="space-y-2 text-sm">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-muted hover:text-paper font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-line text-subtle mt-10 border-t pt-6 pb-8 text-xs leading-relaxed">
          <p>
            <strong className="text-muted">Early validation notice.</strong> {site.name} has not
            launched. Coach profiles shown on this site are fictional demonstrations. No client
            reviews have been published, no ratings exist, and no AI summaries have been
            generated from live forum data. Reviews submitted during this period are stored
            privately and are not published.
          </p>
          <p className="mt-3">
            Nothing here is medical, nutritional or pharmacological advice.
            &ldquo;Natural&rdquo; and &ldquo;enhanced&rdquo; describe a coach&apos;s stated
            coaching focus and are not statements about any individual athlete. Coaching
            outcomes cannot be guaranteed by anyone.
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} {site.name}. Independent and unaffiliated.
          </p>
        </div>
      </div>
    </footer>
  );
}
