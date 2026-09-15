import { getDb, TABLE_NAMES, type TableName } from "@/lib/db";
import { logger } from "@/lib/logger";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CSV export of a single dataset.
 *
 * Access is gated by the same HTTP Basic check as `/admin` (applied in
 * middleware, which matches `/admin/:path*`). This handler therefore only has
 * to validate the dataset name — anything outside the known table list is a 404,
 * so the parameter can never reach the driver as an arbitrary identifier.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await params;

  if (!(TABLE_NAMES as string[]).includes(dataset)) {
    return new Response("Unknown dataset.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const db = await getDb();
    // Exports are for an operator working through submissions by hand; 10k rows
    // is far beyond anything a smoke test will produce.
    const rows = (await db.list(dataset as TableName, { limit: 10_000 })) as unknown as Record<
      string,
      unknown
    >[];
    const csv = toCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);

    logger.info("admin export", { dataset, rows: rows.length });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prepcoach-${dataset}-${stamp}.csv"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    logger.error("admin export failed", { dataset, error: (error as Error).message });
    return new Response("Export failed.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
