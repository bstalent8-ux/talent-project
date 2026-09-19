export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";
import { notifyAdminMediaPending } from "@/lib/notifications/events";

export async function POST(req: NextRequest) {
  try {
    // auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

    // get file from multipart form
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no file provided" }, { status: 400, headers: privateNoStoreHeaders() });

    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500, headers: privateNoStoreHeaders() });
    }

    // forward to Cloudinary
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    fd.append("folder", `${folder}/avatars`);

    const cloudRes  = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd },
    );
    const cloudData = await cloudRes.json();

    if (!cloudData.secure_url) {
      return NextResponse.json(
        { error: "Cloudinary upload failed", detail: cloudData.error?.message ?? "unknown" },
        { status: 502, headers: privateNoStoreHeaders() },
      );
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("handle, role, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "talent") {
      // A talent's new profile photo waits for an admin before the public sees it.
      // profiles.avatar_url stays the last APPROVED photo (every public read uses it);
      // the new one is parked in pending_avatar_url — see 20260919_avatar_moderation.sql.
      const { error: pendingErr } = await adminClient
        .from("profiles")
        .update({
          pending_avatar_url:      cloudData.secure_url,
          avatar_review_status:    "pending",
          avatar_rejection_reason: null,
          avatar_submitted_at:     new Date().toISOString(),
        })
        .eq("id", user.id);
      if (pendingErr) {
        // Fail closed: without the review columns there is no safe place to park the
        // photo, and publishing it directly would bypass moderation.
        console.error("[avatar] review columns missing or write failed:", pendingErr.message);
        return NextResponse.json({ error: "avatar_review_unavailable" }, { status: 503, headers: privateNoStoreHeaders() });
      }
      notifyAdminMediaPending({ submitterId: user.id, submitterName: profile.full_name ?? profile.handle ?? "—", kind: "avatar" }).catch(() => null);
      return NextResponse.json(
        { avatar_url: profile.avatar_url ?? null, pending_avatar_url: cloudData.secure_url, avatar_review_status: "pending" },
        { headers: privateNoStoreHeaders() },
      );
    }

    // Brands (logos) are unchanged: they publish immediately.
    await adminClient
      .from("profiles")
      .update({ avatar_url: cloudData.secure_url })
      .eq("id", user.id);

    if (profile?.role === "brand") {
      const { invalidateBrand } = await import("@/lib/cache");
      invalidateBrand(profile.handle ?? user.id);
    }

    return NextResponse.json({ avatar_url: cloudData.secure_url }, { headers: privateNoStoreHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: privateNoStoreHeaders() });
  }
}
