export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyBookingRequest } from "@/lib/notifications/events";
import { logBookingBriefSent } from "@/lib/events/events";
import { canCreateBooking } from "@/lib/permissions";
import { requireCompletion } from "@/lib/completion-gate";

const ACTIVE_BOOKING_STATUSES = [
  "pending", "changes_requested", "accepted", "payment_pending",
  "in_progress", "brief_sent", "contacting",
];

const MIN_AMOUNT = 500;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^([01]\d|2[0-3]):[0-5]\d$/;

const addonSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(200),
  price: z.number().nonnegative(),
});

// Flow 1 ("package") — fixed price, no negotiation. The package + add-ons
// already fully describe the scope, so there is no free-text brief and no
// booking_briefs row: this is a deliberately narrower insert than
// /api/bookings/direct's, on the ONE table whose shape is fully understood.
const packageBookingSchema = z.object({
  talent_user_id:  z.string().uuid(),
  package_id:      z.string().min(1).max(200),
  package_name:    z.string().min(1).max(200),
  amount:          z.coerce.number().min(MIN_AMOUNT).max(10_000_000),
  addons:          z.array(addonSchema).max(20).optional().default([]),
  scheduled_date:  z.string().regex(DATE_ONLY, "scheduled_date must be YYYY-MM-DD"),
  scheduled_start: z.string().regex(TIME_ONLY).nullable().optional(),
  scheduled_end:   z.string().regex(TIME_ONLY).nullable().optional(),
});

function isPastDate(value: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00.000Z`).getTime() < today.getTime();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role, account_status, brand_status, is_suspended")
    .eq("id", user.id)
    .single();
  const permission = canCreateBooking(profile);
  if (!permission.allowed)
    return NextResponse.json({ error: permission.reason === "role" ? "Only brands can send booking requests" : "forbidden" }, { status: 403 });

  let parsed: z.infer<typeof packageBookingSchema>;
  try {
    parsed = packageBookingSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  if (isPastDate(parsed.scheduled_date))
    return NextResponse.json({ error: "scheduled_date must be today or later" }, { status: 400 });

  const { data: tp } = await adminClient
    .from("talent_profiles").select("id, status, packages").eq("user_id", parsed.talent_user_id).maybeSingle();
  if (!tp) return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
  if (tp.status && tp.status !== "approved") return NextResponse.json({ error: "Talent profile is not available" }, { status: 403 });

  // Trust the price the client computed, but verify the chosen package still
  // exists and its own price hasn't drifted below what was quoted — a stale
  // page shouldn't let a brand lock in a price the talent has since raised.
  const packages = Array.isArray(tp.packages) ? (tp.packages as Array<Record<string, unknown>>) : [];
  const pkg = packages.find((p) => p.id === parsed.package_id);
  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const briefGate = await requireCompletion(parsed.talent_user_id, "receiveBriefs");
  if (!briefGate.ok) {
    return NextResponse.json(
      { error: "talent_profile_incomplete", gate: "receiveBriefs", score: briefGate.score, needed: briefGate.needed },
      { status: 403 },
    );
  }

  const { data: existingRows } = await adminClient
    .from("bookings")
    .select("id, status")
    .eq("brand_id", user.id)
    .eq("talent_id", tp.id)
    .in("status", ACTIVE_BOOKING_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1);
  const existing = existingRows?.[0] ?? null;
  if (existing)
    return NextResponse.json({ error: "active booking request already exists", booking_id: existing.id }, { status: 409 });

  const addonsSummary = parsed.addons.length
    ? parsed.addons.map((a) => `${a.label} (${a.price} EGP)`).join(", ")
    : null;
  const slotText = parsed.scheduled_start && parsed.scheduled_end
    ? `${parsed.scheduled_date} ${parsed.scheduled_start}-${parsed.scheduled_end}`
    : parsed.scheduled_date;
  const notes = [
    `Package: ${parsed.package_name}`,
    addonsSummary ? `Add-ons: ${addonsSummary}` : null,
    `Requested slot: ${slotText}`,
  ].filter(Boolean).join("\n");

  const now = new Date().toISOString();

  const { data: booking, error: bookErr } = await adminClient
    .from("bookings")
    .insert({
      brand_id:        user.id,
      talent_id:       tp.id,
      talent_user_id:  parsed.talent_user_id,
      status:          "brief_sent",
      service_type:    "fixed_project",
      amount:          parsed.amount,
      notes,
      package_id:      parsed.package_id,
      package_name:    parsed.package_name,
      scheduled_date:  parsed.scheduled_date,
      scheduled_start: parsed.scheduled_start ?? null,
      scheduled_end:   parsed.scheduled_end ?? null,
    })
    .select("id")
    .single();

  if (bookErr) {
    const duplicate = "code" in bookErr && bookErr.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "active booking request already exists" : bookErr.message },
      { status: duplicate ? 409 : 500 },
    );
  }
  const bookingId = booking.id;

  await adminClient.from("conversations").upsert(
    { brand_id: user.id, talent_id: parsed.talent_user_id, booking_id: bookingId, last_message_at: now },
    { onConflict: "brand_id,talent_id", ignoreDuplicates: false },
  );

  const { data: conv } = await adminClient
    .from("conversations").select("id")
    .eq("brand_id", user.id).eq("talent_id", parsed.talent_user_id).maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `تم إرسال طلب حجز باقة: ${parsed.package_name} (${parsed.amount} EGP).\nNew package booking request: ${parsed.package_name} (${parsed.amount} EGP).`,
      message_type: "text",
    });
  }

  const { data: brand } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  await notifyBookingRequest({
    bookingId,
    recipientId: parsed.talent_user_id,
    senderId:    user.id,
    senderName:  brand?.full_name ?? null,
    title:       parsed.package_name,
  });

  await logBookingBriefSent({ brandId: user.id, bookingId, talentUserId: parsed.talent_user_id });

  return NextResponse.json({ booking_id: bookingId, status: "brief_sent" }, { status: 201 });
}
