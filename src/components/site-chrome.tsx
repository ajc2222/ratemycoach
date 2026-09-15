"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ButtonLink, cx, PrelaunchPill } from "@/components/ui/primitives";
import { site } from "@/lib/site";

const NAV = [
  { href: "/coaches", label: "Find a coach" },
  { href: "/review", label: "Review a coach" },
  { href: "/for-coaches", label: "For coaches" },
  { href: "/methodology", label: "How this works" },
] as const;

function Wordmark() {
  return (
    <Link
      href="/"
      className="font-display text-paper flex items-center gap-2.5 rounded-[var(--radius-control)] py-1 text-lg font-semibold tracking-tight"
    >
      <span
        aria-hidden="true"
        className="bg-accent text-accent-ink grid size-7 place-items-center rounded-[5px] font-sans text-sm font-bold"
      >
        P
      </span>
      <span>
        PrepCoach <span className="text-muted">Reviews</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  return (
    <header className="border-line bg-ink/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Wordmark />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-accent" : "text-muted hover:text-paper",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/waitlist" className="hidden px-4 py-2 text-sm sm:inline-flex">
            Join the waitlist
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuPath((current) => (current === pathname ? null : pathname))}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="border-line text-paper inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] border lg:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {menuOpen ? "×" : "≡"}
            </span>
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-line bg-surface border-t lg:hidden"
        >
          <ul className="container-page py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuPath(null)}
                  className="border-line/60 text-paper flex min-h-11 items-center border-b py-3"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/waitlist"
                onClick={() => setMenuPath(null)}
                className="text-accent flex min-h-11 items-center py-3 font-semibold"
              >
                Join the waitlist
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-line bg-surface mt-20 border-t">
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Wordmark />
            <p className="text-muted mt-3 max-w-sm text-sm">
              An independent research tool for athletes choosing an online bodybuilding coach.
              Not affiliated with any federation, coach, team or supplement brand.
            </p>
            <PrelaunchPill className="mt-4" />
          </div>

          <nav aria-label="Product">
            <h2 className="text-subtle mb-3 font-sans text-xs font-semibold tracking-[0.15em] uppercase">
              Product
            </h2>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/coaches", label: "Coach directory preview" },
                { href: "/review", label: "Review a coach" },
                { href: "/for-coaches", label: "List or claim a profile" },
                { href: "/submit-a-coach", label: "Request a coach" },
                { href: "/waitlist", label: "Join the waitlist" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Trust and legal">
            <h2 className="text-subtle mb-3 font-sans text-xs font-semibold tracking-[0.15em] uppercase">
              Trust
            </h2>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/methodology", label: "Methodology & trust" },
                { href: "/privacy", label: "Privacy notice" },
                { href: "/terms", label: "Terms & disclaimers" },
                { href: "/contact", label: "Contact & data requests" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-line text-subtle mt-10 border-t pt-6 text-xs leading-relaxed">
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
