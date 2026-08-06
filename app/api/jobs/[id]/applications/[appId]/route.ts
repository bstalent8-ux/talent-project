export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyApplicationAccepted, notifyApplicationRejected } from "@/lib/notifications/events";
import { privateNoStoreHeaders } from "@/lib/cache";
import { ProfileError, profileService } from "@/features/profiles";

// PATCH /api/jobs/[id]/applications/[appId]
// body: { action: "accept" | "reject", reject_reason?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: jobId, appId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  // Verify caller owns the job
  const { data: job, error: jobError } = await adminClient
    .from("jobs").select("id, brand_id, currency, title").eq("id", jobId).single();
  if (jobError) {
    const status = jobError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "job not found" : jobError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404, headers: privateNoStoreHeaders() });
  if (job.brand_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { data: app, error: appError } = await adminClient
    .from("job_applications")
    .select("id, talent_id, proposed_price, status")
    .eq("id", appId).eq("job_id", jobId).single();
  if (appError) {
    const status = appError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "application not found" : appError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (!app) return NextResponse.json({ error: "application not found" }, { status: 404, headers: privateNoStoreHeaders() });

  const { action, reject_reason } = await req.json();

  // ─── REJECT ─────────────────────────────────────────────────────────────────
  if (action === "reject") {
    const { error } = await adminClient
      .from("job_applications")
      .update({ status: "rejected", reject_reason: reject_reason ?? null })
      .eq("id", appId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

    await notifyApplicationRejected({
      jobId,
      jobTitle:      job.title,
      applicationId: appId,
      talentId:      app.talent_id,
      brandId:       user.id,
      reason:        reject_reason ?? null,
    });

    return NextResponse.json({ success: true, status: "rejected" }, { headers: privateNoStoreHeaders() });
  }

  // ─── ACCEPT ─────────────────────────────────────────────────────────────────
  if (action === "accept") {
    // 1. Mark application accepted
    const { error: appErr } = await adminClient
      .from("job_applications")
      .update({ status: "accepted" })
      .eq("id", appId);
    if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500, headers: privateNoStoreHeaders() });

    // 2. Resolve the applicant's provider row (bookings FK references
    //    talent_profiles.id). Lookup mechanism only — the booking created below
    //    still writes this value to bookings.talent_id unchanged.
    let talentProfile: { id: string } | null = null;
    try {
      const ref = await profileService.resolveProviderRef(app.talent_id, "talent");
      talentProfile = ref ? { id: ref.providerProfileId } : null;
    } catch (e) {
      const err = ProfileError.from(e);
      console.error("[applications/:appId] provider ref lookup failed", err.code, err.internal);
      return NextResponse.json(err.toBody(), { status: err.status, headers: privateNoStoreHeaders() });
    }
    if (!talentProfile) return NextResponse.json({ error: "talent profile not found" }, { status: 404, headers: privateNoStoreHeaders() });

    // 3. Determine service_type from job category
    const { data: fullJob, error: fullJobError } = await adminClient
      .from("jobs").select("category").eq("id", jobId).single();
    if (fullJobError) return NextResponse.json({ error: fullJobError.message }, { status: 500, headers: privateNoStoreHeaders() });
    const service_type = fullJob?.category ?? null;

    // 4. Create booking
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

    if (bookErr || !booking) {
      return NextResponse.json({ error: bookErr?.message ?? "booking creation failed" }, { status: 500, headers: privateNoStoreHeaders() });
    }
    const bookingId = booking.id;

    // 4. Create / get conversation between brand and talent
    const { data: conversation, error: convErr } = await adminClient
      .from("conversations")
      .upsert(
        { brand_id: user.id, talent_id: app.talent_id, booking_id: bookingId },
        { onConflict: "brand_id,talent_id", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500, headers: privateNoStoreHeaders() });

    // 5. Send system message in conversation
    const messageInsert = await adminClient.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: `✅ تم قبول عرضك للوظيفة. دعنا نبدأ!\n✅ Your proposal was accepted. Let's get started!`,
      message_type: "text",
    });
    if (messageInsert.error) {
      return NextResponse.json({ error: messageInsert.error.message }, { status: 500, headers: privateNoStoreHeaders() });
    }

    await notifyApplicationAccepted({
      jobId,
      jobTitle:      job.title,
      applicationId: appId,
      talentId:      app.talent_id,
      brandId:       user.id,
      bookingId,
    });

    return NextResponse.json({
      success: true,
      status: "accepted",
      conversation_id: conversation.id,
      booking_id: bookingId,
    }, { headers: privateNoStoreHeaders() });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400, headers: privateNoStoreHeaders() });
}
