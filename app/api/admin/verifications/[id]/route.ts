export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notifyProfileApproved, notifyProfileRejected } from "@/lib/notifications/events";
import { sendEmail } from "@/lib/email/send";
import { verificationApprovedEmail } from "@/lib/email/templates/verification-approved";
import { requirePermission } from "@/lib/auth/permissions";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePermission("verifications", "update");
  if (denied) return denied;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const {
    action, reason,
    // Only meaningful for action: "approve" — the reject flow never showed
    // these checkboxes, so both default true (matches what the popup's own
    // checkboxes default to) rather than requiring every caller to pass them.
    sendNotification = true,
    sendEmail: shouldSendEmail = true,
  } = await req.json() as { action: "approve" | "reject"; reason?: string; sendNotification?: boolean; sendEmail?: boolean };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get verification request to find the talent_id
  const { data: verification, error: fetchErr } = await adminClient
    .from("talent_verifications")
    .select("id, talent_id, status")
    .eq("id", id)
    .single();

  if (fetchErr || !verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  // Update verification record
  const { error: verErr } = await adminClient
    .from("talent_verifications")
    .update({
      status:           action === "approve" ? "approved" : "rejected",
      reviewed_at:      new Date().toISOString(),
      reviewed_by:      admin.id,
      rejection_reason: action === "reject" ? (reason ?? null) : null,
    })
    .eq("id", id);

  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });

  // If approved → mark talent profile as verified
  if (action === "approve") {
    const { error: profErr } = await adminClient
      .from("profiles")
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq("id", verification.talent_id);

    // Fallback: try without verified_at if column doesn't exist yet
    if (profErr) {
      await adminClient
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", verification.talent_id);
    }
  }

  // If rejected → ensure is_verified stays false
  if (action === "reject") {
    await adminClient
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", verification.talent_id);
  }

  if (action === "approve") {
    if (sendNotification) {
      await notifyProfileApproved({
        recipientId: verification.talent_id,
        adminId:     admin.id,
        kind:        "verification",
      });
    }

    // Best-effort — same posture as the profile-approval email in
    // /api/admin/talents/[id]: a failed/unconfigured email must never fail
    // the approve action itself.
    if (shouldSendEmail) {
      try {
        const [{ data: authUser }, { data: recipientProfile }] = await Promise.all([
          adminClient.auth.admin.getUserById(verification.talent_id),
          adminClient.from("profiles").select("full_name").eq("id", verification.talent_id).maybeSingle(),
        ]);
        if (authUser?.user?.email) {
          const { subject, html } = verificationApprovedEmail("ar", recipientProfile?.full_name ?? "");
          await sendEmail({
            to: authUser.user.email, subject, html,
            template: "verification_approved", recipientId: verification.talent_id, sentBy: admin.id,
          });
        }
      } catch (e) {
        console.error("[admin/verifications approve] verification email failed", e);
      }
    }
  } else {
    await notifyProfileRejected({
      recipientId: verification.talent_id,
      adminId:     admin.id,
      reason:      reason ?? null,
      kind:        "verification",
    });
  }

  revalidatePath("/admin/verifications");
  return NextResponse.json({ ok: true });
}