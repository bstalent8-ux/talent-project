export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { completeProfileReminderEmail } from "@/lib/email/templates/complete-profile-reminder";

// Backs the Dashboard's "new registrations" card — one button per row (or a
// "send to all") that fires the same nudge this session sent by hand
// (scripts/_tmp_send_incomplete_profile_emails and friends). Accepts either
// a single userId or a userIds array so the client doesn't need two routes.
export async function POST(req: NextRequest) {
  const denied = await requirePermission("dashboard", "create");
  if (denied) return denied;
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json() as { userId?: string; userIds?: string[] };
  const targetIds = body.userIds?.length ? body.userIds : body.userId ? [body.userId] : [];
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "userId or userIds required" }, { status: 400 });
  }

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .in("id", targetIds);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const results = await Promise.all(targetIds.map(async (userId) => {
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (!email) return { userId, ok: false, error: "no auth email" };

    const { subject, html } = completeProfileReminderEmail("ar", profileMap[userId]?.full_name ?? "");
    const result = await sendEmail({
      to: email, subject, html,
      template: "complete_profile_reminder", recipientId: userId, sentBy: admin.id,
    });
    return { userId, ok: result.ok, error: result.error };
  }));

  return NextResponse.json({ results, sent: results.filter((r) => r.ok).length, total: results.length });
}
