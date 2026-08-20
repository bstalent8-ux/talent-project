export const runtime = 'edge';

// ─── Quick support ticket (register / login pages) ────────────────────────
// Public, unauthenticated — this exists precisely for visitors who CAN'T
// sign in (that's the whole reason they're using it), so there is no user
// to check. Writes into the same contact_messages table the full Contact Us
// form uses (type='support'), auto-filling name/subject from the page
// context so the visitor only has to type email + message.

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyAdminNewSupportTicket } from "@/lib/notifications/events";

const PAGE_SUBJECT: Record<string, string> = {
  register: "مشكلة أثناء إنشاء حساب",
  login:    "مشكلة أثناء تسجيل الدخول",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email   = typeof body.email === "string" ? body.email.trim() : "";
  const phone   = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const page    = typeof body.page === "string" ? body.page : null;
  const pageError = typeof body.pageError === "string" ? body.pageError.slice(0, 300) : null;

  if (!email || !message) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
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
  });

  if (dbErr) {
    console.error("[support/tickets] db error:", dbErr.message);
    return NextResponse.json({ error: "failed to save ticket" }, { status: 500 });
  }

  await notifyAdminNewSupportTicket({ email, page });

  return NextResponse.json({ success: true });
}
