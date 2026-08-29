export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyBookingRequest } from "@/lib/notifications/events";
import { logBookingBriefSent } from "@/lib/events/events";
import { canCreateBooking } from "@/lib/permissions";

const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "changes_requested",
  "accepted",
  "payment_pending",
  "in_progress",
  "brief_sent",
  "contacting",
];

const SERVICE_TYPES = ["hourly", "daily", "fixed_project"] as const;

type ServiceType = typeof SERVICE_TYPES[number];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function dateOnly(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : value;
}

function isPastDate(value: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const candidate = new Date(`${value}T00:00:00.000Z`);
  return candidate.getTime() < today.getTime();
}

// DirectBriefModal.tsx already validates all of this client-side (see its
// own `validate()`) — this is the server-side backstop for a direct caller,
// so it re-enforces the same rules rather than trusting the client's copy.
// Genuinely new here: brief/attachments length caps and a budget ceiling —
// neither existed at any layer before.
export const bookingSchema = z.object({
  talent_user_id: z.string().uuid(),
  service_type:   z.enum(SERVICE_TYPES),
  start_date:     z.string().regex(DATE_ONLY, "start_date must be YYYY-MM-DD"),
  duration:       z.coerce.number().int().positive().nullable().optional(),
  deadline:       z.string().regex(DATE_ONLY, "deadline must be YYYY-MM-DD").nullable().optional(),
  budget_amount:  z.coerce.number().positive().max(10_000_000),
  brief:          z.string().trim().min(1).max(5000),
  attachments:    z.array(z.string().url()).max(10).nullable().optional(),
});

// POST — brand sends a structured booking request to a talent.
// Body: { talent_user_id, service_type, start_date, duration?, deadline?, budget_amount, brief, attachments? }
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
    return NextResponse.json({ error: permission.reason === "role" ? "Only brands can send briefs" : "forbidden" }, { status: 403 });

  let parsed: z.infer<typeof bookingSchema>;
  try {
    parsed = bookingSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const {
    talent_user_id,
    service_type: serviceType,
    duration: numericDuration,
    budget_amount: numericBudget,
    brief: briefText,
    attachments,
  } = parsed;

  const startDate = dateOnly(parsed.start_date);
  const deadlineDate = dateOnly(parsed.deadline);

  if (!startDate) return NextResponse.json({ error: "start_date required" }, { status: 400 });
  if (isPastDate(startDate)) return NextResponse.json({ error: "start_date must be today or later" }, { status: 400 });
  if ((serviceType === "hourly" || serviceType === "daily") && !(numericDuration && numericDuration > 0))
    return NextResponse.json({ error: "duration must be a positive number" }, { status: 400 });
  if (serviceType === "fixed_project" && !deadlineDate)
    return NextResponse.json({ error: "deadline required" }, { status: 400 });
  if (deadlineDate && new Date(`${deadlineDate}T00:00:00.000Z`) < new Date(`${startDate}T00:00:00.000Z`))
    return NextResponse.json({ error: "deadline must be after start_date" }, { status: 400 });

  // Get talent_profiles row (booking FK requires talent_profiles.id)
  const { data: tp } = await adminClient
    .from("talent_profiles").select("id, category, status").eq("user_id", talent_user_id).maybeSingle();
  if (!tp) return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
  if (tp.status && tp.status !== "approved") return NextResponse.json({ error: "Talent profile is not available" }, { status: 403 });

  // Prevent duplicate active requests between this brand and talent.
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

  const now = new Date().toISOString();
  const title = serviceType === "hourly"
    ? "Hourly booking request"
    : serviceType === "daily"
      ? "Daily booking request"
      : "Fixed project booking request";

  // bookings has no budget_type/budget_amount/start_date/duration/deadline/
  // updated_at columns (confirmed against the live schema — CLAUDE.md §7
  // lists id/talent_id/brand_id/status/service_type/amount/notes/brief_url/
  // paid_at/completed_at, nothing else). Writing those non-existent columns
  // made every real submit 500 with "Could not find the 'budget_amount'
  // column of 'bookings' in the schema cache" — this was broken for every
  // brand on every talent profile, not a UGC-specific or auth-continuation
  // bug. `amount` is the one real budget column; deadline is already
  // captured correctly below in booking_briefs.deadline (a real column).
  // status "pending" also violates bookings_status_check — the live check
  // constraint only allows CLAUDE.md §10.1's documented flow (contacting →
  // brief_sent → accepted → payment_pending → in_progress → completed →
  // paid, plus cancelled). "brief_sent" is that flow's documented starting
  // status for a fresh direct brief, confirmed against real rows in the
  // table (no row anywhere has status "pending").
  // start_date/duration have no live column to hold them and are dropped
  // rather than invented a home for.
  const { data: booking, error: bookErr } = await adminClient
    .from("bookings")
    .insert({
      brand_id:       user.id,
      talent_id:      tp.id,
      talent_user_id: talent_user_id,
      status:         "brief_sent",
      service_type:   serviceType,
      amount:         numericBudget,
      notes:          briefText.trim(),
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

  // Create or update the conversation pointer.
  await adminClient.from("conversations").upsert(
    { brand_id: user.id, talent_id: talent_user_id, booking_id: bookingId, last_message_at: now },
    { onConflict: "brand_id,talent_id", ignoreDuplicates: false }
  );

  // Upsert brief
  const { data: brief, error: briefErr } = await adminClient
    .from("booking_briefs")
    .upsert({
      booking_id:   bookingId,
      title:        title.trim(),
      description:  briefText.trim(),
      requirements: null,
      attachments:  attachments?.length ? attachments : null,
      deadline:     deadlineDate,
      status:       "pending",
      reject_reason: null,
      responded_at: null,
    }, { onConflict: "booking_id" })
    .select("*").single();

  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  // Send system message
  const { data: conv } = await adminClient
    .from("conversations").select("id")
    .eq("brand_id", user.id).eq("talent_id", talent_user_id).maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `تم إرسال طلب حجز جديد.\nNew booking request sent.`,
      message_type: "text",
    });
  }

  const { data: brand } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  await notifyBookingRequest({
    bookingId,
    recipientId: talent_user_id,
    senderId:    user.id,
    senderName:  brand?.full_name ?? null,
    title:       brief?.title ?? null,
  });

  await logBookingBriefSent({ brandId: user.id, bookingId, talentUserId: talent_user_id });

  return NextResponse.json({ booking_id: bookingId, brief, status: "brief_sent" }, { status: 201 });
}
