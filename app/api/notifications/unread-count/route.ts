export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/notifications/service";

// GET /api/notifications/unread-count — head-only count, no rows transferred.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const count = await getUnreadCount(user.id);
  return NextResponse.json({ count });
}
