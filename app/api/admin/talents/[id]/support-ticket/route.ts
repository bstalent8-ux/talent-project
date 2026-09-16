export const runtime = 'edge';

// ─── Admin-filed complaint about a talent ───────────────────────────────────
// An admin (e.g. from the Talents table's icon, or the talent's own edit
// page) raises a support ticket ABOUT a talent instead of the talent
// self-reporting one. Writes into the same contact_messages table as
// /api/support/tickets — one admin inbox for every ticket source — but
// tagged with talent_id (20260916_support_ticket_talent_link.sql) and fires
// a distinct "complaint about a talent" notification to every admin so
// whoever's on support triage picks it up.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/require-admin";
import { adminClient } from "@/lib/supabase/admin";
import { notifyAdminTalentSupportTicket } from "@/lib/notifications/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("support", "create");
  if (denied) return denied;

  const admin = await getAdminUser();
  let adminName: string | null = null;
  if (admin) {
    const { data: adminProfile } = await adminClient.from("profiles").select("full_name").eq("id", admin.id).single();
    adminName = adminProfile?.full_name ?? null;
  }

  const { id: talentProfileId } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }

  const name    = String(formData.get("name") ?? "").trim();
  const email   = String(formData.get("email") ?? "").trim();
  const phone   = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const file    = formData.get("file") as File | null;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  let attachmentUrl: string | null = null;
  let attachmentType: "image" | "video" | null = null;
  if (file && file.size > 0) {
    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";
    const isVideo      = file.type.startsWith("video/");

    if (cloudName && uploadPreset) {
      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("upload_preset", uploadPreset);
      cloudForm.append("folder", `${folder}/support-tickets`);

      try {
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? "video" : "image"}/upload`, { method: "POST", body: cloudForm });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) { attachmentUrl = cloudData.secure_url; attachmentType = isVideo ? "video" : "image"; }
        else console.error("[admin talent support-ticket] cloudinary upload failed:", cloudData.error?.message);
      } catch (e) {
        console.error("[admin talent support-ticket] cloudinary error:", e);
      }
    }
  }

  const { error: dbErr } = await adminClient.from("contact_messages").insert({
    name:    name || "—",
    email:   email || "—",
    phone:   phone || null,
    type:    "support",
    subject: `شكوى بخصوص: ${name || "موهبة"}`,
    message,
    status:  "new",
    talent_id: talentProfileId,
    context: { source: "admin_talent_flag", submittedBy: { type: "admin", name: adminName } },
    attachment_url:  attachmentUrl,
    attachment_type: attachmentType,
  });

  if (dbErr) {
    console.error("[admin talent support-ticket] db error:", dbErr.message);
    return NextResponse.json({ error: "failed to save ticket" }, { status: 500 });
  }

  await notifyAdminTalentSupportTicket({ talentName: name || null });

  return NextResponse.json({ success: true });
}
