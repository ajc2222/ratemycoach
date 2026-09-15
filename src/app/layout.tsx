import type { Metadata, Viewport } from "next";

import { FeatureGateProvider } from "@/components/feature-gate";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — research your bodybuilding coach before you commit`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — research your bodybuilding coach before you commit`,
    description: site.description,
    url: site.url,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — research your bodybuilding coach before you commit`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "sports",
};

export const viewport: Viewport = {
  themeColor: "#0e0f11",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Organisation metadata. Deliberately minimal: no aggregate ratings, no review
 * counts, no `Product` markup. Structured data claiming reviews exist when none
 * do would be both a lie and a manual-action risk.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  description: site.description,
  slogan: site.tagline,
  email: site.contactEmail,
  knowsAbout: [
    "bodybuilding coaching",
    "contest preparation",
    "physique sport",
    "coach selection",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="bg-accent text-accent-ink sr-only rounded-[var(--radius-control)] px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to main content
        </a>
        <FeatureGateProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </FeatureGateProvider>
        <script
          type="application/ld+json"
          // Static, developer-authored JSON. No user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
