/**
 * Structured application logging.
 *
 * One line of JSON per event so Vercel's log drain (or `jq` locally) can filter
 * on it. The `redact` pass is the important part: this application handles
 * emails and private review text, and neither may ever reach a log line. The
 * only identifier that appears is a truncated email *hash*.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const threshold =
  LEVELS[
    (process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === "test" ? "error" : "info")
  ] ?? LEVELS.info;

/** Keys that must never be logged, whatever a caller passes. */
const FORBIDDEN_KEYS = new Set([
  "email",
  "business_email",
  "password",
  "message",
  "what_went_well",
  "what_could_improve",
  "reason",
  "bio",
  "authorization",
  "cookie",
  "ip",
]);

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    const masked = value.replace(EMAIL_RE, "[email]");
    return masked.length > 200 ? `${masked.slice(0, 200)}…` : masked;
  }
  if (typeof value !== "object" || depth > 3) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = redact(v, depth + 1);
  }
  return out;
}

function emit(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  if (LEVELS[level] < threshold) return;
  const line = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...(redact(fields) as Record<string, unknown>),
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};

/** Exposed for the logging unit tests. */
export const __redactForTests = redact;
