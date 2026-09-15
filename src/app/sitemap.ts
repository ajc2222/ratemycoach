import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Public pages only.
 *
 * Demonstration coach profiles are deliberately excluded: indexing fictional
 * people as though they were real professionals would be misleading, and those
 * pages already carry `noindex`. `/admin` is excluded for obvious reasons.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly",
  ) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry("/", 1, "weekly"),
    entry("/coaches", 0.9, "weekly"),
    entry("/review", 0.9, "weekly"),
    entry("/for-coaches", 0.8, "weekly"),
    entry("/submit-a-coach", 0.7, "weekly"),
    entry("/waitlist", 0.7, "weekly"),
    entry("/compare", 0.6, "monthly"),
    entry("/methodology", 0.6, "monthly"),
    entry("/contact", 0.4, "monthly"),
    entry("/privacy", 0.3, "monthly"),
    entry("/terms", 0.3, "monthly"),
  ];
}
