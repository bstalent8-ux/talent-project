export const runtime = 'edge';

// Cloudinary unsigned upload, same pattern as app/api/profile/avatar/route.ts
// and app/api/portfolio/route.ts — the dominant media-upload convention in
// this app (CLAUDE.md §2). Not the Supabase-storage path
// app/api/admin/upload-avatar/route.ts uses; that one's a pre-existing
// outlier for the admin's own avatar specifically, not the general pattern.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const denied = await requirePermission("blog", "create");
  if (denied) return denied;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file provided" }, { status: 400 });

  const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", `${folder}/blog`);

  const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const cloudData = await cloudRes.json();

  if (!cloudData.secure_url) {
    return NextResponse.json(
      { error: "Cloudinary upload failed", detail: cloudData.error?.message ?? "unknown" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: cloudData.secure_url as string });
}
