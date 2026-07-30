export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteNotification, markAsRead } from "@/lib/notifications/service";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id]  { is_read: true }
// Ownership is enforced by the recipient_id predicate inside the service — an
// id belonging to someone else simply matches zero rows.
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body?.is_read !== true) {
    return NextResponse.json({ error: "only is_read:true is supported" }, { status: 400 });
  }

  const ok = await markAsRead(user.id, id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteNotification(user.id, id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
