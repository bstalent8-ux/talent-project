export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { sendEmailOtp, emailOtpConfigured } from "@/lib/email-otp";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rate-limit";

// Public, pre-signup — no user exists yet.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  if (!emailOtpConfigured()) return NextResponse.json({ error: "otp not configured" }, { status: 500 });

  const { email, lang } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  const safeLang = lang === "ar" ? "ar" : "en";

  const ip = clientIp(req);
  const [byIp, byAddr] = await Promise.all([
    rateLimit(`otp-email-send:${ip}`, { windowSeconds: 3600, max: 5 }),
    rateLimit(`otp-email-send:${email.trim().toLowerCase()}`, { windowSeconds: 3600, max: 3 }),
  ]);
  if (!byIp.ok || !byAddr.ok) return tooManyRequests();

  const result = await sendEmailOtp(email.trim(), safeLang);
  if (!result.ok) {
    const status = result.error === "cooldown" ? 429 : 500;
    return NextResponse.json({ error: result.error, retryAfterSeconds: result.retryAfterSeconds }, { status });
  }
  return NextResponse.json({ success: true });
}
