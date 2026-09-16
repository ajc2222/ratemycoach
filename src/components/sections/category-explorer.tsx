"use client";

import Link from "next/link";

import { cx } from "@/components/ui/primitives";
import { track } from "@/lib/analytics/client";

/**
 * Category exploration. Every chip is a real, filtered link into the directory
 * *and* a vote: `category_selected` is how we rank which divisions to build
 * coverage for first.
 *
 * The last two chips filter by coaching focus rather than division, because
 * "is this coach natural or enhanced" is one of the first questions athletes
 * ask and it does not map onto a division.
 */
const CATEGORIES: { label: string; href: string; category: string }[] = [
  {
    label: "Men's Bodybuilding",
    href: "/coaches?division=mens-bodybuilding",
    category: "mens-bodybuilding",
  },
  {
    label: "Classic Physique",
    href: "/coaches?division=classic-physique",
    category: "classic-physique",
  },
  {
    label: "Men's Physique",
    href: "/coaches?division=mens-physique",
    category: "mens-physique",
  },
  { label: "Bikini", href: "/coaches?division=bikini", category: "bikini" },
  { label: "Wellness", href: "/coaches?division=wellness", category: "wellness" },
  { label: "Figure", href: "/coaches?division=figure", category: "figure" },
  {
    label: "Women's Physique",
    href: "/coaches?division=womens-physique",
    category: "womens-physique",
  },
  {
    label: "Women's Bodybuilding",
    href: "/coaches?division=womens-bodybuilding",
    category: "womens-bodybuilding",
  },
  { label: "Natural coaching", href: "/coaches?focus=natural", category: "natural" },
  { label: "Enhanced coaching", href: "/coaches?focus=enhanced", category: "enhanced" },
];

const HERO_PICKS = new Set(["bikini", "classic-physique", "mens-physique", "natural"]);

/**
 * `hero` is the compact "Browse:" row under the hero search, on navy.
 * Both variants record the same `category_selected` vote.
 */
export function CategoryExplorer({ variant = "grid" }: { variant?: "grid" | "hero" }) {
  const items =
    variant === "hero"
      ? CATEGORIES.filter((item) => HERO_PICKS.has(item.category))
      : CATEGORIES;
  const list = (
    <ul
      className={cx(
        "flex flex-wrap",
        variant === "hero" ? "items-center justify-center gap-2" : "gap-2.5",
      )}
    >
      {items.map((item) => (
        <li key={item.category}>
          <Link
            href={item.href}
            onClick={() => track("category_selected", { category: item.category, page: "/" })}
            className={cx(
              "inline-flex items-center rounded-full font-semibold transition-colors",
              variant === "hero"
                ? "border-on-navy/25 text-on-navy hover:bg-on-navy/10 min-h-11 border px-3.5 text-sm sm:min-h-9"
                : "btn-hard bg-surface text-paper hover:bg-accent hover:text-accent-ink min-h-11 px-4 py-2 text-sm",
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  if (variant !== "hero") return list;
  return (
    <nav
      aria-label="Browse by division"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
    >
      <span className="text-on-navy-muted text-sm">Browse:</span>
      {list}
    </nav>
  );
}
