"use client";
import {
  useState, useEffect, useRef, useCallback,
  type KeyboardEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/contexts/SiteContext";
import type { Conversation, Message } from "@/features/chat/types";

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function timeAgo(d: string, ar: boolean) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return ar ? "الآن" : "now";
  if (m < 60) return ar ? `${m}د` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `${h}س` : `${h}h`;
  return ar ? `${Math.floor(h / 24)}ي` : `${Math.floor(h / 24)}d`;
}
function fmt(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function initials(name: string | null) {
  return (name ?? "?")[0].toUpperCase();
}

// ─── types ────────────────────────────────────────────────────────────────────
// ─── component ────────────────────────────────────────────────────────────────
export default function FloatingChatWidget() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";

  // ─── widget state ────────────────────────────────────────────────────────
  const [open, setOpen]             = useState(false);
  const [view, setView]             = useState<"list" | "chat">("list");
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOther, setActiveOther]   = useState<Conversation["other_user"] | null>(null);

  // ─── data ────────────────────────────────────────────────────────────────
  const [myId, setMyId]             = useState<string | null>(null);
  const [convs, setConvs]           = useState<Conversation[]>([]);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [sending, setSending]       = useState(false);
  const [text, setText]             = useState("");
  const [apiError, setApiError]     = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const realtimeCh = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const globalCh   = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // ─── colours ─────────────────────────────────────────────────────────────
  const GOLD   = "#FFB800";
  const GREEN  = "#00D26A";
  const BG     = dark ? "#0D1623" : "#FFFFFF";
  const BG2    = dark ? "#060d18" : "#F8FAFC";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const INPUT  = dark ? "#0a121c" : "#F8FAFC";
  const myBg   = dark ? "#1a3a5c" : "#FFF3CC";
  const thBg   = dark ? "#0f1e2e" : "#F1F5F9";

  // ─── get own id ──────────────────────────────────────────────────────────
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  // ─── load conversations ──────────────────────────────────────────────────
  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    const res = await fetch("/api/chat/conversations");
    if (res.ok) {
      const { conversations } = await res.json();
      // Deduplicate by id in case of race conditions
      const seen = new Set<string>();
      const deduped = (conversations ?? []).filter((c: { id: string }) => seen.has(c.id) ? false : (seen.add(c.id), true));
      setConvs(deduped);
    }
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    if (open) loadConvs();
  }, [open, loadConvs]);

  // ─── global realtime: listen to ALL my messages for list-view notifications ─
  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    const ch = supabase
      .channel("fw:global")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (p) => {
        const m = p.new as Message;
        if (m.sender_id === myId) return;
        if (m.conversation_id === activeConvId) return;
        // Read latest convs snapshot outside updater to avoid calling side-effects inside setState
        setConvs((prev) => {
          const idx = prev.findIndex((c) => c.id === m.conversation_id);
          if (idx === -1) return prev; // unknown conv — will appear on next open
          const updated = {
            ...prev[idx],
            unread_count: prev[idx].unread_count + 1,
            last_message: m.content,
            last_message_at: m.created_at,
          };
          const next = prev.filter((_, i) => i !== idx);
          return [updated, ...next];
        });
      })
      .subscribe();
    globalCh.current = ch;
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  // ─── load messages ───────────────────────────────────────────────────────
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    setMessages([]);
    const res = await fetch(`/api/chat/conversations/${convId}/messages?limit=60`);
    if (res.ok) {
      const { messages: data } = await res.json();
      setMessages(data ?? []);
    }
    setLoadingMsgs(false);
    // mark read
    fetch(`/api/chat/conversations/${convId}/read`, { method: "PATCH" });
  }, []);

  // ─── realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`fw:${activeConvId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, (p) => {
        const m = p.new as Message;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (m.sender_id !== myId) {
          fetch(`/api/chat/conversations/${activeConvId}/read`, { method: "PATCH" });
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConvId}`,
      }, (p) => {
        const u = p.new as Message;
        setMessages((prev) => prev.map((m) => m.id === u.id ? { ...m, is_read: u.is_read } : m));
      })
      .subscribe();
    realtimeCh.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [activeConvId, myId]);

  // ─── scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // listen for "open-chat-widget" fired from any page
  useEffect(() => {
    async function handler(e: Event) {
      const detail = (e as CustomEvent<{ otherUserId?: string; conversationId?: string }>).detail;
      setOpen(true);

      if (detail?.conversationId) {
        // direct open by conversation id
        const convId = detail.conversationId;
        setActiveConvId(convId);
        setView("chat");
        loadMessages(convId);
        return;
      }

      const targetId = detail?.otherUserId;
      if (targetId) {
        setOpeningChat(true);
        try {
          const res = await fetch("/api/chat/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ other_user_id: targetId }),
          });
          const body = await res.json();
          if (res.ok && body.conversation) {
            const conv = body.conversation;
            setActiveConvId(conv.id);
            setView("chat");
            loadMessages(conv.id);
          }
        } finally {
          setOpeningChat(false);
        }
      }
    }
    window.addEventListener("open-chat-widget", handler);
    return () => window.removeEventListener("open-chat-widget", handler);
  }, [loadMessages]);

  function handleFabClick() {
    setOpen((prev) => !prev);
  }

  function openConv(c: Conversation) {
    setActiveConvId(c.id);
    setActiveOther(c.other_user);
    setView("chat");
    loadMessages(c.id);
    // Clear unread count optimistically
    setConvs((prev) => prev.map((x) => x.id === c.id ? { ...x, unread_count: 0 } : x));
  }

  // ─── send message ─────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || !activeConvId) return;
    setSending(true);
    setText("");
    const opt: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: activeConvId,
      sender_id: myId!,
      content: trimmed,
      message_type: "text",
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((p) => [...p, opt]);
    const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages((p) => p.map((m) => m.id === opt.id ? message : m));
      // refresh list to update last_message_at
      loadConvs();
    } else {
      setMessages((p) => p.filter((m) => m.id !== opt.id));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ─── render ───────────────────────────────────────────────────────────────
  const totalUnread = convs.reduce((s, c) => s + (c.unread_count ?? 0), 0);
  const panelW = 360;
  const panelH = 520;

  const TX = {
    ar: { title: "المحادثات", back: "رجوع", empty: "لا توجد محادثات", placeholder: "اكتب رسالة...", startNew: "ابدأ محادثة جديدة", noLogin: "سجّل دخولك أولاً" },
    en: { title: "Messages",  back: "Back", empty: "No conversations yet", placeholder: "Type a message…", startNew: "Start new chat", noLogin: "Login to message" },
  }[lang];

  return (
    <>
      <style>{`@keyframes fw-spin{to{transform:rotate(360deg)}} @keyframes fw-pop{from{opacity:0;transform:translateY(12px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 84, insetInlineEnd: 24, zIndex: 9998,
          width: panelW, height: panelH,
          backgroundColor: BG, border: `1px solid ${BORDER}`,
          borderRadius: 18,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "fw-pop 0.22s ease",
          direction: ar ? "rtl" : "ltr",
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: "14px 16px", borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            backgroundColor: BG,
          }}>
            {view === "chat" && (
              <button onClick={() => setView("list")} style={{
                background: "none", border: "none", cursor: "pointer", color: MUTED,
                padding: "4px 6px", borderRadius: 6, fontSize: 13, flexShrink: 0,
              }}>
                {ar ? "→" : "←"} {TX.back}
              </button>
            )}
            {view === "chat" && activeOther ? (
              <>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: dark ? "#1e293b" : "#e2e8f0",
                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: MUTED,
                }}>
                  {activeOther.avatar_url
                    ? <img src={activeOther.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials(activeOther.full_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeOther.full_name ?? activeOther.handle}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: GREEN }}>Online</p>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: TEXT, flex: 1 }}>{TX.title}</p>
            )}
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer", color: MUTED,
              fontSize: 18, lineHeight: 1, padding: "2px 4px", flexShrink: 0,
            }}>×</button>
          </div>

          {/* ── Body ── */}
          {view === "list" ? (
            // Conversation list
            <div style={{ flex: 1, overflowY: "auto" }}>
              {apiError && (
                <div style={{ padding: "10px 16px", backgroundColor: "rgba(239,68,68,0.1)", borderBottom: `1px solid ${BORDER}` }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>❌ {apiError}</p>
                </div>
              )}

              {loadingConvs ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: "fw-spin 0.7s linear infinite" }} />
                </div>
              ) : convs.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 13 }}>{TX.empty}</div>
              ) : (
                convs.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i).map((c) => {
                  const hasUnread = c.unread_count > 0;
                  return (
                    <button key={c.id} onClick={() => openConv(c)} style={{
                      width: "100%", padding: "11px 16px", border: "none", borderBottom: `1px solid ${BORDER}`,
                      cursor: "pointer", backgroundColor: "transparent",
                      display: "flex", alignItems: "center", gap: 10,
                      direction: ar ? "rtl" : "ltr", textAlign: ar ? "right" : "left",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BG2)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        backgroundColor: dark ? "#1e293b" : "#e2e8f0",
                        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: MUTED,
                        border: hasUnread ? `2px solid ${GOLD}` : "2px solid transparent",
                      }}>
                        {c.other_user?.avatar_url
                          ? <img src={c.other_user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : initials(c.other_user?.full_name ?? null)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontWeight: hasUnread ? 700 : 500, fontSize: 13, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                            {c.other_user?.full_name ?? c.other_user?.handle ?? "—"}
                          </span>
                          <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{timeAgo(c.last_message_at, ar)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                            {c.last_message ?? "—"}
                          </span>
                          {hasUnread && (
                            <span style={{
                              minWidth: 16, height: 16, borderRadius: 8, backgroundColor: GOLD,
                              color: "#000", fontSize: 10, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              padding: "0 4px", flexShrink: 0,
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
          ) : (
            // Chat window
            <>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", backgroundColor: BG2 }}>
                {loadingMsgs ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: "fw-spin 0.7s linear infinite" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 13, textAlign: "center" }}>
                    {ar ? "ابدأ المحادثة 👋" : "Start the conversation 👋"}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === myId;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 4 }}>
                        <div style={{
                          maxWidth: "78%", padding: "8px 12px",
                          borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          backgroundColor: isMine ? myBg : thBg,
                          border: isMine ? `1px solid ${GOLD}33` : `1px solid ${BORDER}`,
                        }}>
                          <p style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.5, wordBreak: "break-word" }}>{msg.content}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
                            <span style={{ fontSize: 10, color: MUTED }}>{fmt(msg.created_at)}</span>
                            {isMine && <span style={{ fontSize: 10, color: msg.is_read ? GOLD : MUTED }}>{msg.is_read ? "✓✓" : "✓"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: "10px 12px", display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0, backgroundColor: BG, direction: ar ? "rtl" : "ltr" }}>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={TX.placeholder}
                  rows={1}
                  style={{
                    flex: 1, resize: "none", border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: "8px 12px", backgroundColor: INPUT, color: TEXT,
                    fontSize: 13, outline: "none", fontFamily: "'Cairo',sans-serif",
                    lineHeight: 1.5, maxHeight: 100, direction: ar ? "rtl" : "ltr",
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "36px";
                    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                  }}
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  style={{
                    width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                    backgroundColor: text.trim() && !sending ? GOLD : (dark ? "#1e293b" : "#e2e8f0"),
                    color: text.trim() && !sending ? "#000" : MUTED,
                    cursor: text.trim() && !sending ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, transition: "background 0.2s",
                  }}
                >
                  {sending
                    ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid #00000033`, borderTopColor: "#000", animation: "fw-spin 0.7s linear infinite" }} />
                    : (ar ? "←" : "→")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={handleFabClick}
        style={{
          position: "fixed", bottom: 24, insetInlineEnd: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          backgroundColor: GOLD, cursor: "pointer", overflow: "visible",
          boxShadow: "0 8px 24px rgba(255,184,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
          fontSize: 22,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(255,184,0,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,184,0,0.45)";
        }}
        title={ar ? "فتح المحادثات" : "Open Messages"}
      >
        {open ? "✕" : "💬"}
        {!open && totalUnread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            backgroundColor: "#EF4444", color: "#fff",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid " + (dark ? "#0D1623" : "#fff"),
          }}>
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    </>
  );
}
