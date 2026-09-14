export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  notifyBookingAccepted,
  notifyBookingDeclined,
  notifyBookingUpdated,
} from "@/lib/notifications/events";

const respondSchema = z.object({
  action: z.enum(["accept", "reject", "request_changes", "propose_price", "accept_price"]),
  reject_reason: z.string().max(2000).nullish(),
  message: z.string().max(2000).nullish(),
  // propose_price only — the number being put on the table. Same floor as
  // the initial custom-brief range (app/api/bookings/direct/schema.ts).
  amount: z.coerce.number().min(500).max(10_000_000).nullish(),
});

function isNoRows(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

async function sendSystemMessage(brandId: string, talentUserId: string, senderId: string, content: string) {
  const { data: conv } = await adminClient
    .from("conversations").select("id")
    .eq("brand_id", brandId).eq("talent_id", talentUserId).maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id, sender_id: senderId, content, message_type: "text",
    });
  }
}

// PATCH — brand/talent respond to a booking request.
//
// "accept" | "reject" | "request_changes" — talent-only, act on the BRIEF
// CONTENT (Flow 2's original description/deadline). Unchanged from before.
//
// "propose_price" | "accept_price" — either party, Flow 2's price
// negotiation (a custom-range booking has no fixed `amount` yet — see
// PackageBookingModal.tsx's header comment for why Flow 1 never reaches this
// branch at all). Whoever proposes a number acks it themselves and clears
// the other side's ack; once both are true the app locks `amount` in from
// `proposed_amount` — the same column payments.amount and increment_balance
// read from (CLAUDE.md's Manual Payment Proof Flow section) — and moves the
// booking to "accepted".
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
    .select("brand_id,talent_user_id,talent_id,status,proposed_amount,proposed_by,brand_price_ack,talent_price_ack,budget_min,budget_max")
    .eq("id", id).single();
  if (bookingError) {
    const status = isNoRows(bookingError) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : bookingError.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isTalent = booking.talent_user_id === user.id;
  const isBrand  = booking.brand_id === user.id;
  if (!isTalent && !isBrand) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!["pending", "brief_sent", "changes_requested"].includes(booking.status))
    return NextResponse.json({ error: "no pending booking request" }, { status: 400 });

  const parsed = respondSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  const { action, reject_reason, message, amount } = parsed.data;

  // ── Price negotiation (either party) ──────────────────────────────────
  if (action === "propose_price" || action === "accept_price") {
    const myRole: "brand" | "talent" = isBrand ? "brand" : "talent";
    const otherRecipientId = isBrand ? booking.talent_user_id! : booking.brand_id;

    if (action === "propose_price") {
      if (amount == null) return NextResponse.json({ error: "amount required" }, { status: 400 });

      const { error: updErr } = await adminClient.from("bookings").update({
        proposed_amount:  amount,
        proposed_by:      myRole,
        brand_price_ack:  myRole === "brand",
        talent_price_ack: myRole === "talent",
      }).eq("id", id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      await sendSystemMessage(booking.brand_id, booking.talent_user_id!, user.id,
        `اقترح ${myRole === "brand" ? "البراند" : "الموهبة"} سعر ${amount.toLocaleString()} EGP${message ? `: ${message}` : ""}.\n${myRole === "brand" ? "Brand" : "Talent"} proposed ${amount.toLocaleString()} EGP${message ? `: ${message}` : ""}.`);

      await notifyBookingUpdated({
        bookingId: id, recipientId: otherRecipientId!, senderId: user.id,
        titleAr: "اقتراح سعر جديد", titleEn: "New price proposal",
        messageAr: `${amount.toLocaleString()} جنيه`, messageEn: `${amount.toLocaleString()} EGP`,
      });

      return NextResponse.json({ success: true, status: booking.status, proposed_amount: amount });
    }

    // accept_price
    if (booking.proposed_amount == null)
      return NextResponse.json({ error: "no price has been proposed yet" }, { status: 400 });

    const nextBrandAck  = myRole === "brand" ? true : booking.brand_price_ack;
    const nextTalentAck = myRole === "talent" ? true : booking.talent_price_ack;
    const bothAgreed = nextBrandAck && nextTalentAck;

    const update: Record<string, unknown> = {
      brand_price_ack: nextBrandAck,
      talent_price_ack: nextTalentAck,
    };
    if (bothAgreed) {
      update.amount = booking.proposed_amount;
      update.status = "accepted";
    }

    const { error: updErr } = await adminClient.from("bookings").update(update).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    if (bothAgreed) {
      await adminClient.from("booking_briefs").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("booking_id", id);
      await sendSystemMessage(booking.brand_id, booking.talent_user_id!, user.id,
        `اتفق الطرفان على ${booking.proposed_amount.toLocaleString()} EGP. المرحلة التالية: الدفع.\nBoth sides agreed on ${booking.proposed_amount.toLocaleString()} EGP. Next: payment.`);
      await notifyBookingAccepted({ bookingId: id, recipientId: otherRecipientId!, senderId: user.id, senderName: null });
    } else {
      await sendSystemMessage(booking.brand_id, booking.talent_user_id!, user.id,
        `وافق ${myRole === "brand" ? "البراند" : "الموهبة"} على ${booking.proposed_amount.toLocaleString()} EGP — في انتظار الطرف التاني.\n${myRole === "brand" ? "Brand" : "Talent"} accepted ${booking.proposed_amount.toLocaleString()} EGP — waiting on the other side.`);
    }

    return NextResponse.json({ success: true, status: bothAgreed ? "accepted" : booking.status, finalized: bothAgreed });
  }

  // ── Brief content response (talent-only, unchanged) ────────────────────
  if (!isTalent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (action === "request_changes" && !message?.trim())
    return NextResponse.json({ error: "message required" }, { status: 400 });

  const now = new Date().toISOString();

  const briefUpdate: Record<string, unknown> = {
    status:       action === "accept" ? "accepted" : action === "reject" ? "rejected" : "changes_requested",
    responded_at: now,
  };
  if (action === "reject" && reject_reason) briefUpdate.reject_reason = reject_reason;
  if (action === "request_changes") briefUpdate.reject_reason = (message ?? "").trim();

  const { error: briefErr } = await adminClient
    .from("booking_briefs")
    .update(briefUpdate)
    .eq("booking_id", id);
  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "changes_requested";
  const { error: bookingErr } = await adminClient.from("bookings").update({ status: newStatus }).eq("id", id);
  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 });

  const chatMsg = action === "accept"
    ? "قبلت الموهبة طلب الحجز. المرحلة التالية: الدفع.\nTalent accepted the booking request. Next: payment."
    : action === "reject"
      ? `رفضت الموهبة طلب الحجز${reject_reason ? `: ${reject_reason}` : ""}.\nTalent rejected the booking request${reject_reason ? `: ${reject_reason}` : ""}.`
      : `طلبت الموهبة تعديلات: ${(message ?? "").trim()}\nTalent requested changes: ${(message ?? "").trim()}`;
  await sendSystemMessage(booking.brand_id, booking.talent_user_id!, user.id, chatMsg);

  const { data: talent } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const talentName = talent?.full_name ?? null;

  if (action === "accept") {
    await notifyBookingAccepted({ bookingId: id, recipientId: booking.brand_id, senderId: user.id, senderName: talentName });
  } else if (action === "reject") {
    await notifyBookingDeclined({ bookingId: id, recipientId: booking.brand_id, senderId: user.id, senderName: talentName, reason: reject_reason ?? null });
  } else {
    await notifyBookingUpdated({
      bookingId: id, recipientId: booking.brand_id, senderId: user.id,
      titleAr: "طلبت الموهبة تعديلات", titleEn: "Talent requested changes",
      messageAr: (message ?? "").trim(), messageEn: (message ?? "").trim(),
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
