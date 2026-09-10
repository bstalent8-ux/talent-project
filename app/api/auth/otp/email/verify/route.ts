export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/email-otp";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rate-limit";

// Public, pre-signup — no user exists yet.
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().min(1).max(12),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const bad = parsed.error.issues.some((i) => i.path[0] === "email");
    return NextResponse.json({ error: bad ? "invalid email" : "code required" }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const ip = clientIp(req);
  const [byIp, byAddr] = await Promise.all([
    rateLimit(`otp-email-verify:${ip}`, { windowSeconds: 600, max: 10 }),
    rateLimit(`otp-email-verify:${email.trim().toLowerCase()}`, { windowSeconds: 600, max: 6 }),
  ]);
  if (!byIp.ok || !byAddr.ok) return tooManyRequests();

  const result = await verifyEmailOtp(email.trim(), code);
  if (!result.ok) {
    const status = result.error === "too_many_attempts" ? 429 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ verified: true });
}
