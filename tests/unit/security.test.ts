import { beforeEach, describe, expect, it } from "vitest";

import { screenContent } from "@/lib/security/content-screen";
import { emailPseudonym, hashEmail, hashIp, safeEqual } from "@/lib/security/hash";
import { checkRateLimit, resetRateLimits } from "@/lib/security/rate-limit";
import {
  cleanOptional,
  cleanText,
  csvSafe,
  normalizeEmail,
  normalizeHandle,
  normalizeUrl,
} from "@/lib/security/sanitize";
import { __redactForTests } from "@/lib/logger";

describe("cleanText", () => {
  it("strips HTML tags so markup never reaches storage or a CSV", () => {
    expect(cleanText("<script>alert(1)</script>Hello")).toBe("alert(1) Hello");
    expect(cleanText("<b>bold</b> text")).toBe("bold text");
    expect(cleanText("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("removes control characters", () => {
    expect(cleanText("a\x00b\x07c")).toBe("abc");
  });

  it("collapses runs of whitespace but keeps paragraph breaks", () => {
    expect(cleanText("a    b")).toBe("a b");
    expect(cleanText("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("truncates to the given limit", () => {
    expect(cleanText("a".repeat(100), 10)).toHaveLength(10);
  });

  it("returns null for optional fields that are empty after cleaning", () => {
    expect(cleanOptional("   ")).toBeNull();
    expect(cleanOptional("<b></b>")).toBeNull();
    expect(cleanOptional(undefined)).toBeNull();
    expect(cleanOptional("real")).toBe("real");
  });
});

describe("normalizeHandle", () => {
  it("reduces every way of writing a handle to the bare handle", () => {
    for (const input of [
      "coachname",
      "@coachname",
      "@@coachname",
      "instagram.com/coachname",
      "https://instagram.com/coachname",
      "https://www.instagram.com/coachname/",
      "https://www.tiktok.com/@coachname?lang=en",
    ]) {
      expect(normalizeHandle(input), input).toBe("coachname");
    }
  });

  it("returns null for empty input", () => {
    expect(normalizeHandle("")).toBeNull();
    expect(normalizeHandle(null)).toBeNull();
    expect(normalizeHandle("   ")).toBeNull();
  });
});

describe("normalizeUrl", () => {
  it("adds a scheme and keeps http(s) URLs", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
    expect(normalizeUrl("http://example.com/path")).toBe("http://example.com/path");
  });

  it("rejects dangerous schemes", () => {
    // `javascript:alert(1)` has no `//`, so it is treated as a bare host and
    // re-prefixed to https — the important property is that the result can
    // never be a javascript: or data: URL.
    for (const input of [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "file:///etc/passwd",
    ]) {
      const result = normalizeUrl(input);
      expect(result === null || /^https?:\/\//.test(result), input).toBe(true);
      expect(result ?? "").not.toMatch(/^(javascript|data|file):/);
    }
  });

  it("returns null for empty input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims so duplicates collide", () => {
    expect(normalizeEmail("  A.Person@Example.COM ")).toBe("a.person@example.com");
  });
});

describe("csvSafe", () => {
  it("neutralises spreadsheet formula injection", () => {
    expect(csvSafe("=1+1")).toBe("'=1+1");
    expect(csvSafe("+SUM(A1)")).toBe("'+SUM(A1)");
    expect(csvSafe("-2")).toBe("'-2");
    expect(csvSafe("@import")).toBe("'@import");
  });

  it("leaves ordinary text alone", () => {
    expect(csvSafe("A normal review sentence.")).toBe("A normal review sentence.");
  });
});

describe("hashing", () => {
  it("produces a stable hash for the same email regardless of case or spacing", () => {
    expect(hashEmail("Person@Example.com")).toBe(hashEmail("  person@example.com  "));
  });

  it("produces different hashes for different emails", () => {
    expect(hashEmail("a@example.com")).not.toBe(hashEmail("b@example.com"));
  });

  it("never returns the input", () => {
    const email = "person@example.com";
    expect(hashEmail(email)).not.toContain(email);
    expect(hashIp("203.0.113.5")).not.toContain("203.0.113");
  });

  it("truncates the pseudonym used in logs", () => {
    expect(emailPseudonym(hashEmail("person@example.com"))).toHaveLength(12);
  });

  it("compares equal and unequal strings correctly", () => {
    expect(safeEqual("secret", "secret")).toBe(true);
    expect(safeEqual("secret", "secrets")).toBe(false);
    expect(safeEqual("secret", "")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit and blocks the next one", () => {
    const ip = "198.51.100.1";
    for (let i = 0; i < 8; i += 1) {
      expect(checkRateLimit("waitlist", ip).allowed, `request ${i}`).toBe(true);
    }
    const blocked = checkRateLimit("waitlist", ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("keeps separate budgets per route and per IP", () => {
    const ip = "198.51.100.2";
    for (let i = 0; i < 8; i += 1) checkRateLimit("waitlist", ip);
    expect(checkRateLimit("waitlist", ip).allowed).toBe(false);
    expect(checkRateLimit("review", ip).allowed).toBe(true);
    expect(checkRateLimit("waitlist", "198.51.100.3").allowed).toBe(true);
  });

  it("lets the window slide, so a blocked visitor recovers", () => {
    const ip = "198.51.100.4";
    const start = Date.now();
    for (let i = 0; i < 5; i += 1) checkRateLimit("review", ip, start);
    expect(checkRateLimit("review", ip, start).allowed).toBe(false);
    // One hour and a second later the window has moved past every hit.
    expect(checkRateLimit("review", ip, start + 3_601_000).allowed).toBe(true);
  });

  it("is generous enough that a person fixing validation errors is not blocked", () => {
    const ip = "198.51.100.5";
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit("review", ip).allowed).toBe(true);
    }
  });
});

describe("content screening", () => {
  it("passes an ordinary critical review — criticism is not the thing being blocked", () => {
    const result = screenContent(
      "Check-ins were often two or three days late and the plan barely changed for eight weeks.",
      "I felt ignored during peak week and would not use them again. Very disappointing for the price.",
    );
    expect(result.ok).toBe(true);
    expect(result.severity).toBeNull();
  });

  it("blocks accusations of criminal or abusive conduct", () => {
    for (const text of [
      "He is a scammer and everyone should know it",
      "She is a predator, full stop",
      "This coach defrauded me of my money",
    ]) {
      const result = screenContent(text);
      expect(result.ok, text).toBe(false);
      expect(result.message).toContain("police");
    }
  });

  it("blocks third-party contact details", () => {
    expect(screenContent("Call him on +44 7700 900123 to complain").ok).toBe(false);
    expect(screenContent("He lives at 42 Example Street").ok).toBe(false);
  });

  it("blocks threats and abuse", () => {
    expect(screenContent("I will find you and I will ruin you").ok).toBe(false);
    expect(screenContent("kys honestly").ok).toBe(false);
  });

  it("blocks link floods", () => {
    expect(
      screenContent("https://a.example https://b.example https://c.example https://d.example")
        .ok,
    ).toBe(false);
  });

  it("flags but does not block a third-party email, so a moderator sees it first", () => {
    const result = screenContent("You can check with someone@example.com about this");
    expect(result.ok).toBe(true);
    expect(result.severity).toBe("flag");
    expect(result.reasons).toContain("third-party-email");
  });

  it("does not false-positive on ordinary prep vocabulary", () => {
    for (const text of [
      "Peak week was brutal but well explained and I finished the show healthy.",
      "The plan killed my appetite in week ten which was hard to manage.",
      "I asked about how they handle enhanced athletes and they were straight with me.",
      "My coach stole the show with how well they prepared the whole team.",
    ]) {
      expect(screenContent(text).ok, text).toBe(true);
    }
  });

  it("treats empty input as passing", () => {
    expect(screenContent("", null, undefined).ok).toBe(true);
  });
});

describe("log redaction", () => {
  it("removes forbidden keys entirely", () => {
    const redacted = __redactForTests({
      email: "person@example.com",
      what_went_well: "a long private review",
      role: "athlete",
    }) as Record<string, unknown>;
    expect(redacted.email).toBe("[redacted]");
    expect(redacted.what_went_well).toBe("[redacted]");
    expect(redacted.role).toBe("athlete");
  });

  it("masks an email that slips into an allowed field", () => {
    const redacted = __redactForTests({ note: "contact person@example.com" }) as {
      note: string;
    };
    expect(redacted.note).toBe("contact [email]");
  });

  it("truncates long strings", () => {
    const redacted = __redactForTests({ note: "a".repeat(500) }) as { note: string };
    expect(redacted.note.length).toBeLessThan(250);
  });

  it("redacts nested structures", () => {
    const redacted = __redactForTests({ outer: { email: "x@y.com" } }) as {
      outer: { email: string };
    };
    expect(redacted.outer.email).toBe("[redacted]");
  });
});
