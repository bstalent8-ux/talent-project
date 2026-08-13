export const runtime = "edge";

// ─── TEMPORARY diagnostic probe ────────────────────────────────────────────
// Not part of the app. Measures Worker → Supabase outbound latency directly,
// with cf-ray datacenter codes from both sides to check for a Cloudflare
// Smart Placement / region mismatch. Read-only (single SELECT via REST,
// LIMIT 1). Delete this route once the audit is done.

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const incomingRay = req.headers.get("cf-ray");
  const workerStart = Date.now();

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`;

  let fetchMs: number | null = null;
  let bodyReadMs: number | null = null;
  let status: number | null = null;
  let supabaseRay: string | null = null;
  let supabaseServer: string | null = null;
  let cfCacheStatus: string | null = null;
  let errorMessage: string | null = null;

  try {
    const t0 = Date.now();
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    });
    const t1 = Date.now();
    await res.text();
    const t2 = Date.now();

    fetchMs = t1 - t0;
    bodyReadMs = t2 - t1;
    status = res.status;
    supabaseRay = res.headers.get("cf-ray");
    supabaseServer = res.headers.get("server");
    cfCacheStatus = res.headers.get("cf-cache-status");
  } catch (e: any) {
    errorMessage = e?.message ?? String(e);
  }

  const workerTotalMs = Date.now() - workerStart;

  return NextResponse.json(
    {
      incomingWorkerCfRay: incomingRay,
      incomingWorkerDatacenter: incomingRay?.split("-")[1] ?? null,
      supabaseResponseCfRay: supabaseRay,
      supabaseResponseDatacenter: supabaseRay?.split("-")[1] ?? null,
      supabaseResponseServer: supabaseServer,
      supabaseCfCacheStatus: cfCacheStatus,
      fetchMs,
      bodyReadMs,
      workerTotalMs,
      status,
      errorMessage,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
