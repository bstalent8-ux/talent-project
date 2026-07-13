"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/contexts/SiteContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import type { Message, Conversation } from "@/features/chat/types";

interface Props {
  conversationId: string;
  conversation: Conversation | null;
  currentUserId: string;
}

export default function ChatWindow({ conversationId, conversation, currentUserId }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const BORDER = dark ? "#1e293b"  : "#E2E8F0";
  const BG     = dark ? "#060d18"  : "#F8FAFC";
  const TEXT   = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED  = dark ? "#64748b"  : "#94a3b8";
  const GOLD   = "#FFB800";

  const fetchMessages = useCallback(async (before?: string) => {
    const url = before
      ? `/api/chat/conversations/${conversationId}/messages?before=${encodeURIComponent(before)}&limit=50`
      : `/api/chat/conversations/${conversationId}/messages?limit=50`;
    const res = await fetch(url);
    if (!res.ok) return;
    const { messages: data, has_more } = await res.json();
    return { messages: data as Message[], hasMore: has_more as boolean };
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages().then((result) => {
      if (!result) return;
      setMessages(result.messages);
      setHasMore(result.hasMore);
      setLoading(false);
    });
  }, [fetchMessages]);

  // Mark as read on open
  useEffect(() => {
    fetch(`/api/chat/conversations/${conversationId}/read`, { method: "PATCH" });
  }, [conversationId]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Deduplicate (optimistic + realtime both arriving)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark read if the incoming message is from the other user
          if (newMsg.sender_id !== currentUserId) {
            fetch(`/api/chat/conversations/${conversationId}/read`, { method: "PATCH" });
          }
        }
      )
      // Also update read receipts in realtime
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, is_read: updated.is_read } : m))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  async function handleSend(content: string) {
    // Optimistic insert
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      message_type: "text",
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const { message } = await res.json();
      // Replace optimistic with real message
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? message : m));
    } else {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  }

  async function loadMore() {
    const oldest = messages[0];
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    const prevScrollHeight = listRef.current?.scrollHeight ?? 0;
    const result = await fetchMessages(oldest.created_at);
    if (result) {
      setMessages((prev) => [...result.messages, ...prev]);
      setHasMore(result.hasMore);
      // Preserve scroll position after prepend
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight - prevScrollHeight;
        }
      });
    }
    setLoadingMore(false);
  }

  const other = conversation?.other_user;

  const TX = {
    ar: { loading: "تحميل...", loadMore: "تحميل المزيد", empty: "ابدأ المحادثة 👋" },
    en: { loading: "Loading...", loadMore: "Load more", empty: "Start the conversation 👋" },
  }[lang];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", backgroundColor: BG }}>
      {/* Header */}
      <div style={{
        padding: "0 20px", height: 60, display: "flex", alignItems: "center", gap: 12,
        borderBottom: `1px solid ${BORDER}`, backgroundColor: dark ? "#0D1623" : "#FFFFFF",
        flexShrink: 0, direction: ar ? "rtl" : "ltr",
      }}>
        {other ? (
          <>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              backgroundColor: dark ? "#1e293b" : "#e2e8f0",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: MUTED,
            }}>
              {other.avatar_url ? (
                <img src={other.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (other.full_name?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: TEXT }}>{other.full_name ?? other.handle}</p>
              <p style={{ margin: 0, fontSize: 11, color: GOLD, textTransform: "capitalize" }}>{other.role}</p>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>...</p>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column" }}
      >
        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                background: "none", border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: "6px 16px", cursor: "pointer", color: MUTED, fontSize: 12,
              }}
            >
              {loadingMore ? "..." : TX.loadMore}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 15 }}>
            {TX.empty}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === currentUserId}
                dark={dark}
              />
            ))}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
