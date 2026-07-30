"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Send, Users, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import EmptyState from "@/components/admin/EmptyState";
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  type NotificationPriority,
  type NotificationType,
} from "@/lib/notifications/types";
import { TYPE_ICON, TYPE_LABEL } from "@/lib/notifications/templates";

// ─── Copy ────────────────────────────────────────────────────────────────────

const TX = {
  ar: {
    title:       "مركز الإشعارات",
    compose:     "إنشاء إشعار",
    recipients:  "المستلمون",
    single:      "مستخدم واحد",
    multiple:    "عدة مستخدمين",
    role:        "حسب الدور",
    category:    "حسب التصنيف",
    everyone:    "الجميع",
    searchUsers: "ابحث بالاسم أو المعرّف…",
    selected:    "المحدد",
    type:        "النوع",
    priority:    "الأولوية",
    titleAr:     "العنوان (عربي)",
    titleEn:     "العنوان (إنجليزي — اختياري)",
    messageAr:   "الرسالة (عربي)",
    messageEn:   "الرسالة (إنجليزي — اختياري)",
    actionUrl:   "رابط الإجراء (مسار داخلي مثل /jobs/123)",
    expiresAt:   "تاريخ الانتهاء (اختياري)",
    preview:     "معاينة",
    previewTitle: "معاينة الإشعار",
    reach:       "سيصل إلى",
    users:       "مستخدم",
    send:        "إرسال",
    sending:     "جاري الإرسال…",
    sent:        "تم الإرسال إلى",
    history:     "سجل الإرسال",
    noHistory:   "لم يتم إرسال أي إشعار بعد",
    audience:    "الجمهور",
    count:       "العدد",
    date:        "التاريخ",
    sender:      "المُرسِل",
    low: "منخفضة", normal: "عادية", high: "مرتفعة", urgent: "عاجلة",
    reqTitle:    "العنوان والرسالة مطلوبان",
    reqAudience: "اختر مستلمًا واحدًا على الأقل",
    loadMore:    "تحميل المزيد",
  },
  en: {
    title:       "Notification Center",
    compose:     "Compose notification",
    recipients:  "Recipients",
    single:      "Single user",
    multiple:    "Multiple users",
    role:        "By role",
    category:    "By category",
    everyone:    "Everyone",
    searchUsers: "Search by name or handle…",
    selected:    "Selected",
    type:        "Type",
    priority:    "Priority",
    titleAr:     "Title (Arabic)",
    titleEn:     "Title (English — optional)",
    messageAr:   "Message (Arabic)",
    messageEn:   "Message (English — optional)",
    actionUrl:   "Action URL (internal path, e.g. /jobs/123)",
    expiresAt:   "Expires at (optional)",
    preview:     "Preview",
    previewTitle: "Notification preview",
    reach:       "Will reach",
    users:       "users",
    send:        "Send",
    sending:     "Sending…",
    sent:        "Sent to",
    history:     "Send history",
    noHistory:   "Nothing has been sent yet",
    audience:    "Audience",
    count:       "Count",
    date:        "Date",
    sender:      "Sender",
    low: "Low", normal: "Normal", high: "High", urgent: "Urgent",
    reqTitle:    "Title and message are required",
    reqAudience: "Pick at least one recipient",
    loadMore:    "Load more",
  },
};

type AudienceMode = "single" | "multiple" | "role" | "category" | "everyone";

interface PickerUser {
  id:         string;
  full_name:  string | null;
  handle:     string | null;
  role:       string;
  avatar_url: string | null;
}

interface PickerCategory {
  id:        string;
  label_ar:  string;
  label_en:  string;
  role_type: string;
}

interface Broadcast {
  id:              string;
  audience:        string;
  type:            string;
  title:           string;
  message:         string;
  priority:        string;
  recipient_count: number;
  created_at:      string;
  sender_name:     string | null;
}

const PRIORITY_TONE: Record<NotificationPriority, string> = {
  low:    "#94A3B8",
  normal: "#0EA5E9",
  high:   "#F4B740",
  urgent: "#EF4444",
};

