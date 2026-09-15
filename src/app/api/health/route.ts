import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check for uptime monitoring and post-deploy smoke verification.
 * Reports which storage driver is live, which is the fastest way to catch the
 * classic production mistake: deploying with `DATABASE_URL` unset and silently
 * writing submissions to an ephemeral filesystem.
 */
export async function GET() {
  const startedAt = Date.now();
  let database: { ok: boolean; driver: string; detail?: string };

  try {
    const db = await getDb();
    const health = await db.healthcheck();
    database = { ok: health.ok, driver: db.driver, detail: health.detail };
  } catch (error) {
    database = { ok: false, driver: "unknown", detail: (error as Error).message };
  }

  const body = {
    status: database.ok ? "ok" : "degraded",
    service: "prepcoach-reviews",
    version: process.env.npm_package_version ?? "0.1.0",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    database,
    adminConfigured: Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD),
    latency_ms: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: database.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
