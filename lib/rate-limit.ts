import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

// ─── Rate limiting for public / unauthenticated endpoints ────────────────────
// Fixed-window counter backed by public.rate_limits + the rl_hit() RPC
// (supabase/migrations/20260910_rate_limits.sql). Edge-safe — it's just a
// service-role RPC call, no in-process state.
//
// **Fails open.** A rate limiter must never be the reason a form stops
// working: if the RPC errors or is missing, the request is allowed and the
// failure is logged.

/** Best-effort caller IP from the Cloudflare / proxy headers. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export interface RateLimitOptions {
  /** Window length in seconds. */
  windowSeconds: number;
  /** Max requests allowed per window. */
  max: number;
}

/**
 * Records a hit against `bucket` and reports whether the caller is still
 * under the cap. `bucket` should already include the discriminator, e.g.
 * `contact:1.2.3.4` or `otp:+201234567890`.
 */
export async function rateLimit(
  bucket: string,
  { windowSeconds, max }: RateLimitOptions,
): Promise<{ ok: boolean }> {
  try {
    const { data, error } = await adminClient.rpc("rl_hit", {
      p_bucket: bucket.slice(0, 200),
      p_window_seconds: windowSeconds,
      p_max_hits: max,
    });
    if (error) {
      console.error("[rate-limit] rl_hit failed — allowing:", error.message);
      return { ok: true };
    }
    return { ok: data === true };
  } catch (e) {
    console.error("[rate-limit] rl_hit threw — allowing:", e);
    return { ok: true };
  }
}

/** Standard 429 body for a tripped limit. */
export function tooManyRequests(): NextResponse {
  return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
}

// ─── Honeypot ───────────────────────────────────────────────────────────────
// Public forms include a hidden `_hp` field (see components/forms/Honeypot).
// A real user never fills it; a dumb bot fills every field. When it's set we
// return success without doing anything — the bot thinks it worked.
export const HONEYPOT_FIELD = "_hp";

export function isHoneypotTripped(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const v = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim().length > 0;
}
