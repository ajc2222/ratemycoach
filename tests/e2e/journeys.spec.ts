import { expect, test, type Page } from "@playwright/test";

/**
 * The ten critical journeys from the test plan, run against a production build
 * with its own data directory.
 *
 * Analytics are asserted by intercepting `/api/events` rather than by reading
 * the database, so a test proves the *client* emitted the event — which is the
 * part that actually breaks.
 */

const ADMIN = { username: "e2e-operator", password: "e2e-password-that-is-long-enough" };

/** Collects every analytics event name the page sends while the test runs. */
async function captureEvents(page: Page): Promise<() => string[]> {
  const names: string[] = [];
  await page.route("**/api/events", async (route) => {
    const body = route.request().postData();
    if (body) {
      try {
        const parsed = JSON.parse(body) as { events: { name: string }[] };
        names.push(...parsed.events.map((e) => e.name));
      } catch {
        /* ignore malformed payloads in the assertion helper */
      }
    }
    await route.continue();
  });
  return () => names;
}

async function expectEvent(getEvents: () => string[], name: string) {
  await expect
    .poll(() => getEvents(), { timeout: 15_000, message: `waiting for ${name}` })
    .toContain(name);
}

/** Forms have a minimum time-to-submit bot trap; a real person clears it easily. */
async function clearBotTimer(page: Page) {
  await page.waitForTimeout(1400);
}

