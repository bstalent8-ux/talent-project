export const runtime = "edge";

// ─── Brand verification submit ─────────────────────────────────────────────
// Self-serve counterpart to /admin/brands' Approve/Reject: before this route
// existed, an admin approved a brand with zero evidence (no UI anywhere wrote
// profiles.tax_document_url or profiles.brand_category, despite both columns
// already existing and being read by fetchAdminBrandsPage/BrandsTable.tsx).
//
// One multipart submission carries: a business type (a real categories.id,
// role_type='brand' — validated against the live table, never trusted blind;
// or "other" + free text, logged to brand_type_requests for admin demand
// tracking, same posture as talent_type_requests — never auto-promoted into
// a real category), one required verification document (tax card / commercial
// registration), and up to 5 optional proof-of-business photos.
//
// Submitting resets brand_status to "pending" only when it isn't already
// "approved" — an already-live, already-approved brand touching up a photo
// must not silently vanish from the public /brands list. An admin can still
// force a re-review with the existing "Reset to Pending" action.

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { privateNoStoreHeaders } from "@/lib/cache";
import { fetchCategories } from "@/features/categories/services/category.service";
import { notifyAdminBrandVerificationSubmitted } from "@/lib/notifications/events";

const MAX_PHOTOS = 5;
const MAX_TEXT_LEN = 200;

async function uploadToCloudinary(file: File, folder: string): Promise<string | null> {
  const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) return null;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  return typeof data?.secure_url === "string" ? data.secure_url : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: privateNoStoreHeaders() });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role, full_name, brand_status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "brand") {
    return NextResponse.json({ error: "brands only" }, { status: 403, headers: privateNoStoreHeaders() });
  }

  const formData = await req.formData();
  const categoryId = String(formData.get("category") ?? "").trim();
  const otherText  = String(formData.get("other_type_text") ?? "").trim().slice(0, MAX_TEXT_LEN);
  const document   = formData.get("document") as File | null;
  const photos     = formData.getAll("photos").filter((f): f is File => f instanceof File).slice(0, MAX_PHOTOS);

  if (!categoryId) {
    return NextResponse.json({ error: "category required" }, { status: 400, headers: privateNoStoreHeaders() });
  }
  if (categoryId === "other" && !otherText) {
    return NextResponse.json({ error: "other_type_text required when category is other" }, { status: 400, headers: privateNoStoreHeaders() });
  }
  if (!document) {
    return NextResponse.json({ error: "verification document required" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  // Never trust a client-sent category id blindly — it must be a real,
  // currently-active brand category, or the literal "other" sentinel.
  let resolvedCategory: string | null = null;
  if (categoryId !== "other") {
    const brandCategories = await fetchCategories("brand");
    const match = brandCategories.find((c) => c.id === categoryId);
    if (!match) {
      return NextResponse.json({ error: "unknown category" }, { status: 400, headers: privateNoStoreHeaders() });
    }
    resolvedCategory = match.id;
  }

  const folder = (process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents") + "/brand-verification";

  const documentUrl = await uploadToCloudinary(document, folder);
  if (!documentUrl) {
    return NextResponse.json({ error: "document upload failed" }, { status: 502, headers: privateNoStoreHeaders() });
  }

  const photoUrls: string[] = [];
  for (const photo of photos) {
    const url = await uploadToCloudinary(photo, folder);
    if (url) photoUrls.push(url);
  }

  const patch: Record<string, unknown> = {
    tax_document_url: documentUrl,
    brand_verification_photos: photoUrls,
  };
  if (resolvedCategory) patch.brand_category = resolvedCategory;
  // Already-approved brands are left alone — see the file header note.
  if (profile.brand_status !== "approved") {
    patch.brand_status = "pending";
    patch.brand_rejection_reason = null;
  }

  const { error: updateError } = await adminClient.from("profiles").update(patch).eq("id", user.id);
  if (updateError) {
    console.error("[brand-verification] profile update failed", updateError.code, updateError.message);
    return NextResponse.json({ error: "save failed" }, { status: 500, headers: privateNoStoreHeaders() });
  }

  if (categoryId === "other" && otherText) {
    const { error: reqError } = await adminClient.from("brand_type_requests").insert({
      user_id: user.id,
      other_type_text: otherText,
    });
    // Analytics-only — never block the actual submission on this failing.
    if (reqError) console.error("[brand-verification] brand_type_requests insert failed", reqError.code, reqError.message);
  }

  notifyAdminBrandVerificationSubmitted({
    brandId: user.id,
    brandName: profile.full_name ?? "-",
  }).catch((e) => console.error("[brand-verification] admin notify failed", e));

  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
