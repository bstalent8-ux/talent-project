export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { privateNoStoreHeaders } from "@/lib/cache";
import { notifyAdminNewBrandMoment } from "@/lib/notifications/events";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;

  if (!file) return NextResponse.json({ error: "no file provided" }, { status: 400, headers: privateNoStoreHeaders() });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400, headers: privateNoStoreHeaders() });

  const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500, headers: privateNoStoreHeaders() });
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", `${folder}/brand-moments`);

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  const cloudData = await cloudRes.json();

  if (!cloudData.secure_url) {
    return NextResponse.json(
      { error: "Cloudinary upload failed", detail: cloudData.error?.message ?? "unknown" },
      { status: 502, headers: privateNoStoreHeaders() },
    );
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: row, error } = await adminClient
    .from("landing_brand_moments")
    .insert({
      submitter_id: user.id,
      title,
      location,
      image_url: cloudData.secure_url,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "insert failed" }, { status: 500, headers: privateNoStoreHeaders() });
  }

  notifyAdminNewBrandMoment({ submitterId: user.id, submitterName: profile?.full_name ?? "-" }).catch((e) => {
    console.error("[landing/brand-moments] admin notify failed", e);
  });

  return NextResponse.json({ data: row }, { status: 201, headers: privateNoStoreHeaders() });
}
