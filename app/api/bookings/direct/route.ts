import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// POST — brand sends a direct brief to a talent (no job posting required)
// Body: { talent_user_id, title, description?, requirements?, attachments?, deadline? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "brand")
    return NextResponse.json({ error: "Only brands can send briefs" }, { status: 403 });

  const { talent_user_id, title, description, requirements, attachments, deadline } = await req.json();
  if (!talent_user_id) return NextResponse.json({ error: "talent_user_id required" }, { status: 400 });
  if (!title?.trim())  return NextResponse.json({ error: "title required" }, { status: 400 });

  // Get talent_profiles row (booking FK requires talent_profiles.id)
  const { data: tp } = await adminClient
    .from("talent_profiles").select("id, category").eq("user_id", talent_user_id).maybeSingle();
  if (!tp) return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });

  // Check if booking already exists between this brand and talent (prevent duplicates)
  const { data: existing } = await adminClient
    .from("bookings")
    .select("id")
    .eq("brand_id", user.id)
    .eq("talent_id", tp.id)
    .not("status", "eq", "cancelled")
    .maybeSingle();

  let bookingId: string;

  if (existing) {
    bookingId = existing.id;
  } else {
    const { data: booking, error: bookErr } = await adminClient
      .from("bookings")
      .insert({
        brand_id:  user.id,
        talent_id: tp.id,
        status:    "brief_sent",
      })
      .select("id").single();

    if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 });
    bookingId = booking.id;

    // Create conversation
    await adminClient.from("conversations").upsert(
      { brand_id: user.id, talent_id: talent_user_id, booking_id: bookingId },
      { onConflict: "brand_id,talent_id", ignoreDuplicates: false }
    );
  }

  // Upsert brief
  const { data: brief, error: briefErr } = await adminClient
    .from("booking_briefs")
    .upsert({
      booking_id:   bookingId,
      title:        title.trim(),
      description:  description?.trim() || null,
      requirements: requirements?.trim() || null,
      attachments:  attachments?.length ? attachments : null,
      deadline:     deadline || null,
      status:       "pending",
      reject_reason: null,
      responded_at: null,
    }, { onConflict: "booking_id" })
    .select("*").single();

  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  // Ensure booking is brief_sent
  await adminClient.from("bookings").update({ status: "brief_sent" }).eq("id", bookingId);

  // Send system message
  const { data: conv } = await adminClient
    .from("conversations").select("id")
    .eq("brand_id", user.id).eq("talent_id", talent_user_id).maybeSingle();
  if (conv) {
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: `📋 تم إرسال ملخص مشروع جديد: "${title.trim()}"\n📋 New project brief sent: "${title.trim()}"`,
      message_type: "text",
    });
  }

  return NextResponse.json({ booking_id: bookingId, brief });
}
