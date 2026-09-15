import { describe, expect, it } from "vitest";

import { assignVariant, getVariant, isVariantId, VARIANTS } from "@/lib/experiment";
import {
  decodeAttribution,
  deviceFromUserAgent,
  encodeAttribution,
  hasAttribution,
  readAttributionFromUrl,
} from "@/lib/request-context";

describe("variant assignment", () => {
  it("is deterministic — the same visitor always gets the same variant", () => {
    const visitor = "9f8e7d6c5b4a39281706f5e4d3c2b1a0";
    const first = assignVariant(visitor);
    for (let i = 0; i < 50; i += 1) {
      expect(assignVariant(visitor)).toBe(first);
    }
  });

  it("splits a population roughly evenly", () => {
    let a = 0;
    for (let i = 0; i < 4000; i += 1) {
      if (assignVariant(`visitor-${i}`, "test-salt") === "a") a += 1;
    }
    const share = a / 4000;
    expect(share).toBeGreaterThan(0.45);
    expect(share).toBeLessThan(0.55);
  });

  it("re-randomises when the salt changes, so a later test is not correlated", () => {
    const visitors = Array.from({ length: 200 }, (_, i) => `visitor-${i}`);
    const withSaltOne = visitors.map((v) => assignVariant(v, "salt-one"));
    const withSaltTwo = visitors.map((v) => assignVariant(v, "salt-two"));
    const agreements = withSaltOne.filter((v, i) => v === withSaltTwo[i]).length;
    // Two independent splits agree about half the time, not (almost) always.
    expect(agreements).toBeGreaterThan(60);
    expect(agreements).toBeLessThan(140);
  });

  it("only recognises the two defined variants", () => {
    expect(isVariantId("a")).toBe(true);
    expect(isVariantId("b")).toBe(true);
    expect(isVariantId("c")).toBe(false);
    expect(isVariantId(undefined)).toBe(false);
  });

  it("falls back to variant A for an unknown or missing value", () => {
    expect(getVariant("c").id).toBe("a");
    expect(getVariant(null).id).toBe("a");
    expect(getVariant("b").id).toBe("b");
  });

  it("defines the two headlines from the experiment plan", () => {
    expect(VARIANTS.a.headline).toBe(
      "Research your bodybuilding coach before committing to prep.",
    );
    expect(VARIANTS.b.headline).toBe(
      "Real coaching experiences—not just transformation photos.",
    );
  });

  it("changes only the headline between variants, so the test is clean", () => {
    expect(VARIANTS.a.subhead).toBe(VARIANTS.b.subhead);
  });
});

describe("attribution capture", () => {
  it("reads UTM parameters from the landing URL", () => {
    const url = new URL(
      "https://example.com/?utm_source=reddit&utm_medium=social&utm_campaign=natty&utm_term=prep&utm_content=comment",
    );
    expect(readAttributionFromUrl(url, null)).toEqual({
      s: "reddit",
      m: "social",
      c: "natty",
      t: "prep",
      n: "comment",
      l: "/",
    });
  });

  it("accepts ?ref= and ?source= as friendly aliases, because community links are hand-written", () => {
    expect(readAttributionFromUrl(new URL("https://example.com/?ref=ig-bio"), null).s).toBe(
      "ig-bio",
    );
    expect(readAttributionFromUrl(new URL("https://example.com/?source=discord"), null).s).toBe(
      "discord",
    );
  });

  it("records an external referrer host but ignores internal navigation", () => {
    expect(
      readAttributionFromUrl(new URL("https://example.com/"), "https://www.reddit.com/r/x").r,
    ).toBe("www.reddit.com");
    expect(
      readAttributionFromUrl(new URL("https://example.com/a"), "https://example.com/b").r,
    ).toBeUndefined();
  });

  it("ignores a malformed referrer rather than throwing", () => {
    expect(() =>
      readAttributionFromUrl(new URL("https://example.com/"), "not-a-url"),
    ).not.toThrow();
  });

  it("records the landing path", () => {
    expect(readAttributionFromUrl(new URL("https://example.com/coaches"), null).l).toBe(
      "/coaches",
    );
  });

  it("round-trips through the cookie encoding", () => {
    const attribution = { s: "reddit", c: "natty", r: "www.reddit.com", l: "/" };
    expect(decodeAttribution(encodeAttribution(attribution))).toEqual(attribution);
  });

  it("tolerates an already-decoded cookie value", () => {
    expect(decodeAttribution(JSON.stringify({ s: "reddit" }))).toEqual({ s: "reddit" });
  });

  it("returns an empty record for junk rather than losing the request", () => {
    expect(decodeAttribution("not json")).toEqual({});
    expect(decodeAttribution(undefined)).toEqual({});
    expect(decodeAttribution("%E0%A4%A")).toEqual({});
  });

  it("only treats source, medium, campaign or referrer as real attribution", () => {
    expect(hasAttribution({ l: "/" })).toBe(false);
    expect(hasAttribution({ s: "reddit" })).toBe(true);
    expect(hasAttribution({ r: "www.reddit.com" })).toBe(true);
  });
});

describe("device classification", () => {
  it("classifies phones, tablets and desktops", () => {
    expect(
      deviceFromUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      ),
    ).toBe("mobile");
    expect(
      deviceFromUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7) Mobile Safari/537.36"),
    ).toBe("mobile");
    expect(
      deviceFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari/605.1"),
    ).toBe("tablet");
    expect(
      deviceFromUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120 Safari/537",
      ),
    ).toBe("desktop");
  });

  it("defaults to desktop when there is no user agent", () => {
    expect(deviceFromUserAgent(null)).toBe("desktop");
  });
});
