export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { invalidateTalent, privateNoStoreHeaders } from "@/lib/cache";

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

    // save to DB
    await adminClient
      .from("profiles")
      .update({ avatar_url: cloudData.secure_url })
      .eq("id", user.id);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("handle, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "talent") {
      invalidateTalent(profile.handle ?? user.id);
    } else if (profile?.role === "brand") {
      const { invalidateBrand } = await import("@/lib/cache");
      invalidateBrand(profile.handle ?? user.id);
    }

    return NextResponse.json({ avatar_url: cloudData.secure_url }, { headers: privateNoStoreHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: privateNoStoreHeaders() });
  }
}
