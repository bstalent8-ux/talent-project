"use client";
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminIncompleteSignup } from "@/features/admin/services/admin.service";
import { completeProfileReminderEmail } from "@/lib/email/templates/complete-profile-reminder";
import { ChevronDown, ChevronUp, Mail, Send, UserPlus, X } from "lucide-react";

const COLLAPSE_STORAGE_KEY = "admin-dashboard-incomplete-signups-collapsed";

const TX = {
  ar: {
    title: "تسجيلات جديدة محتاجة تكمّل بروفايلها",
    subtitle: "صفر صور/فيديوهات بورتفوليو — أهم سبب مانع ظهورهم في البحث",
    name: "الاسم", status: "حالة الموافقة", registered: "تاريخ التسجيل",
    email: "الإيميل", registeredAt: "وقت التسجيل", account: "الحساب",
    reminded: "اتبعتله قبل كده", notReminded: "لسه متبعتش",
    sendOne: "ابعت تذكير", sending: "بيتبعت...", sent: "اتبعت ✓",
    sendAll: "ابعت لكل اللي لسه متبعتش", sendingAll: "بيتبعت للكل...",
    preview: "معاينة القالب", hidePreview: "إخفاء المعاينة",
    subject: "الموضوع",
    none: "مفيش حد جديد ناقصه صور دلوقتي",
    close: "إخفاء الكارت", reopen: "إظهار الكارت",
    pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض", suspended: "موقوف",
    results: (n: number) => `${n} تسجيل`,
  },
  en: {
    title: "New registrations that still need to complete their profile",
    subtitle: "Zero portfolio photos/videos — the top reason they don't show up in search",
    name: "Name", status: "Approval status", registered: "Registered",
    email: "Email", registeredAt: "Registered at", account: "Account",
    reminded: "Reminded already", notReminded: "Not reminded yet",
    sendOne: "Send reminder", sending: "Sending...", sent: "Sent ✓",
    sendAll: "Send to everyone not reminded yet", sendingAll: "Sending to all...",
    preview: "Preview template", hidePreview: "Hide preview",
    subject: "Subject",
    none: "No one new is missing photos right now",
    close: "Hide card", reopen: "Show card",
    pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended",
    results: (n: number) => `${n} signups`,
  },
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  approved:  { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  rejected:  { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
  suspended: { bg: "rgba(148,163,184,0.15)", text: "#94A3B8" },
};

const STATUS_LABEL: Record<string, { ar: string; en: string }> = {
  pending:   { ar: "قيد الانتظار", en: "Pending" },
  approved:  { ar: "معتمد",        en: "Approved" },
  rejected:  { ar: "مرفوض",        en: "Rejected" },
  suspended: { ar: "موقوف",        en: "Suspended" },
};

export default function IncompleteSignupsView({ signups }: { signups: AdminIncompleteSignup[] }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingAll, setSendingAll] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // Which row is expanded to show the account's email + exact registration
  // time — same click-to-reveal pattern as the "Preview template" toggle
  // above, just per-row instead of for the whole card.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Whole-card collapse — persisted, so dismissing it stays dismissed across
  // dashboard visits instead of reappearing every load. Read after mount
  // only (same reasoning as AdminShell's sidebar-mode: localStorage isn't
  // available during edge/server render).
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);
  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const notReminded = signups.filter((s) => !s.alreadyReminded && !sentIds.has(s.userId));

  async function sendOne(userId: string) {
    setSendingId(userId);
    await fetch("/api/admin/dashboard/complete-profile-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
    setSendingId(null);
    setSentIds((prev) => new Set(prev).add(userId));
    router.refresh();
  }

  async function sendAll() {
    setSendingAll(true);
    await fetch("/api/admin/dashboard/complete-profile-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: notReminded.map((s) => s.userId) }),
    }).catch(() => {});
    setSendingAll(false);
    setSentIds((prev) => {
      const next = new Set(prev);
      for (const s of notReminded) next.add(s.userId);
      return next;
    });
    router.refresh();
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  const sampleEmail = completeProfileReminderEmail(lang, signups[0]?.fullName ?? "");

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginTop: 24 }}>
      <div style={{ padding: "14px 16px", borderBottom: collapsed ? "none" : `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 6 }}>
            <UserPlus size={15} /> {t.title} ({signups.length})
          </p>
          {!collapsed && <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED }}>{t.subtitle}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {!collapsed && signups.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <button
                type="button"
                onClick={() => setShowPreview((s) => !s)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: 12.5, fontWeight: 600, padding: 0 }}
              >
                {showPreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showPreview ? t.hidePreview : t.preview}
              </button>
              {notReminded.length > 0 && (
                <button
                  type="button"
                  disabled={sendingAll}
                  onClick={sendAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                    border: "none", backgroundColor: "var(--color-primary)", color: "#fff",
                    fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: sendingAll ? 0.7 : 1,
                  }}
                >
                  <Send size={13} />{sendingAll ? t.sendingAll : `${t.sendAll} (${notReminded.length})`}
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? t.reopen : t.close}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 2, flexShrink: 0 }}
          >
            {collapsed ? <ChevronDown size={16} /> : <X size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && showPreview && signups.length > 0 && (
        <div style={{ padding: 14, borderBottom: `1px solid ${BORDER}`, backgroundColor: dark ? "#0a121c" : "#f8fafc" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
            <Mail size={12} /> {t.subject}: <span style={{ color: TEXT, fontWeight: 600 }}>{sampleEmail.subject}</span>
          </p>
          <div style={{ fontSize: 12.5, maxHeight: 180, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8, marginTop: 6 }}
            dangerouslySetInnerHTML={{ __html: sampleEmail.html }} />
        </div>
      )}

      {collapsed ? null : signups.length === 0 ? (
        <EmptyState message={t.none} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>{t.name}</th>
                <th style={thStyle}>{t.status}</th>
                <th style={thStyle}>{t.registered}</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => {
                const col = STATUS_COLOR[s.talentStatus] ?? STATUS_COLOR.pending;
                const wasReminded = s.alreadyReminded || sentIds.has(s.userId);
                const isExpanded = expandedId === s.userId;
                return (
                  <Fragment key={s.userId}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : s.userId)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isExpanded ? <ChevronUp size={13} color={MUTED} /> : <ChevronDown size={13} color={MUTED} />}
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.fullName ?? "—"}</div>
                            {s.handle && <div style={{ color: MUTED, fontSize: 11 }}>@{s.handle}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: col.bg, color: col.text }}>
                          {STATUS_LABEL[s.talentStatus]?.[lang] ?? s.talentStatus}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(s.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={{ ...cellStyle, width: 1, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        {wasReminded ? (
                          <span style={{ color: "#00D26A", fontSize: 12, fontWeight: 700 }}>{t.sent}</span>
                        ) : (
                          <button
                            disabled={sendingId === s.userId || !s.email}
                            onClick={() => sendOne(s.userId)}
                            title={s.email ?? undefined}
                            style={{
                              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                              border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: "var(--color-primary)",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: sendingId === s.userId ? 0.7 : 1,
                            }}
                          >
                            <Send size={12} />{sendingId === s.userId ? t.sending : t.sendOne}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} style={{ ...cellStyle, backgroundColor: TH }}>
                          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", fontSize: 12.5 }}>
                            <div>
                              <div style={{ color: MUTED, fontSize: 11, marginBottom: 2 }}>{t.account}</div>
                              <div style={{ fontWeight: 600 }}>{s.fullName ?? "—"} {s.handle && <span style={{ color: MUTED, fontWeight: 400 }}>· @{s.handle}</span>}</div>
                            </div>
                            <div>
                              <div style={{ color: MUTED, fontSize: 11, marginBottom: 2 }}>{t.email}</div>
                              {s.email ? (
                                <a href={`mailto:${s.email}`} style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>{s.email}</a>
                              ) : (
                                <span style={{ color: MUTED }}>—</span>
                              )}
                            </div>
                            <div>
                              <div style={{ color: MUTED, fontSize: 11, marginBottom: 2 }}>{t.registeredAt}</div>
                              <div style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                {new Date(s.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
