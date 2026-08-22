export const runtime = 'edge';

// Public, pre-signup — no user exists yet. Rate limiting/cooldown handled
// by Twilio Verify itself (per-number send cooldown + daily cap).
import { NextRequest, NextResponse } from "next/server";
import { sendOtp, twilioConfigured } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  if (!twilioConfigured()) return NextResponse.json({ error: "otp not configured" }, { status: 500 });

  const { phone } = await req.json().catch(() => ({}));
  if (typeof phone !== "string" || !/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "invalid phone" }, { status: 400 });
  }

  const result = await sendOtp(phone);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 429 });
  return NextResponse.json({ success: true });
}
