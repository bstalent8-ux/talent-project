export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyBookingRequest } from "@/lib/notifications/events";

function isNoRows(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

// GET — get brief for booking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings").select("brand_id,talent_user_id,talent_id").eq("id", id).single();
  if (bookingError) {
    const status = isNoRows(bookingError) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : bookingError.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  const allowed = booking.brand_id === user.id || booking.talent_user_id === user.id;
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: brief, error: briefError } = await adminClient
    .from("booking_briefs").select("*").eq("booking_id", id).maybeSingle();
  if (briefError) return NextResponse.json({ error: briefError.message }, { status: 500 });

  return NextResponse.json({ brief });
}

// POST — brand sends brief → moves booking to brief_sent
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings").select("brand_id,talent_user_id,status").eq("id", id).single();
  if (bookingError) {
    const status = isNoRows(bookingError) ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : bookingError.message }, { status });
  }
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!["contacting"].includes(booking.status))
    return NextResponse.json({ error: "Can only send brief from contacting status" }, { status: 400 });

  const body = await req.json();
  const { title, description, requirements, attachments, deadline } = body;
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  // Upsert brief (replace if re-sending)
  const { data: brief, error: briefErr } = await adminClient
    .from("booking_briefs")
    .upsert({
      booking_id:   id,
      title,
      description:  description ?? null,
      requirements: requirements ?? null,
      attachments:  attachments  ?? null,
      deadline:     deadline     ?? null,
      status:       "pending",
      reject_reason: null,
      responded_at: null,
    }, { onConflict: "booking_id" })
    .select("*")
    .single();

  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  // Move booking to brief_sent
  const { error: bookingUpdateError } = await adminClient.from("bookings").update({ status: "brief_sent" }).eq("id", id);
  if (bookingUpdateError) return NextResponse.json({ error: bookingUpdateError.message }, { status: 500 });

  // Notify talent via chat — must be scoped to THIS talent, otherwise the brand's
  // other conversations match and the message lands in the wrong thread.
  const convRes = booking.talent_user_id
    ? await adminClient
        .from("conversations").select("id")
        .eq("brand_id", user.id)
        .eq("talent_id", booking.talent_user_id)
        .maybeSingle()
    : { data: null, error: null };
  if (convRes.error) return NextResponse.json({ error: convRes.error.message }, { status: 500 });
  if (convRes.data) {
    const { error: messageError } = await adminClient.from("messages").insert({
      conversation_id: convRes.data.id,
      sender_id: user.id,
      content: `📋 تم إرسال ملخص المشروع: "${title}"\n📋 Project brief sent: "${title}"`,
      message_type: "text",
    });
    if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  // Notify talent about new brief
  if (booking.talent_user_id) {
    const { data: brand, error: brandError } = await adminClient
      .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    if (brandError) {
      console.error("Failed to load brand name for booking notification:", brandError.message);
    }

    await notifyBookingRequest({
      bookingId:   id,
      recipientId: booking.talent_user_id,
      senderId:    user.id,
      senderName:  brand?.full_name ?? null,
      title,
    });
  }

  return NextResponse.json({ brief, status: "brief_sent" });
}
