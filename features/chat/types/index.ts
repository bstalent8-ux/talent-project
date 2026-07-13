export interface ConversationUser {
  id: string;
  full_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  role: string;
}

export interface Conversation {
  id: string;
  brand_id: string;
  talent_id: string;
  booking_id: string | null;
  created_at: string;
  last_message_at: string;
  other_user: ConversationUser;
  last_message: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file";
  created_at: string;
  is_read: boolean;
}