export default function AdminNotificationsClient() {
  const { dark, lang } = useSite();
  const t  = TX[lang];
  const ar = lang === "ar";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const FIELD  = dark ? "#0a121c" : "#f8fafc";
  const GREEN  = "#00D26A";

  // ─── Composer state ───────────────────────────────────────────────────────
  const [mode,        setMode]        = useState<AudienceMode>("single");
  const [userIds,     setUserIds]     = useState<string[]>([]);
  const [roles,       setRoles]       = useState<string[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [type,        setType]        = useState<NotificationType>("ADMIN_MESSAGE");
  const [priority,    setPriority]    = useState<NotificationPriority>("normal");
  const [titleAr,     setTitleAr]     = useState("");
  const [titleEn,     setTitleEn]     = useState("");
  const [messageAr,   setMessageAr]   = useState("");
  const [messageEn,   setMessageEn]   = useState("");
  const [actionUrl,   setActionUrl]   = useState("");
  const [expiresAt,   setExpiresAt]   = useState("");

  // ─── Picker data ──────────────────────────────────────────────────────────
  const [query,        setQuery]        = useState("");
  const [users,        setUsers]        = useState<PickerUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<PickerUser[]>([]);
  const [allCategories, setAllCategories] = useState<PickerCategory[]>([]);
  const [allRoles,     setAllRoles]     = useState<string[]>([]);

  // ─── Feedback ─────────────────────────────────────────────────────────────
  const [reach,   setReach]   = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [notice,  setNotice]  = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // ─── History ──────────────────────────────────────────────────────────────
  const [history,     setHistory]     = useState<Broadcast[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMore, setHistoryMore] = useState(false);

  // ─── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/admin/notifications/recipients?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          setUsers(d.users ?? []);
          setAllCategories(d.categories ?? []);
          setAllRoles(d.roles ?? []);
        })
        .catch(() => {});
    }, query ? 280 : 0);   // debounce typing, but load immediately on mount
    return () => clearTimeout(timer);
  }, [query]);

  const loadHistory = useCallback(async (page: number) => {
    const res = await fetch(`/api/admin/notifications?page=${page}&pageSize=15`);
    if (!res.ok) return;
    const data = await res.json();
    setHistory((prev) => (page === 1 ? data.broadcasts : [...prev, ...data.broadcasts]));
    setHistoryMore(data.hasMore);
    setHistoryPage(page);
  }, []);

  useEffect(() => { void loadHistory(1); }, [loadHistory]);

  // ─── Audience payload ─────────────────────────────────────────────────────

  const audiencePayload = useMemo(() => {
    switch (mode) {
      case "single":   return { audience: "single",   user_id: userIds[0] };
      case "multiple": return { audience: "multiple", user_ids: userIds };
      case "role":     return { audience: "role",     roles };
      case "category": return { audience: "category", categories };
      case "everyone": return { audience: "everyone" };
    }
  }, [mode, userIds, roles, categories]);

  const audienceReady =
    mode === "everyone" ||
    (mode === "single"   && userIds.length === 1) ||
    (mode === "multiple" && userIds.length > 0)   ||
    (mode === "role"     && roles.length > 0)     ||
    (mode === "category" && categories.length > 0);

  // Recompute the reach estimate whenever the audience changes.
  useEffect(() => {
    if (!audienceReady) { setReach(null); return; }
    let cancelled = false;

    fetch("/api/admin/notifications/preview", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(audiencePayload),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setReach(d?.recipient_count ?? null); })
      .catch(() => { if (!cancelled) setReach(null); });

    return () => { cancelled = true; };
  }, [audiencePayload, audienceReady]);

  // ─── Send ─────────────────────────────────────────────────────────────────

  async function handleSend() {
    setNotice(null);

    if (!audienceReady)                    { setNotice({ kind: "err", text: t.reqAudience }); return; }
    if (!titleAr.trim() || !messageAr.trim()) { setNotice({ kind: "err", text: t.reqTitle }); return; }

    setSending(true);
    const res = await fetch("/api/admin/notifications", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        ...audiencePayload,
        type,
        priority,
        title:      titleAr.trim(),
        title_en:   titleEn.trim()   || null,
        message:    messageAr.trim(),
        message_en: messageEn.trim() || null,
        action_url: actionUrl.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    }).catch(() => null);

    setSending(false);

    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setNotice({ kind: "err", text: body?.error ?? "Send failed" });
      return;
    }

    const body = await res.json();
    setNotice({ kind: "ok", text: `${t.sent} ${body.recipient_count} ${t.users}` });

    setTitleAr(""); setTitleEn(""); setMessageAr(""); setMessageEn("");
    setActionUrl(""); setExpiresAt("");
    void loadHistory(1);
  }

  // ─── Shared styles ────────────────────────────────────────────────────────

  const field: React.CSSProperties = {
    width:        "100%",
    padding:      "10px 12px",
    borderRadius: 10,
    border:       `1px solid ${BORDER}`,
    background:   FIELD,
    color:        TEXT,
    fontSize:     14,
    outline:      "none",
  };

  const label: React.CSSProperties = {
    display:      "block",
    fontSize:     12,
    fontWeight:   600,
    color:        MUTED,
    marginBottom: 6,
  };

  const panel: React.CSSProperties = {
    background:   CARD,
    border:       `1px solid ${BORDER}`,
    borderRadius: 16,
    padding:      20,
  };

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearAudience() {
    setUserIds([]);
    setSelectedUsers([]);
    setRoles([]);
    setCategories([]);
  }

  function toggleUser(u: PickerUser) {
    const picked = userIds.includes(u.id);
    if (mode === "single") {
      setUserIds([u.id]);
      setSelectedUsers([u]);
      return;
    }
    setUserIds(picked ? userIds.filter((id) => id !== u.id) : [...userIds, u.id]);
    setSelectedUsers(picked ? selectedUsers.filter((x) => x.id !== u.id) : [...selectedUsers, u]);
  }

  const MODES: { key: AudienceMode; label: string }[] = [
    { key: "single",   label: t.single },
    { key: "multiple", label: t.multiple },
    { key: "role",     label: t.role },
    { key: "category", label: t.category },
    { key: "everyone", label: t.everyone },
  ];

  return (
    <AdminShell title={t.title}>
      <div dir={ar ? "rtl" : "ltr"} style={{ display: "grid", gap: 20 }}>

        {/* ─── Composer ─────────────────────────────────────────────────── */}
        <section style={panel}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: "0 0 18px" }}>
            {t.compose}
          </h2>

          {/* Recipient mode */}
          <div style={{ marginBottom: 18 }}>
            <span style={label}>{t.recipients}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MODES.map(({ key, label: text }) => {
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setMode(key); clearAudience(); }}
                    style={{
                      display:      "inline-flex",
                      alignItems:   "center",
                      gap:          6,
                      padding:      "8px 14px",
                      borderRadius: 999,
                      border:       `1px solid ${active ? GREEN : BORDER}`,
                      background:   active ? "rgba(0,210,106,0.12)" : "transparent",
                      color:        active ? GREEN : MUTED,
                      fontSize:     13,
                      fontWeight:   active ? 700 : 500,
                      cursor:       "pointer",
                    }}
                  >
                    {active && <Check size={13} />}
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User picker */}
          {(mode === "single" || mode === "multiple") && (
            <div style={{ marginBottom: 18 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchUsers}
                style={{ ...field, marginBottom: 10 }}
              />

              {selectedUsers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {selectedUsers.map((u) => (
                    <span key={u.id} style={{
                      display:      "inline-flex",
                      alignItems:   "center",
                      gap:          6,
                      padding:      "4px 10px",
                      borderRadius: 999,
                      background:   "rgba(0,210,106,0.12)",
                      color:        GREEN,
                      fontSize:     12,
                      fontWeight:   600,
                    }}>
                      {u.full_name || u.handle || u.id.slice(0, 8)}
                      <X
                        size={13}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setUserIds(userIds.filter((id) => id !== u.id));
                          setSelectedUsers(selectedUsers.filter((x) => x.id !== u.id));
                        }}
                      />
                    </span>
                  ))}
                </div>
              )}

              <div style={{
                maxHeight:    220,
                overflowY:    "auto",
                border:       `1px solid ${BORDER}`,
                borderRadius: 10,
              }}>
                {users.length === 0 ? (
                  <div style={{ padding: 16, color: MUTED, fontSize: 13, textAlign: "center" }}>—</div>
                ) : users.map((u) => {
                  const picked = userIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u)}
                      style={{
                        display:      "flex",
                        alignItems:   "center",
                        gap:          10,
                        width:        "100%",
                        padding:      "9px 12px",
                        background:   picked ? "rgba(0,210,106,0.08)" : "transparent",
                        border:       "none",
                        borderBottom: `1px solid ${BORDER}`,
                        cursor:       "pointer",
                        textAlign:    ar ? "right" : "left",
                      }}
                    >
                      <span style={{
                        width:          28,
                        height:         28,
                        borderRadius:   "50%",
                        background:     dark ? "#152238" : "#E2E8F0",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        fontSize:       12,
                        fontWeight:     700,
                        color:          MUTED,
                        flexShrink:     0,
                      }}>
                        {(u.full_name ?? u.handle ?? "?")[0]?.toUpperCase()}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT }}>
                          {u.full_name || u.handle || u.id.slice(0, 8)}
                        </span>
                        <span style={{ display: "block", fontSize: 11, color: MUTED }}>
                          {u.role}{u.handle ? ` · @${u.handle}` : ""}
                        </span>
                      </span>
                      {picked && <Check size={15} color={GREEN} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role picker */}
          {mode === "role" && (
            <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allRoles.map((r) => {
                const picked = roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggle(roles, r, setRoles)}
                    style={{
                      padding:      "8px 16px",
                      borderRadius: 10,
                      border:       `1px solid ${picked ? GREEN : BORDER}`,
                      background:   picked ? "rgba(0,210,106,0.12)" : "transparent",
                      color:        picked ? GREEN : MUTED,
                      fontSize:     13,
                      fontWeight:   picked ? 700 : 500,
                      cursor:       "pointer",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          )}

          {/* Category picker */}
          {mode === "category" && (
            <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allCategories.map((c) => {
                const picked = categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(categories, c.id, setCategories)}
                    style={{
                      padding:      "8px 16px",
                      borderRadius: 10,
                      border:       `1px solid ${picked ? GREEN : BORDER}`,
                      background:   picked ? "rgba(0,210,106,0.12)" : "transparent",
                      color:        picked ? GREEN : MUTED,
                      fontSize:     13,
                      fontWeight:   picked ? 700 : 500,
                      cursor:       "pointer",
                    }}
                  >
                    {ar ? c.label_ar : c.label_en}
                  </button>
                );
              })}
            </div>
          )}

          {/* Type + priority */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <span style={label}>{t.type}</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                style={field}
              >
                {NOTIFICATION_TYPES.map((code) => (
                  <option key={code} value={code}>
                    {TYPE_ICON[code]} {ar ? TYPE_LABEL[code].ar : TYPE_LABEL[code].en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={label}>{t.priority}</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                style={field}
              >
                {NOTIFICATION_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{t[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Copy */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <span style={label}>{t.titleAr}</span>
              <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} maxLength={160} style={field} />
            </div>
            <div>
              <span style={label}>{t.titleEn}</span>
              <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={160} style={field} dir="ltr" />
            </div>
            <div>
              <span style={label}>{t.messageAr}</span>
              <textarea value={messageAr} onChange={(e) => setMessageAr(e.target.value)} maxLength={1000} rows={3} style={{ ...field, resize: "vertical" }} />
            </div>
            <div>
              <span style={label}>{t.messageEn}</span>
              <textarea value={messageEn} onChange={(e) => setMessageEn(e.target.value)} maxLength={1000} rows={3} style={{ ...field, resize: "vertical" }} dir="ltr" />
            </div>
            <div>
              <span style={label}>{t.actionUrl}</span>
              <input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/jobs/123" style={field} dir="ltr" />
            </div>
            <div>
              <span style={label}>{t.expiresAt}</span>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={field} dir="ltr" />
            </div>
          </div>

          {/* ─── Live preview ───────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <span style={label}>
              <Eye size={12} style={{ display: "inline", marginInlineEnd: 4, verticalAlign: -1 }} />
              {t.previewTitle}
            </span>
            <div style={{
              display:      "flex",
              gap:          12,
              padding:      14,
              borderRadius: 12,
              border:       `1px dashed ${BORDER}`,
              background:   FIELD,
            }}>
              <div style={{
                width:          38,
                height:         38,
                borderRadius:   "50%",
                background:     `${PRIORITY_TONE[priority]}22`,
                border:         `1.5px solid ${PRIORITY_TONE[priority]}55`,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       17,
                flexShrink:     0,
              }}>
                {TYPE_ICON[type]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                  {(ar ? titleAr : titleEn || titleAr) || "—"}
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 3, whiteSpace: "pre-wrap" }}>
                  {(ar ? messageAr : messageEn || messageAr) || "—"}
                </div>
                {actionUrl && (
                  <div style={{ fontSize: 11, color: GREEN, marginTop: 6 }} dir="ltr">{actionUrl}</div>
                )}
              </div>
            </div>
          </div>

          {/* Footer: reach + send */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13 }}>
              <Users size={15} />
              {reach == null ? "—" : `${t.reach} ${reach} ${t.users}`}
            </span>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          8,
                padding:      "11px 24px",
                borderRadius: 12,
                border:       "none",
                background:   sending ? "rgba(0,210,106,0.4)" : GREEN,
                color:        "#0D1623",
                fontSize:     14,
                fontWeight:   700,
                cursor:       sending ? "default" : "pointer",
              }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? t.sending : t.send}
            </button>
          </div>

          {notice && (
            <div style={{
              marginTop:    14,
              padding:      "10px 14px",
              borderRadius: 10,
              fontSize:     13,
              fontWeight:   600,
              background:   notice.kind === "ok" ? "rgba(0,210,106,0.12)" : "rgba(239,68,68,0.12)",
              color:        notice.kind === "ok" ? GREEN : "#EF4444",
            }}>
              {notice.text}
            </div>
          )}
        </section>

        {/* ─── History ──────────────────────────────────────────────────── */}
        <section style={panel}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: "0 0 16px" }}>
            {t.history}
          </h2>

          {history.length === 0 ? (
            <EmptyState message={t.noHistory} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={{ color: MUTED, textAlign: ar ? "right" : "left" }}>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>{t.type}</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>{t.titleAr}</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>{t.audience}</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>{t.count}</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>{t.sender}</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((b) => (
                    <tr key={b.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "10px", color: TEXT }}>
                        {TYPE_ICON[b.type as NotificationType] ?? "🔔"}
                      </td>
                      <td style={{ padding: "10px", color: TEXT, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.title}
                      </td>
                      <td style={{ padding: "10px", color: MUTED }}>{b.audience}</td>
                      <td style={{ padding: "10px", color: GREEN, fontWeight: 700 }}>{b.recipient_count}</td>
                      <td style={{ padding: "10px", color: MUTED }}>{b.sender_name ?? "—"}</td>
                      <td style={{ padding: "10px", color: MUTED }} dir="ltr">
                        {new Date(b.created_at).toLocaleString(ar ? "ar-EG" : "en-GB")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {historyMore && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => loadHistory(historyPage + 1)}
                    style={{
                      padding:      "9px 20px",
                      borderRadius: 10,
                      border:       `1px solid ${BORDER}`,
                      background:   "transparent",
                      color:        TEXT,
                      fontSize:     13,
                      fontWeight:   600,
                      cursor:       "pointer",
                    }}
                  >
                    {t.loadMore}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
