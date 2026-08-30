export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { privateNoStoreHeaders } from "@/lib/cache";

// POST /api/admin/emails/[id]/resend — re-sends the exact stored
// subject/body_html from one email_log row to the same recipient email.
// Creates a NEW log row (this is a fresh send, not a mutation of the old one).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });

  const { id } = await params;

  const { data: original, error } = await adminClient
    .from("email_log")
    .select("recipient_email, recipient_id, subject, body_html, template")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: privateNoStoreHeaders() });
  if (!original) return NextResponse.json({ error: "not found" }, { status: 404, headers: privateNoStoreHeaders() });

  const result = await sendEmail({
    to: original.recipient_email,
    subject: original.subject,
    html: original.body_html,
    template: original.template,
    recipientId: original.recipient_id,
    sentBy: admin.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.error ?? "send failed" }, { status: 502, headers: privateNoStoreHeaders() });
  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
