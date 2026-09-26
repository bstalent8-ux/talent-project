export const runtime = 'edge';

// ─── POST /api/profile/brand-cover ────────────────────────────────────────────
// Uploads a brand's page cover (multipart `file`) to Cloudinary through our
// unsigned preset — same proxy pattern as /api/profile/avatar — and stores the
// URL in brand_profiles.cover_url. Brand accounts only, own row only.
// Brand logos publish without review (CLAUDE.md, 2026-09-19); covers follow
// the same rule. DELETE clears the cover.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { invalidateBrand, privateNoStoreHeaders } from "@/lib/cache";

const MAX_BYTES = 8 * 1024 * 1024;
const MISSING_COLUMN = new Set(["42703", "PGRST204"]);

async function requireBrand() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() }) };
  const { data: profile } = await adminClient.from("profiles").select("role, handle").eq("id", user.id).maybeSingle();
  if (profile?.role !== "brand") return { error: NextResponse.json({ error: "brands only" }, { status: 403, headers: privateNoStoreHeaders() }) };
  return { user, handle: profile.handle as string | null };
}

async function saveCover(userId: string, handle: string | null, url: string | null) {
  const { error } = await adminClient.from("brand_profiles").update({ cover_url: url }).eq("user_id", userId);
  if (error) {
    if (MISSING_COLUMN.has(error.code ?? "")) {
      return NextResponse.json({ error: "migration_required" }, { status: 409, headers: privateNoStoreHeaders() });
    }
    console.error("[brand-cover] save", error);
    return NextResponse.json({ error: "save failed" }, { status: 500, headers: privateNoStoreHeaders() });
  }
  invalidateBrand(handle);
  invalidateBrand(userId);
  return NextResponse.json({ url }, { headers: privateNoStoreHeaders() });
}

export async function POST(req: NextRequest) {
  const auth = await requireBrand();
  if ("error" in auth) return auth.error;
  const headers = privateNoStoreHeaders();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file provided" }, { status: 400, headers });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "images only" }, { status: 400, headers });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large" }, { status: 413, headers });

  const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";
  if (!cloudName || !uploadPreset) return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500, headers });

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", `${folder}/brand-covers`);

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  const cloudData = await cloudRes.json().catch(() => ({}));
  if (!cloudData.secure_url) {
    return NextResponse.json({ error: "upload failed", detail: cloudData.error?.message ?? "unknown" }, { status: 502, headers });
  }

  return saveCover(auth.user.id, auth.handle, cloudData.secure_url as string);
}

export async function DELETE() {
  const auth = await requireBrand();
  if ("error" in auth) return auth.error;
  return saveCover(auth.user.id, auth.handle, null);
}
