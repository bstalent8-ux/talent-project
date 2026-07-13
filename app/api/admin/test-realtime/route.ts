import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

// POST /api/admin/test-realtime
// Body: { conversation_id, sender_id, content }
// Inserts a message bypassing auth — for realtime testing only
export async function POST(req: NextRequest) {
  const { conversation_id, sender_id, content } = await req.json();

  if (!conversation_id || !sender_id || !content) {
    return NextResponse.json({ error: "conversation_id, sender_id, content required" }, { status: 400 });
  }

  const { data: message, error } = await adminClient
    .from("messages")
    .insert({ conversation_id, sender_id, content, message_type: "text" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminClient
    .from("conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", conversation_id);

  return NextResponse.json({ message }, { status: 201 });
}
