export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { checkOtp, twilioConfigured } from "@/lib/twilio";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!twilioConfigured()) return NextResponse.json({ error: "otp not configured" }, { status: 500 });

  const { phone, code } = await req.json().catch(() => ({}));
  if (typeof phone !== "string" || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "phone and code required" }, { status: 400 });
  }

  const result = await checkOtp(phone, code.trim());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // Store only phone + when verified — never the code (Twilio owns that).
  // /api/profile checks this row exists and is fresh before creating an
  // account for this phone.
  const { error } = await adminClient
    .from("phone_verifications")
    .upsert({ phone, verified_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "failed to record verification" }, { status: 500 });

  return NextResponse.json({ verified: true });
}
