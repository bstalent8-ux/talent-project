import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// PATCH — talent accepts or rejects the brief
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: booking } = await adminClient
    .from("bookings")
    .select("brand_id,talent_user_id,talent_id,status")
    .eq("id", id).single();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Must be the talent
  const isTalent = booking.talent_user_id === user.id;
  if (!isTalent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (booking.status !== "brief_sent")
    return NextResponse.json({ error: "No pending brief" }, { status: 400 });

  const { action, reject_reason } = await req.json();
  if (!["accept", "reject"].includes(action))
    return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });

  const briefUpdate: Record<string, unknown> = {
    status:       action === "accept" ? "accepted" : "rejected",
    responded_at: new Date().toISOString(),
  };
  if (action === "reject" && reject_reason) briefUpdate.reject_reason = reject_reason;

  const { error: briefErr } = await adminClient
    .from("booking_briefs")
    .update(briefUpdate)
    .eq("booking_id", id);
  if (briefErr) return NextResponse.json({ error: briefErr.message }, { status: 500 });

  // Update booking status
  const newStatus = action === "accept" ? "accepted" : "contacting";
  await adminClient.from("bookings").update({ status: newStatus }).eq("id", id);

  // Send system message in chat
  const { data: conv } = await adminClient
    .from("conversations")
    .select("id")
    .eq("brand_id", booking.brand_id)
    .eq("talent_id", user.id)
    .maybeSingle();
  if (conv) {
    const msg = action === "accept"
      ? "✅ قبلت الموهبة ملخص المشروع. المرحلة التالية: الدفع.\n✅ Talent accepted the brief. Next: payment."
      : `❌ رفضت الموهبة الملخص${reject_reason ? `: ${reject_reason}` : ""}.\n❌ Talent rejected the brief${reject_reason ? `: ${reject_reason}` : ""}.`;
    await adminClient.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: msg,
      message_type: "text",
    });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
