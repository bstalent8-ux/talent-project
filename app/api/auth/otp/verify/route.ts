export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkOtp, twilioConfigured } from "@/lib/twilio";
import { adminClient } from "@/lib/supabase/admin";
import { rateLimit, tooManyRequests, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().regex(/^\+\d{8,15}$/),
  code: z.string().trim().min(1).max(12),
});

export async function POST(req: NextRequest) {
  if (!twilioConfigured()) return NextResponse.json({ error: "otp not configured" }, { status: 500 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "phone and code required" }, { status: 400 });
  const { phone, code } = parsed.data;

  // Brute-force cap on code guessing.
  const ip = clientIp(req);
  const [byIp, byPhone] = await Promise.all([
    rateLimit(`otp-verify:${ip}`, { windowSeconds: 600, max: 10 }),
    rateLimit(`otp-verify-phone:${phone}`, { windowSeconds: 600, max: 6 }),
  ]);
  if (!byIp.ok || !byPhone.ok) return tooManyRequests();

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
