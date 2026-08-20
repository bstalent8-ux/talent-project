export const runtime = 'edge';

// ─── Quick support ticket (register / login / footer) ─────────────────────
// Public, unauthenticated — this exists precisely for visitors who CAN'T
// sign in (that's the whole reason it's on register/login), plus a footer
// entry point for anyone anywhere on the site. Writes into the same
// contact_messages table the full Contact Us form uses (type='support'),
// auto-filling name/subject from the page context so the visitor only has
// to type email + message. An optional screenshot is proxied to Cloudinary
// — never uploaded directly from the browser, CSP's connect-src only
// allows 'self' + supabase (see app/api/landing/brand-moments/route.ts for
// the same pattern on an authenticated route).

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyAdminNewSupportTicket } from "@/lib/notifications/events";

const PAGE_SUBJECT: Record<string, string> = {
  register: "مشكلة أثناء إنشاء حساب",
  login:    "مشكلة أثناء تسجيل الدخول",
  footer:   "طلب مساعدة",
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }

  const email   = String(formData.get("email") ?? "").trim();
  const phone   = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const page    = String(formData.get("page") ?? "") || null;
  const pageError = (formData.get("pageError") as string | null)?.slice(0, 300) || null;
  const file    = formData.get("file") as File | null;

  if (!email || !message) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  let attachmentUrl: string | null = null;
  if (file && file.size > 0) {
    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder       = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents";

    if (cloudName && uploadPreset) {
      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("upload_preset", uploadPreset);
      cloudForm.append("folder", `${folder}/support-tickets`);

      try {
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: cloudForm });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) attachmentUrl = cloudData.secure_url;
        else console.error("[support/tickets] cloudinary upload failed:", cloudData.error?.message);
      } catch (e) {
        // Non-fatal — the ticket still gets saved without the screenshot.
        console.error("[support/tickets] cloudinary error:", e);
      }
    }
  }

  const { error: dbErr } = await adminClient.from("contact_messages").insert({
    name:    email.split("@")[0],
    email,
    phone:   phone || null,
    type:    "support",
    subject: (page && PAGE_SUBJECT[page]) || "طلب مساعدة",
    message,
    status:  "new",
    context: { page, pageError, submittedAt: new Date().toISOString() },
    attachment_url: attachmentUrl,
  });

  if (dbErr) {
    console.error("[support/tickets] db error:", dbErr.message);
    return NextResponse.json({ error: "failed to save ticket" }, { status: 500 });
  }

  await notifyAdminNewSupportTicket({ email, page });

  return NextResponse.json({ success: true });
}
