export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmailOtp, emailOtpConfigured } from "@/lib/email-otp";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rate-limit";

// Public, pre-signup — no user exists yet.
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
