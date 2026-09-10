// ─── Cloudflare Turnstile (invisible-friendly CAPTCHA) ──────────────────────
// Graceful no-op when unconfigured, same posture as lib/analytics/meta-pixel:
// with no TURNSTILE_SECRET_KEY set, verifyTurnstile() returns true and the
// widget renders nothing, so every form keeps working. Set both env vars to
// switch it on:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY   (client — the widget)
//   TURNSTILE_SECRET_KEY             (server — this verify call)
// Get them from the Cloudflare dashboard → Turnstile. Also add
// challenges.cloudflare.com to the CSP (already done in next.config.ts).

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

/**
 * Verifies a Turnstile token from the client.
 * - not configured  → `true`  (feature off, don't block anyone)
 * - configured, no token or bad token → `false`
 * - network error while configured → `false` (fail closed — a CAPTCHA that
 *   can't be checked isn't a CAPTCHA)
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || typeof token !== "string") return false;

  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);

    const res = await fetch(SITEVERIFY, { method: "POST", body: form });
    const data = (await res.json()) as { success?: boolean };
    return data?.success === true;
  } catch (e) {
    console.error("[turnstile] siteverify threw:", e);
    return false;
  }
}
