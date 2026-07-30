export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

// POST /api/chat/conversations/[id]/presence
// Heartbeat from an open chat thread. `notifyChatMessage` reads it to skip
// notifying someone who is already looking at the conversation.
export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: conv } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id")
    .eq("id", id)
    .single();

  if (!conv || (conv.brand_id !== user.id && conv.talent_id !== user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await adminClient
    .from("conversation_presence")
    .upsert(
      { conversation_id: id, user_id: user.id, last_seen_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/chat/conversations/[id]/presence — thread closed / tab hidden.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  await adminClient
    .from("conversation_presence")
    .delete()
    .eq("conversation_id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
