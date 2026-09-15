/**
 * Input hygiene applied after Zod validation and before persistence.
 *
 * No user-submitted text is ever rendered on a public page, so this is defence
 * in depth rather than the only line: it keeps control characters and markup
 * out of the operator's CSV exports and admin view, and stops absurd payloads.
 */

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

export function cleanText(input: string, maxLength = 2000): string {
  return (
    input
      .replace(CONTROL_CHARS, "")
      // Strip anything tag-shaped. User text is never rendered as HTML, but an
      // operator opening a CSV in a browser-based tool should not meet markup.
      .replace(/<[^>]*>/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, maxLength)
  );
}

export function cleanOptional(
  input: string | null | undefined,
  maxLength = 2000,
): string | null {
  if (input === null || input === undefined) return null;
  const cleaned = cleanText(input, maxLength);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normalises whatever a person pastes into a "handle" field — a bare handle,
 * an @handle, or a full profile URL — down to a bare handle.
 */
export function normalizeHandle(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = cleanText(input, 200)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^(instagram\.com|tiktok\.com)\//i, "")
    .replace(/\?.*$/, "")
    .replace(/\/+$/, "")
    .replace(/^@+/, "")
    .trim();
  if (!trimmed) return null;
  const handle = trimmed.split("/")[0];
  return handle.slice(0, 100) || null;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 254);
}

/** Only http(s) URLs survive; anything else (javascript:, data:) becomes null. */
export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = cleanText(input, 500);
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

/**
 * Neutralises spreadsheet formula injection in CSV exports: a cell beginning
 * with = + - @ or a control character is executed by some spreadsheet apps.
 */
export function csvSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
