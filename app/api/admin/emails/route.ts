export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { privateNoStoreHeaders } from "@/lib/cache";

// GET /api/admin/emails?page=1&pageSize=20 — history list, used by
// /admin/emails' own page.tsx Server Component too, but also exposed here
// so the client view can refetch after a manual send/resend without a
// full page reload.
export async function GET(req: NextRequest) {
  const denied = await requirePermission("emails", "read");
  if (denied) return denied;

  const { fetchAdminEmailLogPage } = await import("@/features/admin/services/admin.service");
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const result = await fetchAdminEmailLogPage({ page, pageSize });
  return NextResponse.json(result, { headers: privateNoStoreHeaders() });
}

// POST /api/admin/emails — admin-composed one-off email. Body:
// { recipientId?: string, to?: string, subject: string, html: string }
// Exactly one of recipientId/to must be given; recipientId resolves the
// real address server-side so the admin never has to know/paste it.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("emails", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const body = await req.json().catch(() => null) as
    | { recipientId?: string; to?: string; subject?: string; html?: string }
    | null;
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400, headers: privateNoStoreHeaders() });

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const html = typeof body.html === "string" ? body.html.trim() : "";
  if (!subject || !html) {
    return NextResponse.json({ error: "subject and html are required" }, { status: 400, headers: privateNoStoreHeaders() });
  }

  let to: string | null = null;
  let recipientId: string | null = null;

  if (body.recipientId) {
    const { data: authUser } = await adminClient.auth.admin.getUserById(body.recipientId);
    if (!authUser?.user?.email) {
      return NextResponse.json({ error: "recipient has no email on file" }, { status: 404, headers: privateNoStoreHeaders() });
    }
    to = authUser.user.email;
    recipientId = body.recipientId;
  } else if (typeof body.to === "string" && body.to.includes("@")) {
    to = body.to.trim();
  }

  if (!to) return NextResponse.json({ error: "recipientId or a valid to address is required" }, { status: 400, headers: privateNoStoreHeaders() });

  const result = await sendEmail({ to, subject, html, template: "custom", recipientId, sentBy: admin.id });
  if (!result.ok) return NextResponse.json({ error: result.error ?? "send failed" }, { status: 502, headers: privateNoStoreHeaders() });

  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
