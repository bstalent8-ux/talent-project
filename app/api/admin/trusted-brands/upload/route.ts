export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { privateNoStoreHeaders } from "@/lib/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400, headers: privateNoStoreHeaders() });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Logo must be an image" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500, headers: privateNoStoreHeaders() });
  }

  const cloudForm = new FormData();
  cloudForm.append("file", file);
  cloudForm.append("upload_preset", uploadPreset);
  cloudForm.append("folder", `${folder}/trusted-brands`);

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: cloudForm,
  });
  const cloudData = await cloudRes.json();

  if (!cloudRes.ok || !cloudData.secure_url) {
    return NextResponse.json(
      { error: "Cloudinary upload failed", detail: cloudData.error?.message ?? "unknown" },
      { status: 502, headers: privateNoStoreHeaders() },
    );
  }

  return NextResponse.json({ url: cloudData.secure_url }, { headers: privateNoStoreHeaders() });
}
