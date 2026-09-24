export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyOfferApplicationAccepted, notifyOfferApplicationRejected } from "@/lib/notifications/events";
import { privateNoStoreHeaders } from "@/lib/cache";
import { ProfileError, profileService } from "@/features/profiles";

// PATCH /api/community/posts/[id]/applications/[appId]
// body: { action: "accept" | "reject", reject_reason?: string }
// Mirrors PATCH /api/jobs/[id]/applications/[appId] exactly, with the roles
// reversed: the TALENT (post owner) accepts a BRAND's application. On accept,
// this writes to the SAME bookings table via the new (additive, nullable)
// community_post_id/community_post_application_id columns — jobs' own
// job_id/job_application_id columns and conversion logic are untouched.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: postId, appId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  // Verify caller owns the post (the talent).
  const { data: post, error: postError } = await adminClient
    .from("community_posts").select("id, user_id, category, title").eq("id", postId).single();
  if (postError) {
    const status = postError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "post not found" : postError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (post.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { data: app, error: appError } = await adminClient
    .from("community_post_applications")
    .select("id, brand_id, proposed_price, status")
    .eq("id", appId).eq("post_id", postId).single();
  if (appError) {
    const status = appError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "application not found" : appError.message }, { status, headers: privateNoStoreHeaders() });
  }
  if (!app) return NextResponse.json({ error: "application not found" }, { status: 404, headers: privateNoStoreHeaders() });

  const { action, reject_reason } = await req.json();

  // ─── REJECT ─────────────────────────────────────────────────────────────
  if (action === "reject") {
    const { error } = await adminClient
      .from("community_post_applications")
      .update({ status: "rejected", reject_reason: reject_reason ?? null })
      .eq("id", appId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });

    await notifyOfferApplicationRejected({
      postId,
      title:         post.title,
      applicationId: appId,
      talentId:      user.id,
      brandId:       app.brand_id,
      reason:        reject_reason ?? null,
    });

    return NextResponse.json({ success: true, status: "rejected" }, { headers: privateNoStoreHeaders() });
  }

  // ─── ACCEPT ─────────────────────────────────────────────────────────────
  if (action === "accept") {
    const { error: appErr } = await adminClient
      .from("community_post_applications")
      .update({ status: "accepted" })
      .eq("id", appId);
    if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500, headers: privateNoStoreHeaders() });

    // Resolve the post owner's (talent's) provider row — bookings.talent_id
    // references talent_profiles.id, same lookup jobs' accept branch uses.
    let talentProfile: { id: string } | null = null;
    try {
      const ref = await profileService.resolveProviderRef(user.id, "talent");
      talentProfile = ref ? { id: ref.providerProfileId } : null;
    } catch (e) {
      const err = ProfileError.from(e);
      console.error("[community post applications/:appId] provider ref lookup failed", err.code, err.internal);
      return NextResponse.json(err.toBody(), { status: err.status, headers: privateNoStoreHeaders() });
    }
    if (!talentProfile) return NextResponse.json({ error: "talent profile not found" }, { status: 404, headers: privateNoStoreHeaders() });

    const service_type = post.category ?? null;

    const { data: booking, error: bookErr } = await adminClient
      .from("bookings")
      .insert({
        brand_id:                      app.brand_id,
        talent_id:                     talentProfile.id,
        talent_user_id:                user.id,
        community_post_id:             postId,
        community_post_application_id: appId,
        service_type,
        status:                        "contacting",
        amount:                        app.proposed_price ?? null,
      })
      .select("id")
      .single();
    if (bookErr || !booking) {
      return NextResponse.json({ error: bookErr?.message ?? "booking creation failed" }, { status: 500, headers: privateNoStoreHeaders() });
    }
    const bookingId = booking.id;

    const { data: conversation, error: convErr } = await adminClient
      .from("conversations")
      .upsert(
        { brand_id: app.brand_id, talent_id: user.id, booking_id: bookingId },
        { onConflict: "brand_id,talent_id", ignoreDuplicates: false }
      )
      .select("id")
      .single();
    if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500, headers: privateNoStoreHeaders() });

    const messageInsert = await adminClient.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: `✅ تم قبول طلبك على العرض. دعنا نبدأ!\n✅ Your application was accepted. Let's get started!`,
      message_type: "text",
    });
    if (messageInsert.error) {
      return NextResponse.json({ error: messageInsert.error.message }, { status: 500, headers: privateNoStoreHeaders() });
    }

    await notifyOfferApplicationAccepted({
      postId,
      title:         post.title,
      applicationId: appId,
      talentId:      user.id,
      brandId:       app.brand_id,
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
