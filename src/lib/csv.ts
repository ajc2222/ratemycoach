import { csvSafe } from "@/lib/security/sanitize";

/**
 * RFC 4180 CSV serialisation with spreadsheet-formula neutralisation.
 *
 * The export is the operator's working copy of everything the smoke test
 * collected, so it will be opened in a spreadsheet — which makes formula
 * injection a real concern, not a theoretical one.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text: string;
  if (Array.isArray(value)) text = value.join("; ");
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);

  text = csvSafe(text);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const headers =
    columns ??
    [...new Set(rows.flatMap((row) => Object.keys(row)))].sort((a, b) => {
      // Keep the identity columns first; the rest alphabetical for stability.
      const order = ["id", "created_at", "updated_at"];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    });

  const lines = [headers.map(cell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => cell(row[header])).join(","));
  }
  // A trailing newline keeps `wc -l` and most parsers happy.
  return `${lines.join("\r\n")}\r\n`;
}
