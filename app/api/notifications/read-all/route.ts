export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markAllAsRead } from "@/lib/notifications/service";

// POST /api/notifications/read-all
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const updated = await markAllAsRead(user.id);
  return NextResponse.json({ updated });
}
