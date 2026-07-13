import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// GET /api/chat/conversations — list all conversations for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: conversations, error } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id, booking_id, created_at, last_message_at")
    .or(`brand_id.eq.${user.id},talent_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!conversations?.length) return NextResponse.json({ conversations: [] });

  // Collect all "other user" IDs
  const otherIds = conversations.map((c) =>
    c.brand_id === user.id ? c.talent_id : c.brand_id
  );
  const uniqueOtherIds = [...new Set(otherIds)];

  // Fetch profiles in one query
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, role")
    .in("id", uniqueOtherIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  // Fetch last message + unread count per conversation
  const convIds = conversations.map((c) => c.id);

  const [{ data: lastMessages }, { data: unreadCounts }] = await Promise.all([
    adminClient
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
    adminClient
      .from("messages")
      .select("conversation_id, id")
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user.id),
  ]);

  // Build last-message map (first match per conversation since ordered DESC)
  const lastMsgMap: Record<string, string> = {};
  for (const msg of lastMessages ?? []) {
    if (!lastMsgMap[msg.conversation_id]) {
      lastMsgMap[msg.conversation_id] = msg.content;
    }
  }

  // Build unread count map
  const unreadMap: Record<string, number> = {};
  for (const msg of unreadCounts ?? []) {
    unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] ?? 0) + 1;
  }

  const result = conversations.map((c) => {
    const otherId = c.brand_id === user.id ? c.talent_id : c.brand_id;
    return {
      ...c,
      other_user: profileMap[otherId] ?? null,
      last_message: lastMsgMap[c.id] ?? null,
      unread_count: unreadMap[c.id] ?? 0,
    };
  });

  return NextResponse.json({ conversations: result });
}

// POST /api/chat/conversations — create or return existing conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { other_user_id, booking_id } = await req.json();
  if (!other_user_id) return NextResponse.json({ error: "other_user_id required" }, { status: 400 });

  // Determine who is brand and who is talent
  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: otherProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", other_user_id)
    .single();

  if (!currentProfile || !otherProfile) {
    return NextResponse.json({ error: "profiles not found" }, { status: 404 });
  }

  // brand_id is always the brand user, talent_id is always the talent user
  let brand_id: string, talent_id: string;
  if (currentProfile.role === "brand") {
    brand_id = user.id;
    talent_id = other_user_id;
  } else {
    brand_id = other_user_id;
    talent_id = user.id;
  }

  // Upsert — UNIQUE(brand_id, talent_id) prevents duplicates
  const { data: conversation, error } = await adminClient
    .from("conversations")
    .upsert(
      { brand_id, talent_id, booking_id: booking_id ?? null },
      { onConflict: "brand_id,talent_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation });
}
