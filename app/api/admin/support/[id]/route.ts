export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { status?: string; reply?: string };

  const patch: Record<string, unknown> = {};
  if (body.status) {
    if (!["new", "in_progress", "resolved"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body.reply === "string" && body.reply.trim()) {
    patch.admin_reply = body.reply.trim();
    patch.replied_at = new Date().toISOString();
    if (!body.status) patch.status = "resolved";
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await adminClient.from("contact_messages").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort email reply — same optional Resend path the public contact
  // form already uses (RESEND_API_KEY unset = no-op, still saved to DB).
  if (typeof body.reply === "string" && body.reply.trim()) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const { data: ticket } = await adminClient.from("contact_messages").select("email, subject").eq("id", id).single();
      if (ticket?.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from:    "Talents Support <support@talent-s.com>",
              to:      [ticket.email],
              subject: `Re: ${ticket.subject}`,
              text:    body.reply.trim(),
            }),
          });
        } catch (e) {
          console.error("[admin/support] resend reply error:", e);
        }
      }
    }
  }

  revalidatePath("/admin/support");
  return NextResponse.json({ ok: true });
}
