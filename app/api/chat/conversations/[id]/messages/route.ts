export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { notifyChatMessage } from "@/lib/notifications/events";
import { canSendMessage } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

// GET /api/chat/conversations/[id]/messages?before=<cursor>&limit=30
export async function GET(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, account_status, is_suspended")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!canSendMessage(profile).allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  // Verify user is participant
  const { data: conv, error: convError } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id")
    .eq("id", id)
    .single();
  if (convError) {
    const status = convError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : convError.message }, { status });
  }

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

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, account_status, is_suspended")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!canSendMessage(profile).allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { content, message_type = "text" } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  // Verify user is participant and get receiver
  const { data: conv, error: convError } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id")
    .eq("id", id)
    .single();
  if (convError) {
    const status = convError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "not found" : convError.message }, { status });
  }

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
  const { error: conversationUpdateError } = await adminClient
    .from("conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", id);
  if (conversationUpdateError) return NextResponse.json({ error: conversationUpdateError.message }, { status: 500 });

  // Notify the other participant — skipped when they are already reading this
  // thread, and collapsed onto an existing unread entry for the same thread.
  const receiverId = conv.brand_id === user.id ? conv.talent_id : conv.brand_id;
  const { data: sender, error: senderError } = await adminClient
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  if (senderError) {
    console.error("Failed to load sender name for chat notification:", senderError.message);
  }

  await notifyChatMessage({
    conversationId: id,
    recipientId:    receiverId,
    senderId:       user.id,
    senderName:     sender?.full_name ?? null,
    preview:        content.trim(),
  });

  return NextResponse.json({ message }, { status: 201 });
}
