export const runtime = 'edge';

// ─── Forgot-password step 1: send a 6-digit code ────────────────────────────
// /forgot-password linked here since before this route existed at all (a
// known gap — see CLAUDE.md's Login section). Reuses the same email_otps +
// Resend path as register's email verification, just a different `purpose`,
// instead of depending on Supabase's own magic-link email (unconfigured
// Site URL / redirect allowlist in this project).
//
// Never reveals whether the email has an account: a nonexistent email still
// gets a 200 { success: true }, it just skips the actual send. The response
// is otherwise identical either way — same generic-response posture as
// /api/auth/login.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmailOtp, emailOtpConfigured, findUserIdByEmail } from "@/lib/email-otp";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  lang: z.enum(["ar", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  if (!emailOtpConfigured()) return NextResponse.json({ error: "otp not configured" }, { status: 500 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid email" }, { status: 400 });
  const { email } = parsed.data;
  const safeLang = parsed.data.lang ?? "en";

  const ip = clientIp(req);
  const [byIp, byAddr] = await Promise.all([
    rateLimit(`reset-pw-send:${ip}`, { windowSeconds: 3600, max: 5 }),
    rateLimit(`reset-pw-send:${email}`, { windowSeconds: 3600, max: 3 }),
  ]);
  if (!byIp.ok || !byAddr.ok) return tooManyRequests();

  const userId = await findUserIdByEmail(email);
  if (userId) {
    const result = await sendEmailOtp(email, safeLang, "reset_password");
    // A cooldown from the account's own owner re-clicking send is worth
    // surfacing (so they don't think it silently failed); every other
    // failure mode is swallowed into the same generic success below.
    if (!result.ok && result.error === "cooldown") {
      return NextResponse.json({ error: result.error, retryAfterSeconds: result.retryAfterSeconds }, { status: 429 });
    }
  }

  return NextResponse.json({ success: true });
}
