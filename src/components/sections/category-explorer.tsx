"use client";

import Link from "next/link";

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

export function CategoryExplorer() {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {CATEGORIES.map((item) => (
        <li key={item.category}>
          <Link
            href={item.href}
            onClick={() => track("category_selected", { category: item.category, page: "/" })}
            className="border-line bg-surface text-paper hover:border-accent hover:text-accent inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
