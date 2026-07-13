export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/chat/conversations/[id]/read — mark all incoming messages as read
export async function PATCH(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify participant
  const { data: conv } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id")
    .eq("id", id)
    .single();

  if (!conv || (conv.brand_id !== user.id && conv.talent_id !== user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Mark messages sent by the OTHER user as read
  const { error } = await adminClient
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", id)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}