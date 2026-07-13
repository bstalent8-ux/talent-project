import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import ChatWindow from "../_components/ChatWindow";
import type { Conversation } from "@/features/chat/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch conversation + other user info server-side for instant render
  const { data: conv } = await adminClient
    .from("conversations")
    .select("id, brand_id, talent_id, booking_id, created_at, last_message_at")
    .eq("id", id)
    .single();

  if (!conv || (conv.brand_id !== user.id && conv.talent_id !== user.id)) {
    redirect("/chat");
  }

  const otherId = conv.brand_id === user.id ? conv.talent_id : conv.brand_id;
  const { data: otherProfile } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, role")
    .eq("id", otherId)
    .single();

  const conversation: Conversation = {
    ...conv,
    other_user: otherProfile ?? { id: otherId, full_name: null, handle: null, avatar_url: null, role: "talent" },
    last_message: null,
    unread_count: 0,
  };

  return (
    <ChatWindow
      conversationId={id}
      conversation={conversation}
      currentUserId={user.id}
    />
  );
}
