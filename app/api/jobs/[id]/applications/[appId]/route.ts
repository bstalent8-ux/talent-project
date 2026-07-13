import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// PATCH /api/jobs/[id]/applications/[appId]
// body: { action: "accept" | "reject", reject_reason?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: jobId, appId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Verify caller owns the job
  const { data: job } = await adminClient
    .from("jobs").select("id, brand_id, currency").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  if (job.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: app } = await adminClient
    .from("job_applications")
    .select("id, talent_id, proposed_price, status")
    .eq("id", appId).eq("job_id", jobId).single();
  if (!app) return NextResponse.json({ error: "application not found" }, { status: 404 });

  const { action, reject_reason } = await req.json();

  // ─── REJECT ─────────────────────────────────────────────────────────────────
  if (action === "reject") {
    const { error } = await adminClient
      .from("job_applications")
      .update({ status: "rejected", reject_reason: reject_reason ?? null })
      .eq("id", appId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: "rejected" });
  }

  // ─── ACCEPT ─────────────────────────────────────────────────────────────────
  if (action === "accept") {
    // 1. Mark application accepted
    const { error: appErr } = await adminClient
      .from("job_applications")
      .update({ status: "accepted" })
      .eq("id", appId);
    if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

    // 2. Try to find talent_profiles row (bookings FK references talent_profiles.id)
    const { data: talentProfile } = await adminClient
      .from("talent_profiles")
      .select("id")
      .eq("user_id", app.talent_id)
      .maybeSingle();

    // 3. Determine service_type from job category
    const { data: fullJob } = await adminClient
      .from("jobs").select("category").eq("id", jobId).single();
    const service_type = fullJob?.category ?? null;

    // 4. Create booking
    let bookingId: string | null = null;
    if (talentProfile) {
      const { data: booking, error: bookErr } = await adminClient
        .from("bookings")
        .insert({
          brand_id:           user.id,
          talent_id:          talentProfile.id,
          talent_user_id:     app.talent_id,
          job_id:             jobId,
          job_application_id: appId,
          service_type,
          status:             "contacting",
          amount:             app.proposed_price ?? null,
        })
        .select("id")
        .single();

      if (!bookErr && booking) bookingId = booking.id;
    }

    // 4. Create / get conversation between brand and talent
    const { data: conversation, error: convErr } = await adminClient
      .from("conversations")
      .upsert(
        { brand_id: user.id, talent_id: app.talent_id, booking_id: bookingId },
        { onConflict: "brand_id,talent_id", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

    // 5. Send system message in conversation
    await adminClient.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: `✅ تم قبول عرضك للوظيفة. دعنا نبدأ!\n✅ Your proposal was accepted. Let's get started!`,
      message_type: "text",
    });

    return NextResponse.json({
      success: true,
      status: "accepted",
      conversation_id: conversation.id,
      booking_id: bookingId,
    });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
