export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { verifyEmailOtp } from "@/lib/email-otp";

// Public, pre-signup — no user exists yet.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email, code } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const result = await verifyEmailOtp(email.trim(), code);
  if (!result.ok) {
    const status = result.error === "too_many_attempts" ? 429 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ verified: true });
}
