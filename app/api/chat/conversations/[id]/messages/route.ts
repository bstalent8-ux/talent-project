import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

// GET /api/chat/conversations/[id]/messages?before=<cursor>&limit=30
export async function GET(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  // Verify user is participant
  const { data: conv } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id")
    .eq("id", id)
    .single();

  if (!conv || (conv.brand_id !== user.id && conv.talent_id !== user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let query = adminClient
    .from("messages")
    .select("id, conversation_id, sender_id, content, message_type, created_at, is_read")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return in ascending order for display (reversed from fetch)
  const ordered = (messages ?? []).reverse();
  const hasMore = (messages ?? []).length === limit;

  return NextResponse.json({ messages: ordered, has_more: hasMore });
}

// POST /api/chat/conversations/[id]/messages — send a message
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content, message_type = "text" } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  // Verify user is participant and get receiver
  const { data: conv } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id")
    .eq("id", id)
    .single();

  if (!conv || (conv.brand_id !== user.id && conv.talent_id !== user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Insert message
  const { data: message, error: msgError } = await adminClient
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      content: content.trim(),
      message_type,
    })
    .select()
    .single();

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  // Update last_message_at on conversation
  await adminClient
    .from("conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", id);

  return NextResponse.json({ message }, { status: 201 });
}
