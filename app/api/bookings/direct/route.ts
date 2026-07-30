export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyBookingRequest } from "@/lib/notifications/events";
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

function budgetTypeFor(serviceType: ServiceType) {
  if (serviceType === "hourly") return "hourly_rate";
  if (serviceType === "daily") return "daily_rate";
  return "project_budget";
}

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

  const body = await req.json();
  const {
    talent_user_id,
    service_type,
    start_date,
    duration,
    deadline,
    budget_amount,
    brief: briefText,
    attachments,
  } = body;

  if (!talent_user_id) return NextResponse.json({ error: "talent_user_id required" }, { status: 400 });
  if (!SERVICE_TYPES.includes(service_type))
    return NextResponse.json({ error: "invalid service_type" }, { status: 400 });

  const serviceType = service_type as ServiceType;
  const startDate = dateOnly(start_date);
  const deadlineDate = dateOnly(deadline);
  const numericBudget = Number(budget_amount);
  const numericDuration = duration === null || duration === undefined || duration === "" ? null : Number(duration);

  if (!startDate) return NextResponse.json({ error: "start_date required" }, { status: 400 });
  if (isPastDate(startDate)) return NextResponse.json({ error: "start_date must be today or later" }, { status: 400 });
  if (!Number.isFinite(numericBudget) || numericBudget <= 0)
    return NextResponse.json({ error: "budget_amount must be greater than 0" }, { status: 400 });
  if (!briefText?.trim()) return NextResponse.json({ error: "brief required" }, { status: 400 });
  if ((serviceType === "hourly" || serviceType === "daily") && (!Number.isInteger(numericDuration) || numericDuration <= 0))
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

  const { data: booking, error: bookErr } = await adminClient
    .from("bookings")
    .insert({
      brand_id:       user.id,
      talent_id:      tp.id,
      talent_user_id: talent_user_id,
      status:         "pending",
      service_type:   serviceType,
      budget_type:    budgetTypeFor(serviceType),
      budget_amount:  numericBudget,
      amount:         numericBudget,
      start_date:     startDate,
      duration:       serviceType === "fixed_project" ? null : numericDuration,
      deadline:       deadlineDate,
      notes:          briefText.trim(),
      updated_at:     now,
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

  return NextResponse.json({ booking_id: bookingId, brief, status: "pending" }, { status: 201 });
}
