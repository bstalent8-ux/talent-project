"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/contexts/SiteContext";
import type { Conversation } from "@/features/chat/types";

function timeAgo(dateStr: string, ar: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return ar ? "الآن"   : "now";
  if (m < 60) return ar ? `${m}د`  : `${m}m`;
  if (h < 24) return ar ? `${h}س`  : `${h}h`;
  return ar ? `${d}ي` : `${d}d`;
}

export default function ConversationList() {
  const { lang, dark } = useSite();
  const ar = lang === "ar";
  const router = useRouter();
  const params = useParams();
  const activeId = params?.id as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BG     = dark ? "#060d18" : "#F8FAFC";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GOLD   = "#FFB800";
  const ACTIVE = dark ? "#0f1e35" : "#FFF8E1";

  const load = useCallback(async () => {
    const res = await fetch("/api/chat/conversations");
    if (!res.ok) return;
    const { conversations: data } = await res.json();
    setConversations(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Get current user id for realtime
    createClient().auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, [load]);

  // Realtime: refresh list when a new message arrives in any of our conversations
  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("conv-list")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myId, load]);

  const TX = {
    ar: { title: "المحادثات", empty: "لا توجد محادثات بعد", you: "أنت: " },
    en: { title: "Messages",  empty: "No conversations yet",  you: "You: " },
  }[lang];

  if (loading) {
    return (
      <div style={{ width: 320, borderInlineEnd: `1px solid ${BORDER}`, backgroundColor: BG, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ width: 320, minWidth: 280, borderInlineEnd: `1px solid ${BORDER}`, backgroundColor: BG, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT }}>{TX.title}</h2>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 14 }}>{TX.empty}</div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            const hasUnread = c.unread_count > 0;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/chat/${c.id}`)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", border: "none", cursor: "pointer",
                  backgroundColor: isActive ? ACTIVE : "transparent",
                  borderBottom: `1px solid ${BORDER}`,
                  textAlign: ar ? "right" : "left",
                  direction: ar ? "rtl" : "ltr",
                  transition: "background 0.15s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: dark ? "#1e293b" : "#e2e8f0",
                  border: `2px solid ${isActive ? GOLD : "transparent"}`,
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: MUTED,
                }}>
                  {c.other_user?.avatar_url ? (
                    <img src={c.other_user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (c.other_user?.full_name?.[0] ?? "?").toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 14, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.other_user?.full_name ?? c.other_user?.handle ?? "—"}
                    </span>
                    <span style={{ fontSize: 11, color: MUTED, flexShrink: 0, marginInlineStart: 8 }}>
                      {timeAgo(c.last_message_at, ar)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: hasUnread ? TEXT : MUTED, fontWeight: hasUnread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {c.last_message ?? (ar ? "ابدأ المحادثة" : "Start chatting")}
                    </span>
                    {hasUnread && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9, backgroundColor: GOLD,
                        color: "#000", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 5px", flexShrink: 0,
                      }}>
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
