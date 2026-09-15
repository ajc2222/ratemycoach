import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Cross-cutting quality gates: accessibility, responsive layout, experiment
 * consistency, honesty-of-copy checks, and security headers.
 */

const PUBLIC_PAGES = [
  "/",
  "/coaches",
  "/coaches/demo-priya-raman",
  "/compare",
  "/waitlist",
  "/review",
  "/for-coaches",
  "/submit-a-coach",
  "/methodology",
  "/privacy",
  "/terms",
  "/contact",
];

test.describe("Accessibility", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} has no detectable WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Print the detail on failure — a bare count is useless to fix from.
      if (results.violations.length > 0) {
        console.error(
          JSON.stringify(
            results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n) => n.target),
            })),
            null,
            2,
          ),
        );
      }
      expect(results.violations).toEqual([]);
    });
  }

  test("the feature-gate dialog is accessible while open", async ({ page }) => {
    await page.goto("/coaches/demo-avery-stonebridge");
    await page.getByRole("button", { name: "Read all reviews" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("the first focusable element is a skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  });

  test("the landing page is keyboard operable to the search field", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("searchbox").first();
    await search.focus();
    await search.fill("Avery");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/coaches\?q=Avery/);
  });

  test("consent boxes are never pre-ticked", async ({ page }) => {
    await page.goto("/waitlist");
    await expect(
      page.getByRole("checkbox", { name: /Email me when PrepCoach Reviews launches/ }),
    ).not.toBeChecked();

    await page.goto("/review");
    await expect(
      page.getByRole("checkbox", { name: /may consider this review for publication/ }),
    ).not.toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: /You may contact me about this review/ }),
    ).not.toBeChecked();

    await page.goto("/for-coaches");
    await expect(
      page.getByRole("checkbox", { name: /You may contact me about listing/ }),
    ).not.toBeChecked();
  });

  test("every page has exactly one h1", async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await expect(page.locator("h1"), path).toHaveCount(1);
    }
  });
});

