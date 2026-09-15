/**
 * Prohibited-content screening for free-text submissions.
 *
 * This is a prelaunch *safety* control, not a quality filter. Two things must
 * not enter the dataset:
 *
 *  1. Accusations that a named person committed a crime or abuse. We are not
 *     equipped to verify them, we will not publish them, and holding them
 *     creates real risk for the accused, the submitter and us. We ask the
 *     submitter to report those to the proper authority instead.
 *  2. Third-party contact details and personal identifiers, which we have no
 *     lawful basis to collect from someone else.
 *
 * Matches are deliberately conservative (accusation-shaped, word-boundary
 * anchored) because a false positive blocks a legitimate review, which is the
 * scarcest thing this smoke test collects. Everything stored is private and
 * moderated regardless, so this screen is the first filter, not the only one.
 */

export type ScreenSeverity = "block" | "flag";

export interface ScreenResult {
  ok: boolean;
  severity: ScreenSeverity | null;
  reasons: string[];
  message: string | null;
}

interface Rule {
  id: string;
  severity: ScreenSeverity;
  pattern: RegExp;
}

const RULES: Rule[] = [
  {
    id: "criminal-accusation",
    severity: "block",
    pattern:
      /\b(?:is|was|he'?s|she'?s|they'?re|they are)\s+(?:a\s+)?(?:rapist|paedophile|pedophile|predator|abuser|fraudster|criminal|scammer|thief)\b/i,
  },
  {
    id: "criminal-accusation-verb",
    severity: "block",
    pattern:
      /\b(?:raped|molested|sexually assaulted|groomed|trafficked|embezzled|defrauded)\b/i,
  },
  {
    id: "allegation-of-illegal-supply",
    severity: "block",
    pattern:
      /\b(?:sold|supplied|dealt|prescribed|sourced)\s+(?:me\s+)?(?:steroids|gear|peds|anabolics|illegal drugs)\b/i,
  },
  {
    id: "third-party-contact-details",
    severity: "block",
    pattern:
      /\b\+?\d[\d\s().-]{8,}\d\b|\b\d+\s+[A-Za-z]+\s+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln)\b/i,
  },
  {
    id: "third-party-email",
    severity: "flag",
    pattern: /[\w.+-]+@[\w-]+\.[\w.]{2,}/i,
  },
  {
    id: "threat",
    severity: "block",
    pattern:
      /\b(?:i(?:'m| am)? ?(?:going to|gonna)|i will)\s+(?:kill|hurt|find|expose|destroy|ruin)\s+(?:you|him|her|them)\b/i,
  },
  {
    id: "harassment",
    severity: "block",
    pattern: /\b(?:kill yourself|kys)\b/i,
  },
  {
    id: "spam-link-flood",
    severity: "block",
    pattern: /(?:https?:\/\/\S+\s*){3,}/i,
  },
];

const ACCUSATION_MESSAGE =
  "We can't accept submissions that accuse someone of a crime or of abuse. We aren't able to verify or publish those claims. If something unlawful happened, please report it to the police or the relevant federation — you're very welcome to describe the coaching service itself here instead.";

const MESSAGES: Record<string, string> = {
  "criminal-accusation": ACCUSATION_MESSAGE,
  "criminal-accusation-verb": ACCUSATION_MESSAGE,
  "allegation-of-illegal-supply":
    "We can't accept claims about anyone supplying or prescribing drugs. Please describe the coaching service you received instead.",
  "third-party-contact-details":
    "Please remove any phone numbers or addresses — we can't hold someone else's contact details.",
  "third-party-email": "Please remove other people's email addresses from your description.",
  threat:
    "We can't accept submissions containing threats. Please describe the coaching experience factually.",
  harassment:
    "Please rewrite this without abuse directed at a person. A factual account of the coaching is what we're collecting.",
  "spam-link-flood":
    "Please remove the links — we can't accept submissions that are mostly URLs.",
};

export function screenContent(...fields: (string | null | undefined)[]): ScreenResult {
  const text = fields.filter(Boolean).join("\n\n");
  if (!text.trim()) return { ok: true, severity: null, reasons: [], message: null };

  const hits = RULES.filter((rule) => rule.pattern.test(text));
  if (hits.length === 0) return { ok: true, severity: null, reasons: [], message: null };

  const blocking = hits.find((h) => h.severity === "block");
  if (blocking) {
    return {
      ok: false,
      severity: "block",
      reasons: hits.map((h) => h.id),
      message: MESSAGES[blocking.id] ?? "Please rewrite this submission.",
    };
  }
  // Flag-only: store it, but mark it so a moderator reads it before anything
  // is ever considered for publication.
  return { ok: true, severity: "flag", reasons: hits.map((h) => h.id), message: null };
}
