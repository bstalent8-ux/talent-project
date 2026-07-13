import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// GET — get brief for booking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings").select("brand_id,talent_user_id,talent_id").eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  const allowed = booking.brand_id === user.id || booking.talent_user_id === user.id;
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: brief } = await adminClient
    .from("booking_briefs").select("*").eq("booking_id", id).maybeSingle();

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

  const { data: booking } = await adminClient
    .from("bookings").select("brand_id,status").eq("id", id).single();
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
  await adminClient.from("bookings").update({ status: "brief_sent" }).eq("id", id);

  // Notify talent via chat
  const { data: conv } = await adminClient
    .from("conversations").select("id").eq("brand_id", user.id).maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `📋 تم إرسال ملخص المشروع: "${title}"\n📋 Project brief sent: "${title}"`,
      message_type: "text",
    });
  }

  return NextResponse.json({ brief, status: "brief_sent" });
}
