export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendAdminAnnouncement } from "@/lib/notifications/events";
import { parseAnnouncement, parseAudience } from "@/lib/notifications/validate";

/**
 * The admin group layout only guards *pages*. Every /api/admin route has to
 * re-check the role itself (CLAUDE.md §3, §12.5).
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { userId: user.id };
}

// POST /api/admin/notifications — send an announcement
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid json body" }, { status: 400 });

  const audience = parseAudience(body);
  if (audience.ok === false) return NextResponse.json({ error: audience.error }, { status: 400 });

  const content = parseAnnouncement(body);
  if (content.ok === false) return NextResponse.json({ error: content.error }, { status: 400 });

  const { broadcastId, recipientCount } = await sendAdminAnnouncement({
    audience:  audience.value,
    adminId:   auth.userId!,
    type:      content.value.type,
    title:     content.value.title,
    message:   content.value.message,
    titleEn:   content.value.titleEn,
    messageEn: content.value.messageEn,
    actionUrl: content.value.actionUrl,
    priority:  content.value.priority,
    expiresAt: content.value.expiresAt,
  });

  if (recipientCount === 0) {
    return NextResponse.json(
      { error: "no active recipients matched this audience", broadcast_id: broadcastId },
      { status: 400 }
    );
  }

  return NextResponse.json({ broadcast_id: broadcastId, recipient_count: recipientCount }, { status: 201 });
}

// GET /api/admin/notifications?page=1 — broadcast history, newest first
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const url      = new URL(req.url);
  const page     = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20));
  const from     = (page - 1) * pageSize;

  const { data, error, count } = await adminClient
    .from("notification_broadcasts")
    .select(
      "id, sender_id, audience, audience_filter, type, title, message, action_url, priority, expires_at, recipient_count, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve sender names in one extra query rather than a join (CLAUDE.md §11.10)
  const senderIds = Array.from(new Set((data ?? []).map((b) => b.sender_id).filter(Boolean))) as string[];
  let senderMap: Record<string, string> = {};

  if (senderIds.length) {
    const { data: senders } = await adminClient
      .from("profiles").select("id, full_name").in("id", senderIds);
    senderMap = Object.fromEntries((senders ?? []).map((s) => [s.id, s.full_name ?? ""]));
  }

  const total = count ?? 0;
  return NextResponse.json({
    broadcasts: (data ?? []).map((b) => ({ ...b, sender_name: b.sender_id ? senderMap[b.sender_id] ?? null : null })),
    total,
    page,
    pageSize,
    hasMore: from + pageSize < total,
  });
}
