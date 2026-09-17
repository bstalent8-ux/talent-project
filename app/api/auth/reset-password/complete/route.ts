export const runtime = 'edge';

// ─── Forgot-password step 2: verify the code, set the new password ─────────
// verifyEmailOtp() already caps wrong-code attempts (5) and enforces the
// 10-minute expiry — this route adds the same per-IP/per-identifier brute
// force ceiling every other auth route in this app uses.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp, findUserIdByEmail } from "@/lib/email-otp";
import { adminClient } from "@/lib/supabase/admin";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email:    z.string().trim().toLowerCase().email(),
  code:     z.string().trim().length(6),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { email, code, password } = parsed.data;

  const ip = clientIp(req);
  const [byIp, byAddr] = await Promise.all([
    rateLimit(`reset-pw-verify:${ip}`, { windowSeconds: 600, max: 10 }),
    rateLimit(`reset-pw-verify:${email}`, { windowSeconds: 600, max: 6 }),
  ]);
  if (!byIp.ok || !byAddr.ok) return tooManyRequests();

  const result = await verifyEmailOtp(email, code, "reset_password");
  if (!result.ok) return NextResponse.json({ error: result.error ?? "invalid_code" }, { status: 400 });

  // The code was real and just got consumed — but don't let that alone leak
  // whether the email has an account; the same generic error covers both
  // "wrong code" and "no account" so a caller can't distinguish them.
  const userId = await findUserIdByEmail(email);
  if (!userId) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: "failed to update password" }, { status: 500 });

  return NextResponse.json({ success: true });
}