test.describe("Journey A — athlete searching for a coach", () => {
  test("1. searches for a listed fictional coach and sees them", async ({ page }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectEvent(getEvents, "landing_viewed");

    await page.getByRole("searchbox").first().fill("Priya Raman");
    await page.getByRole("button", { name: "Find a coach" }).click();

    await expect(page).toHaveURL((url) => {
      return url.pathname === "/coaches" && url.searchParams.get("q") === "Priya Raman";
    });
    await expect(page.getByRole("heading", { name: "Priya Raman" })).toBeVisible();
    await expect(page.getByText(/1 demonstration profile/)).toBeVisible();

    await expectEvent(getEvents, "hero_search_started");
    await expectEvent(getEvents, "coach_search_submitted");
  });

  test("filters narrow the results and survive a reload", async ({ page }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/coaches");
    await expect(page.getByText(/12 demonstration profiles/)).toBeVisible();

    const isMobile = page.viewportSize()!.width < 1024;
    if (isMobile) await page.getByRole("button", { name: /^Filters/ }).click();

    await page.getByRole("checkbox", { name: "Bikini", exact: true }).check();
    await expect(page).toHaveURL(/division=bikini/);
    await expectEvent(getEvents, "filter_selected");

    if (isMobile) await page.getByRole("button", { name: /^Show \d+ profile/ }).click();

    const countText = await page
      .getByText(/demonstration profiles? /)
      .first()
      .textContent();
    await page.reload();
    await expect(page.getByText(/demonstration profiles? /).first()).toHaveText(countText!);
  });

  test("3. opens a coach profile", async ({ page }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/coaches?q=Avery");
    await page.getByRole("link", { name: "Avery Stonebridge" }).click();

    await expect(page).toHaveURL(/\/coaches\/demo-avery-stonebridge/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Avery Stonebridge");
    await expect(page.getByText("Demonstration profile — not a real coach.")).toBeVisible();
    await expectEvent(getEvents, "coach_profile_opened");
  });

  test("4. attempting to read reviews shows an honest gate, not fake content", async ({
    page,
  }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/coaches/demo-avery-stonebridge");

    await page.getByRole("button", { name: "Read all reviews" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Client reviews aren't collected yet/)).toBeVisible();
    await expect(
      dialog.getByText(/There are no reviews to show you — not hidden ones, none at all/),
    ).toBeVisible();
    await expect(
      dialog.getByText(/This feature is being prepared for early access/),
    ).toBeVisible();
    // Nothing anywhere may imply hidden reviews exist.
    await expect(dialog.getByText(/unlock/i)).toHaveCount(0);

    await expectEvent(getEvents, "review_feature_clicked");

    // Escape closes and returns focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Read all reviews" })).toBeFocused();
  });

  test("the AI summary and compare gates fire their own events", async ({ page }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/coaches/demo-priya-raman");

    await page.getByRole("button", { name: "Open AI public-source summary" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectEvent(getEvents, "ai_summary_clicked");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Compare", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectEvent(getEvents, "compare_clicked");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expectEvent(getEvents, "save_coach_clicked");
  });

  test("5. joins the waitlist from a feature gate, carrying the coach and feature", async ({
    page,
  }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/coaches/demo-priya-raman");
    await page.getByRole("button", { name: "Read all reviews" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/researching.*Priya Raman/)).toBeVisible();

    await dialog.getByLabel("Email").fill(`gate-${Date.now()}@example.com`);
    await dialog.getByLabel("Which best describes you?").selectOption("athlete");
    await dialog.getByLabel("Primary division or interest").selectOption("bikini");
    await dialog.getByRole("radio", { name: "Looking for a coach now" }).check();
    await dialog
      .getByRole("checkbox", { name: /Email me when PrepCoach Reviews launches/ })
      .check();

    await clearBotTimer(page);
    await dialog.getByRole("button", { name: "Join the waitlist" }).click();

    await expect(dialog.getByText("You're on the list")).toBeVisible();
    await expect(dialog.getByText(/looking into.*Priya Raman/)).toBeVisible();
    await expectEvent(getEvents, "waitlist_started");
    await expectEvent(getEvents, "waitlist_completed");
  });
});

test.describe("Journey D — unmatched coach search", () => {
  test("2 & 7. an unlisted real coach name is captured and can be requested", async ({
    page,
  }) => {
    const getEvents = await captureEvents(page);
    const coachName = `Unlisted Coach ${Date.now()}`;

    await page.goto("/coaches");
    await page.getByRole("searchbox").first().fill(coachName);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("We don't have this coach yet.")).toBeVisible();
    await expectEvent(getEvents, "coach_search_zero_results");

    await page.getByRole("link", { name: "Request this coach" }).click();
    await expect(page).toHaveURL(/\/submit-a-coach\?coach=/);

    // The searched name is carried into the form.
    await expect(page.getByLabel("Coach name")).toHaveValue(coachName);

    await page.getByLabel("Instagram").fill("@some.real.handle");
    await page
      .getByLabel(/What are you hoping to find out/)
      .fill("Whether their check-ins are actually weekly.");
    await page.getByRole("checkbox", { name: /Email me if this coach/ }).check();
    await page.getByLabel("Your email").fill(`requester-${Date.now()}@example.com`);

    await clearBotTimer(page);
    await page.getByRole("button", { name: "Request this coach" }).click();

    await expect(page.getByText("Noted — thank you")).toBeVisible();
    await expectEvent(getEvents, "coach_requested");
  });
});

test.describe("Journey B — former client", () => {
  test("6. submits a private founding review", async ({ page }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/review");

    // The privacy promise must be visible before any field.
    await expect(
      page.getByText(/Your submission will not be publicly posted automatically/).first(),
    ).toBeVisible();

    await page.getByLabel("Coach or team name").fill("A Former Coach");
    await page.getByRole("radio", { name: "Former client" }).check();
    await page.getByRole("checkbox", { name: "Contest prep" }).check();
    await page.getByRole("checkbox", { name: "Posing", exact: true }).check();
    await page.getByLabel("Your division").selectOption("bikini");
    await page.getByRole("radio", { name: "Natural", exact: true }).check();

    for (const rating of [
      "Overall experience",
      "Communication",
      "Personalisation",
      "Value for money",
    ]) {
      await page
        .getByRole("group", { name: rating })
        .getByRole("radio", { name: "4 out of 5" })
        .check();
    }

    await page
      .getByLabel("What went well?")
      .fill(
        "Check-ins were answered within forty-eight hours every single week, and the posing feedback was specific enough to act on.",
      );
    await page
      .getByLabel("What could have been better?")
      .fill(
        "The first four weeks were clearly a template and it only became individualised after I asked directly about it.",
      );
    await page.getByRole("radio", { name: "Maybe / with caveats" }).check();
    await page.getByLabel("Your email").fill(`reviewer-${Date.now()}@example.com`);
    await page
      .getByRole("checkbox", { name: /I confirm this is my own firsthand experience/ })
      .check();

    await clearBotTimer(page);
    await page.getByRole("button", { name: "Submit privately" }).click();

    await expect(page.getByText("Thank you — that's genuinely useful")).toBeVisible();
    await expect(page.getByText(/stored privately/)).toBeVisible();
    await expectEvent(getEvents, "review_form_started");
    await expectEvent(getEvents, "review_form_completed");
  });

  test("a submission accusing someone of a crime is refused with guidance", async ({
    page,
  }) => {
    await page.goto("/review");

    await page.getByLabel("Coach or team name").fill("Another Coach");
    await page.getByRole("radio", { name: "Former client" }).check();
    await page.getByRole("checkbox", { name: "Contest prep" }).check();
    await page.getByLabel("Your division").selectOption("bikini");
    await page.getByRole("radio", { name: "Natural", exact: true }).check();
    for (const rating of [
      "Overall experience",
      "Communication",
      "Personalisation",
      "Value for money",
    ]) {
      await page
        .getByRole("group", { name: rating })
        .getByRole("radio", { name: "1 out of 5" })
        .check();
    }
    await page
      .getByLabel("What went well?")
      .fill(
        "Honestly nothing went well over the entire period that I worked with this person.",
      );
    await page
      .getByLabel("What could have been better?")
      .fill(
        "He is a scammer who defrauded me out of thousands of pounds and everyone knows it.",
      );
    await page.getByRole("radio", { name: "No", exact: true }).check();
    await page.getByLabel("Your email").fill("blocked@example.com");
    await page
      .getByRole("checkbox", { name: /I confirm this is my own firsthand experience/ })
      .check();

    await clearBotTimer(page);
    await page.getByRole("button", { name: "Submit privately" }).click();

    await expect(page.getByRole("alert")).toContainText(/accuse someone of a crime/);
    // The visitor's work is not destroyed by the rejection.
    await expect(page.getByLabel("Coach or team name")).toHaveValue("Another Coach");
  });

  test("validation errors are shown per field and keep entered values", async ({ page }) => {
    await page.goto("/review");
    await page.getByLabel("Coach or team name").fill("Some Coach");
    await clearBotTimer(page);
    await page.getByRole("button", { name: "Submit privately" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Coach or team name")).toHaveValue("Some Coach");
  });
});

test.describe("Journey C — coach", () => {
  test("8. submits a claim, having been shown the claim limitation", async ({ page }) => {
    const getEvents = await captureEvents(page);
    await page.goto("/for-coaches");

    await expect(
      page
        .getByText(
          /Claiming a profile will not allow a coach to alter ratings or remove legitimate reviews/,
        )
        .first(),
    ).toBeVisible();

    await page.getByRole("checkbox", { name: "Claim an existing profile" }).check();
    await page.getByRole("checkbox", { name: "Receive launch updates" }).check();
    await page.getByLabel("Your name").fill("A Coach");
    await page.getByLabel("Team or company").fill("A Team");
    await page.getByLabel("Business email").fill(`coach-${Date.now()}@example.com`);
    await page.getByLabel("Instagram").fill("@a.coach");
    await page.getByRole("checkbox", { name: "Bikini", exact: true }).check();
    await page.getByRole("checkbox", { name: "Contest prep" }).check();
    await page.getByRole("radio", { name: "Both", exact: true }).check();
    await page.getByRole("checkbox", { name: /You may contact me about listing/ }).check();

    await clearBotTimer(page);
    await page.getByRole("button", { name: "Register my interest" }).click();

    await expect(page.getByText("Thanks — we've got your details")).toBeVisible();
    await expectEvent(getEvents, "coach_claim_started");
    await expectEvent(getEvents, "coach_claim_completed");
  });

  test("the claim action on a profile carries the coach through", async ({ page }) => {
    await page.goto("/coaches/demo-tanya-wexler");
    await page.getByRole("link", { name: "Claim this profile" }).click();
    await expect(page).toHaveURL(/\/for-coaches\?coach=Tanya/);
    await expect(page.getByLabel("Your name")).toHaveValue("Tanya Wexler");
    await expect(
      page.getByRole("checkbox", { name: "Claim an existing profile" }),
    ).toBeVisible();
  });
});

test.describe("Operator access", () => {
  test("9. the admin view is protected, then shows collected submissions", async ({
    browser,
  }) => {
    const anonymous = await browser.newContext();
    const anonymousResponse = await anonymous.request.get("/admin", {
      failOnStatusCode: false,
    });
    expect(anonymousResponse.status()).toBe(401);
    await anonymous.close();

    const operator = await browser.newContext({ httpCredentials: ADMIN });
    const page = await operator.newPage();
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Operator view" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coach demand ranking" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Funnel" })).toBeVisible();

    // The export is reachable and returns CSV.
    const csv = await page.request.get("/admin/export/waitlist_entries");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body.split("\r\n")[0]).toContain("email");

    // An arbitrary table name cannot be exported.
    const rejected = await page.request.get("/admin/export/pg_user", {
      failOnStatusCode: false,
    });
    expect(rejected.status()).toBe(404);

    await operator.close();
  });

  test("10. no public route exposes private submissions", async ({ page }) => {
    // Admin surfaces require credentials.
    for (const path of ["/admin", "/admin/export/private_review_submissions"]) {
      const response = await page.request.get(path, { failOnStatusCode: false });
      expect(response.status(), path).toBe(401);
    }

    // The write endpoints do not answer GET with data.
    for (const path of ["/api/waitlist", "/api/review", "/api/coach-claim", "/api/search"]) {
      const response = await page.request.get(path, { failOnStatusCode: false });
      expect(response.status(), path).toBeGreaterThanOrEqual(400);
    }

    // Health is public but leaks nothing beyond operational state.
    const health = await page.request.get("/api/health");
    const body = await health.text();
    expect(body).not.toMatch(/@example\.com/);
    expect(body).not.toContain("password");

    // No public page contains a submitted email address.
    for (const path of ["/", "/coaches", "/review", "/for-coaches", "/compare"]) {
      const response = await page.request.get(path);
      expect(await response.text(), path).not.toMatch(/reviewer-\d+@example\.com/);
    }

    // robots.txt keeps crawlers away from the operator surface and demo profiles.
    const robots = await (await page.request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /coaches/demo-");

    // Demonstration profiles are not in the sitemap.
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("demo-");
  });
});
