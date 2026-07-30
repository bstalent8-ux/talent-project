export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/notifications/service";
import { isNotificationType } from "@/lib/notifications/types";

// GET /api/notifications?page=1&pageSize=20&unread=1&type=CHAT_MESSAGE
// Paginated, newest first, scoped to the caller. Never returns another user's
// rows — `listNotifications` filters on recipient_id server-side.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url      = new URL(req.url);
  const page     = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
  const unread   = url.searchParams.get("unread") === "1";
  const rawType  = url.searchParams.get("type");

  const result = await listNotifications(user.id, {
    page:       Number.isFinite(page)     ? page     : 1,
    pageSize:   Number.isFinite(pageSize) ? pageSize : 20,
    unreadOnly: unread,
    type:       isNotificationType(rawType) ? rawType : undefined,
  });

  return NextResponse.json(result);
}