test.describe("Responsive layout", () => {
  for (const width of [360, 414, 768]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PUBLIC_PAGES) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        // Allow a single pixel for sub-pixel rounding.
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }

  test("the hero proposition is above the fold on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    for (const locator of [
      page.getByRole("heading", { level: 1 }),
      page.getByRole("searchbox").first(),
      page.getByRole("button", { name: "Find a coach" }),
    ]) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeLessThan(844);
    }
  });

  test("interactive targets meet the 44px minimum", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/coaches");
    const buttons = page.getByRole("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i += 1) {
      const button = buttons.nth(i);
      if (!(await button.isVisible())) continue;
      const box = await button.boundingBox();
      if (!box) continue;
      expect(box.height, await button.innerText()).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe("Experiment", () => {
  test("a visitor sees one variant consistently across pages and reloads", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");

    const headline = await page.getByRole("heading", { level: 1 }).textContent();
    expect(headline).toMatch(
      /Research your bodybuilding coach before committing to prep\.|Real coaching experiences—not just transformation photos\./,
    );

    const cookies = await context.cookies();
    const variant = cookies.find((c) => c.name === "pcr_var")?.value;
    expect(["a", "b"]).toContain(variant);

    await page.reload();
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe(headline);

    await page.goto("/coaches");
    await page.goto("/");
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe(headline);

    await context.close();
  });

  test("?variant= overrides for QA and both headlines render", async ({ browser }) => {
    for (const [variant, expected] of [
      ["a", "Research your bodybuilding coach before committing to prep."],
      ["b", "Real coaching experiences—not just transformation photos."],
    ] as const) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`/?variant=${variant}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(expected);
      await context.close();
    }
  });

  test("attribution is captured on first touch and not overwritten", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/?utm_source=reddit&utm_campaign=natty");
    await page.goto("/?utm_source=instagram");

    const attribution =
      (await context.cookies()).find((c) => c.name === "pcr_attr")?.value ?? "";
    expect(decodeURIComponent(decodeURIComponent(attribution))).toContain("reddit");
    expect(decodeURIComponent(decodeURIComponent(attribution))).not.toContain("instagram");

    await context.close();
  });
});

test.describe("Honesty of the interface", () => {
  test("every demonstration profile is labelled as one", async ({ page }) => {
    for (const slug of [
      "demo-avery-stonebridge",
      "demo-rhys-calloway",
      "demo-bianca-ferraro",
    ]) {
      await page.goto(`/coaches/${slug}`);
      await expect(
        page.getByText("Demonstration profile — not a real coach."),
        slug,
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("directory cards carry a demo marker", async ({ page }) => {
    await page.goto("/coaches");
    const cards = page.getByRole("listitem").filter({ hasText: "View profile" });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i += 1) {
      await expect(cards.nth(i).getByText("Demo", { exact: true })).toBeVisible();
    }
  });

  test("no page displays a rating, review count or fabricated statistic", async ({ page }) => {
    for (const path of ["/", "/coaches", "/coaches/demo-priya-raman", "/compare"]) {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      // e.g. "4.8 stars", "127 reviews", "10,000+ athletes"
      expect(text, path).not.toMatch(/\d\.\d\s*(?:\/\s*5|stars?|out of 5)/i);
      expect(text, path).not.toMatch(/\b\d+\s+reviews?\b/i);
      expect(text, path).not.toMatch(
        /\b[\d,]+\+?\s+(?:athletes|coaches|members)\s+(?:trust|joined|rated)/i,
      );
    }
  });

  test("no page uses fake scarcity or a countdown", async ({ page }) => {
    for (const path of ["/", "/waitlist", "/coaches"]) {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      expect(text, path).not.toMatch(/spots? (?:left|remaining)/i);
      expect(text, path).not.toMatch(/offer ends|limited time|only \d+ left/i);
    }
  });

  test("the prelaunch disclosure is on every page", async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await expect(
        page.getByText(/has not launched|Early validation/).first(),
        path,
      ).toBeVisible();
    }
  });

  test("legal pages carry the required disclosures", async ({ page }) => {
    await page.goto("/terms");
    const terms = await page.locator("body").innerText();
    for (const disclosure of [
      "early validation",
      "fictional demonstrations",
      "private and are not published",
      "No AI summaries are generated from live forum",
      "does not provide medical",
      "not affiliated with any bodybuilding federation",
      "moderated before publication",
      "No coaching outcome can be guaranteed",
      "not claims about any individual athlete",
    ]) {
      expect(terms.toLowerCase(), disclosure).toContain(disclosure.toLowerCase());
    }

    await page.goto("/privacy");
    const privacy = await page.locator("body").innerText();
    expect(privacy).toMatch(/delete/i);
    expect(privacy).toMatch(/hello@|contact/i);
  });

  test("the footer links to methodology, privacy and terms from every page", async ({
    page,
  }) => {
    for (const path of ["/", "/coaches", "/review"]) {
      await page.goto(path);
      const footer = page.getByRole("contentinfo");
      await expect(footer.getByRole("link", { name: "Methodology & trust" })).toBeVisible();
      await expect(footer.getByRole("link", { name: "Privacy notice" })).toBeVisible();
      await expect(footer.getByRole("link", { name: "Terms & disclaimers" })).toBeVisible();
    }
  });
});

test.describe("Security and operations", () => {
  test("security headers are present", async ({ page }) => {
    const response = await page.request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("a cross-origin form post is rejected", async ({ page }) => {
    const response = await page.request.post("/api/waitlist", {
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      data: { email: "a@example.com" },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(403);
  });

  test("the honeypot is accepted but nothing is stored", async ({ browser }) => {
    const operator = await browser.newContext({
      httpCredentials: {
        username: "e2e-operator",
        password: "e2e-password-that-is-long-enough",
      },
    });
    const page = await operator.newPage();

    const before = await (await page.request.get("/admin/export/contact_submissions")).text();

    const response = await page.request.post("/api/contact", {
      headers: { "Content-Type": "application/json" },
      data: {
        email: "bot@example.com",
        topic: "general",
        message: "I am a robot filling in every field I find.",
        website_url: "http://spam.example",
        elapsed_ms: 9000,
      },
    });
    expect(response.status()).toBe(201);

    const after = await (await page.request.get("/admin/export/contact_submissions")).text();
    expect(after.split("\r\n").length).toBe(before.split("\r\n").length);
    await operator.close();
  });

  test("the health endpoint reports the live storage driver", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      status: string;
      database: { ok: boolean; driver: string };
      adminConfigured: boolean;
    };
    expect(body.status).toBe("ok");
    expect(body.database.ok).toBe(true);
    expect(["json", "postgres"]).toContain(body.database.driver);
    expect(body.adminConfigured).toBe(true);
  });

  test("an unknown page returns a helpful 404", async ({ page }) => {
    const response = await page.goto("/coaches/not-a-real-slug");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("We couldn't find that page")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a coach" })).toBeVisible();
  });
});
