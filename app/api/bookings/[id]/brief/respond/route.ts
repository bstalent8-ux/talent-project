export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  notifyBookingAccepted,
  notifyBookingDeclined,
  notifyBookingUpdated,
} from "@/lib/notifications/events";

function isNoRows(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

// PATCH — talent accepts, rejects, or requests changes on a booking request.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("brand_id,talent_user_id,talent_id,status")
    .eq("id", id).single();
  if (bookingError) {
    const status = isNoRows(bookingError) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : bookingError.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Must be the talent
  const isTalent = booking.talent_user_id === user.id;
  if (!isTalent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!["pending", "brief_sent", "changes_requested"].includes(booking.status))
    return NextResponse.json({ error: "no pending booking request" }, { status: 400 });

  const { action, reject_reason, message } = await req.json();
  if (!["accept", "reject", "request_changes"].includes(action))
    return NextResponse.json({ error: "action must be accept, reject, or request_changes" }, { status: 400 });
  if (action === "request_changes" && !message?.trim())
    return NextResponse.json({ error: "message required" }, { status: 400 });

  const now = new Date().toISOString();

  const briefUpdate: Record<string, unknown> = {
    status:       action === "accept" ? "accepted" : action === "reject" ? "rejected" : "changes_requested",
    responded_at: now,
  };
  if (action === "reject" && reject_reason) briefUpdate.reject_reason = reject_reason;
  if (action === "request_changes") briefUpdate.reject_reason = message.trim();

  const { error: briefErr } = await adminClient
    .from("booking_briefs")
    .update(briefUpdate)
    .eq("booking_id", id);
  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  // Update booking status. bookings has no updated_at/negotiation_message/
  // negotiation_requested_at columns (confirmed against the live schema,
  // same drift as app/api/bookings/direct's note) — this used to make
  // every accept/reject/request-changes call 500. The negotiation message
  // is already captured on booking_briefs.reject_reason above, so nothing
  // is lost by not writing it here too.
  const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "changes_requested";
  const { error: bookingErr } = await adminClient.from("bookings").update({ status: newStatus }).eq("id", id);
  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 });

  // Send system message in chat
  const { data: conv, error: convError } = await adminClient
    .from("conversations")
    .select("id")
    .eq("brand_id", booking.brand_id)
    .eq("talent_id", user.id)
    .maybeSingle();
  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });
  if (conv) {
    const msg = action === "accept"
      ? "قبلت الموهبة طلب الحجز. المرحلة التالية: الدفع.\nTalent accepted the booking request. Next: payment."
      : action === "reject"
        ? `رفضت الموهبة طلب الحجز${reject_reason ? `: ${reject_reason}` : ""}.\nTalent rejected the booking request${reject_reason ? `: ${reject_reason}` : ""}.`
        : `طلبت الموهبة تعديلات: ${message.trim()}\nTalent requested changes: ${message.trim()}`;
    const { error: messageError } = await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: msg,
      message_type: "text",
    });
    if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  // Notify brand of talent's response
  const { data: talent, error: talentError } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  if (talentError) {
    console.error("Failed to load talent name for booking response notification:", talentError.message);
  }
  const talentName = talent?.full_name ?? null;

  if (action === "accept") {
    await notifyBookingAccepted({
      bookingId:   id,
      recipientId: booking.brand_id,
      senderId:    user.id,
      senderName:  talentName,
    });
  } else if (action === "reject") {
    await notifyBookingDeclined({
      bookingId:   id,
      recipientId: booking.brand_id,
      senderId:    user.id,
      senderName:  talentName,
      reason:      reject_reason ?? null,
    });
  } else {
    await notifyBookingUpdated({
      bookingId:   id,
      recipientId: booking.brand_id,
      senderId:    user.id,
      titleAr:     "طلبت الموهبة تعديلات",
      titleEn:     "Talent requested changes",
      messageAr:   message.trim(),
      messageEn:   message.trim(),
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
