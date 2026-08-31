"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminEmailLogRow } from "@/features/admin/services/admin.service";
import { Mail, RefreshCw, Send, X } from "lucide-react";

const TEMPLATE_LABEL: Record<string, { ar: string; en: string }> = {
  profile_approved:      { ar: "موافقة على البروفايل", en: "Profile approved" },
  verification_approved: { ar: "موافقة على التوثيق",   en: "Verification approved" },
  custom:                { ar: "مخصص", en: "Custom" },
};

const TX = {
  ar: {
    compose: "إرسال إيميل", to: "المستلم", recipient: "recipientId (اختياري)",
    recipientHint: "اسيبه فاضي وحط الإيميل يدوي، أو حط profiles.id لو الشخص عنده حساب",
    email: "الإيميل", subject: "الموضوع", body: "المحتوى (HTML)",
    send: "إرسال", sending: "بيتبعت...", cancel: "إلغاء",
    recipientCol: "المستلم", subjectCol: "الموضوع", templateCol: "النوع",
    statusCol: "الحالة", dateCol: "التاريخ",
    sent: "اتبعت", failed: "فشل",
    resend: "إعادة إرسال", resending: "بيتبعت تاني...",
    noEmails: "لسه مفيش إيميلات اتبعتت", emails: "إيميل",
    close: "إغلاق", error: "الخطأ",
  },
  en: {
    compose: "Send Email", to: "Recipient", recipient: "recipientId (optional)",
    recipientHint: "Leave blank and type an email manually, or pass a profiles.id if they have an account",
    email: "Email", subject: "Subject", body: "Body (HTML)",
    send: "Send", sending: "Sending...", cancel: "Cancel",
    recipientCol: "Recipient", subjectCol: "Subject", templateCol: "Type",
    statusCol: "Status", dateCol: "Date",
    sent: "Sent", failed: "Failed",
    resend: "Resend", resending: "Resending...",
    noEmails: "No emails sent yet", emails: "emails",
    close: "Close", error: "Error",
  },
};

interface Props {
  emails:   AdminEmailLogRow[];
  total:    number;
  page:     number;
  pageSize: number;
}

function hrefFor(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  return `/admin/emails?${params.toString()}`;
}

export default function EmailLogView({ emails, total, page, pageSize }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [selected, setSelected] = useState<AdminEmailLogRow | null>(null);
  const [composing, setComposing] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [form, setForm] = useState({ recipientId: "", to: "", subject: "", html: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  async function resend(id: string) {
    setResendingId(id);
    await fetch(`/api/admin/emails/${id}/resend`, { method: "POST" }).catch(() => {});
    setResendingId(null);
    router.refresh();
  }

  async function submitCompose() {
    setSending(true);
    setSendError(null);
    const res = await fetch("/api/admin/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: form.recipientId.trim() || undefined,
        to: form.to.trim() || undefined,
        subject: form.subject,
        html: form.html,
      }),
    });
    setSending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setSendError(json.error ?? "send failed");
      return;
    }
    setComposing(false);
    setForm({ recipientId: "", to: "", subject: "", html: "" });
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: dark ? "#0a121c" : "#f8fafc",
    color: TEXT, padding: 10, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 12, display: "block", marginBottom: 6 };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.emails}</span>
        <button
          onClick={() => setComposing(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          <Send size={13} />{t.compose}
        </button>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {emails.length === 0 ? <EmptyState message={t.noEmails} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.recipientCol}</th>
                  <th style={thStyle}>{t.subjectCol}</th>
                  <th style={thStyle}>{t.templateCol}</th>
                  <th style={thStyle}>{t.statusCol}</th>
                  <th style={thStyle}>{t.dateCol}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => {
                  const tpl = TEMPLATE_LABEL[e.template] ?? { ar: e.template, en: e.template };
                  return (
                    <tr key={e.id} onClick={() => setSelected(e)} style={{ cursor: "pointer" }}>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>{e.recipientName ?? e.recipientEmail}</div>
                        {e.recipientName && <div style={{ color: MUTED, fontSize: 11 }}>{e.recipientEmail}</div>}
                      </td>
                      <td style={cellStyle}>{e.subject}</td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: "rgba(76,141,255,0.14)", color: "#4c8dff" }}>
                          {tpl[lang]}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          backgroundColor: e.status === "sent" ? "rgba(0,210,106,0.15)" : "rgba(239,68,68,0.15)",
                          color: e.status === "sent" ? "#00D26A" : "#EF4444",
                        }}>
                          {e.status === "sent" ? t.sent : t.failed}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(e.createdAt).toLocaleString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={{ ...cellStyle, width: 1 }}>
                        <button
                          disabled={resendingId === e.id}
                          onClick={(ev) => { ev.stopPropagation(); resend(e.id); }}
                          title={t.resend}
                          aria-label={t.resend}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", display: "flex", padding: 4 }}
                        >
                          <RefreshCw size={15} className={resendingId === e.id ? "spin" : undefined} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={hrefFor} />

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(560px, 100%)", maxHeight: "85vh", overflowY: "auto", padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{selected.subject}</h2>
                <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={12} />{selected.recipientEmail}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            {selected.status === "failed" && selected.error && (
              <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>{t.error}</p>
                <p style={{ color: TEXT, fontSize: 12, margin: 0 }}>{selected.error}</p>
              </div>
            )}

            <div
              style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, backgroundColor: dark ? "#0a121c" : "#f8fafc" }}
              dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
            />

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                disabled={resendingId === selected.id}
                onClick={() => resend(selected.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
              >
                <RefreshCw size={13} />{resendingId === selected.id ? t.resending : t.resend}
              </button>
            </div>
          </div>
        </div>
      )}

      {composing && (
        <div
          onClick={() => !sending && setComposing(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(560px, 100%)", maxHeight: "85vh", overflowY: "auto", padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{t.compose}</h2>
              <button onClick={() => setComposing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>{t.recipient}</label>
                <input value={form.recipientId} onChange={(e) => setForm((f) => ({ ...f, recipientId: e.target.value }))} placeholder="profiles.id" style={inputStyle} />
                <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0" }}>{t.recipientHint}</p>
              </div>
              <div>
                <label style={labelStyle}>{t.email}</label>
                <input value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} placeholder="name@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.subject}</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t.body}</label>
                <textarea value={form.html} onChange={(e) => setForm((f) => ({ ...f, html: e.target.value }))} rows={8} style={{ ...inputStyle, resize: "vertical", direction: "ltr" }} />
              </div>

              {sendError && <p style={{ color: "#EF4444", fontSize: 12, margin: 0 }}>{sendError}</p>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setComposing(false)} disabled={sending} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}>
                  {t.cancel}
                </button>
                <button
                  disabled={sending || !form.subject.trim() || !form.html.trim() || (!form.recipientId.trim() && !form.to.trim())}
                  onClick={submitCompose}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: sending ? 0.7 : 1 }}
                >
                  {sending ? t.sending : t.send}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
