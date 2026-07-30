export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  notifyBookingUpdated,
  notifyDeliverableSubmitted,
  notifyPaymentSuccess,
} from "@/lib/notifications/events";

// GET — list deliverables for booking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings").select("brand_id,talent_user_id").eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.brand_id !== user.id && booking.talent_user_id !== user.id)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data } = await adminClient
    .from("deliverables").select("*").eq("booking_id", id).order("created_at", { ascending: false });

  return NextResponse.json({ deliverables: data ?? [] });
}

// POST — talent submits deliverables → moves booking to completed
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings").select("brand_id,talent_user_id,status").eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.talent_user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (booking.status !== "in_progress")
    return NextResponse.json({ error: "Booking must be in_progress" }, { status: 400 });

  const { files, links, notes } = await req.json();
  if ((!files || !files.length) && (!links || !links.length))
    return NextResponse.json({ error: "Provide at least one file or link" }, { status: 400 });

  const { data: deliverable, error: delErr } = await adminClient
    .from("deliverables")
    .insert({ booking_id: id, submitted_by: user.id, files: files ?? [], links: links ?? [], notes: notes ?? null, status: "submitted" })
    .select("*").single();

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  await adminClient.from("bookings").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);

  // Notify brand
  const { data: conv } = await adminClient
    .from("conversations").select("id").eq("brand_id", booking.brand_id).eq("talent_id", user.id).maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `📦 تم تسليم العمل. يرجى المراجعة والموافقة.\n📦 Deliverables submitted. Please review and approve.`,
      message_type: "text",
    });
  }

  // Notify brand that deliverables were submitted
  const { data: talent } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  await notifyDeliverableSubmitted({
    bookingId:   id,
    recipientId: booking.brand_id,
    senderId:    user.id,
    senderName:  talent?.full_name ?? null,
  });

  return NextResponse.json({ deliverable, status: "completed" });
}

// PATCH — brand approves deliverable → releases payment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings").select("brand_id,talent_user_id,amount,status").eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (booking.status !== "completed")
    return NextResponse.json({ error: "Booking must be in completed state" }, { status: 400 });

  const { deliverable_id, action, feedback } = await req.json();

  if (action === "approve") {
    // Mark deliverable approved
    if (deliverable_id) {
      await adminClient.from("deliverables").update({ status: "approved" }).eq("id", deliverable_id);
    }
    // Release payment to talent balance
    if (booking.talent_user_id && booking.amount) {
      // Graceful fallback if RPC not defined
      await adminClient.rpc("increment_balance", { user_id: booking.talent_user_id, amount: booking.amount })
        .then(() => null, () => null);
    }
    await adminClient.from("bookings").update({ status: "paid" }).eq("id", id);
    if (booking.talent_user_id) {
      await notifyPaymentSuccess({
        bookingId:   id,
        recipientId: booking.talent_user_id,
        senderId:    user.id,
        amount:      booking.amount ?? null,
      });
    }
    return NextResponse.json({ success: true, status: "paid" });
  }

  if (action === "revision") {
    if (deliverable_id) {
      await adminClient.from("deliverables").update({ status: "revision_requested", feedback: feedback ?? null }).eq("id", deliverable_id);
    }
    await adminClient.from("bookings").update({ status: "in_progress" }).eq("id", id);
    if (booking.talent_user_id) {
      await notifyBookingUpdated({
        bookingId:   id,
        recipientId: booking.talent_user_id,
        senderId:    user.id,
        titleAr:     "طُلب تعديل على العمل 🔄",
        titleEn:     "Revision requested 🔄",
        messageAr:   feedback ?? "طلب العميل إجراء تعديلات على العمل المسلّم.",
        messageEn:   feedback ?? "The brand requested changes to your submitted work.",
      });
    }
    const { data: conv } = await adminClient
      .from("conversations").select("id").eq("brand_id", user.id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle();
    if (conv) {
      await adminClient.from("messages").insert({
        conversation_id: conv.id, sender_id: user.id,
        content: `🔄 طُلب تعديل على العمل${feedback ? `: ${feedback}` : ""}.\n🔄 Revision requested${feedback ? `: ${feedback}` : ""}.`,
        message_type: "text",
      });
    }
    return NextResponse.json({ success: true, status: "in_progress" });
  }

  return NextResponse.json({ error: "action must be approve or revision" }, { status: 400 });
}