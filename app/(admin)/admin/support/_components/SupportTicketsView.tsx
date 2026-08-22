"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminSupportTicket } from "@/features/admin/services/admin.service";
import { Copy, Image as ImageIcon, Mail, Phone, X } from "lucide-react";

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  new:         { bg: "rgba(239,68,68,0.15)",  text: "#EF4444" },
  in_progress: { bg: "rgba(244,183,64,0.15)", text: "#F4B740" },
  resolved:    { bg: "rgba(0,210,106,0.15)",  text: "#00D26A" },
};

const PAGE_LABEL: Record<string, { ar: string; en: string }> = {
  register: { ar: "صفحة إنشاء حساب", en: "Register page" },
  login:    { ar: "صفحة تسجيل الدخول", en: "Login page" },
};

const TX = {
  ar: {
    from: "من", subject: "الموضوع", status: "الحالة",
    submitted: "التاريخ", new: "جديدة", in_progress: "قيد المعالجة", resolved: "تم الحل",
    noRequests: "لا توجد تذاكر بعد", message: "الرسالة",
    attachment: "صورة المشكلة",
    source: "المصدر", errorSeen: "الخطأ الظاهر وقت الإرسال", reply: "الرد",
    replyPH: "اكتب ردك هنا...",
    send: "إرسال الرد", markInProgress: "قيد المعالجة", markResolved: "تم الحل",
    previousReply: "آخر رد", repliedAt: "بتاريخ",
    emailAuto: "هيتبعت للمستخدم تلقائي على إيميله.",
    emailManual: "الإيميل مش مربوط بالمنصة — الرد بيتحفظ هنا بس، لازم تتواصل مع المستخدم يدوي.",
    copyEmail: "نسخ الإيميل", copied: "اتنسخ ✓", tickets: "تذكرة",
  },
  en: {
    from: "From", subject: "Subject", status: "Status",
    submitted: "Date", new: "New", in_progress: "In progress", resolved: "Resolved",
    noRequests: "No tickets yet", message: "Message",
    attachment: "Problem screenshot",
    source: "Source", errorSeen: "Error shown at submit time", reply: "Reply",
    replyPH: "Write your reply...",
    send: "Send reply", markInProgress: "In progress", markResolved: "Resolved",
    previousReply: "Last reply", repliedAt: "on",
    emailAuto: "This will be emailed to the user automatically.",
    emailManual: "No email provider is connected — this reply is saved here only, you'll need to contact the user manually.",
    copyEmail: "Copy email", copied: "Copied ✓", tickets: "tickets",
  },
};

interface Props {
  tickets:         AdminSupportTicket[];
  total:           number;
  page:            number;
  pageSize:        number;
  status:          string;
  emailConfigured: boolean;
}

// Always carries an explicit status param (even "all") — the page's default
// status is "new", not "all", so a bare /admin/support would silently mean
// something different than the "All" tab that's currently active.
function hrefFor(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  params.set("status", status);
  return `/admin/support?${params.toString()}`;
}

export default function SupportTicketsView({ tickets, total, page, pageSize, status, emailConfigured }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [selected, setSelected] = useState<AdminSupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function patch(id: string, body: { status?: string; reply?: string }) {
    setSaving(true);
    await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSelected(null);
    setReply("");
    // A reply with no explicit status auto-resolves server-side — switch the
    // visible tab to match, so the ticket lands in front of the admin
    // instead of just vanishing from whichever filter they were on.
    const landedStatus = body.status ?? (body.reply ? "resolved" : null);
    if (landedStatus && landedStatus !== status) {
      router.push(hrefFor(1, landedStatus));
    } else {
      router.refresh();
    }
  }

  function copyEmail(email: string) {
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle:   React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.tickets}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {tickets.length === 0 ? <EmptyState message={t.noRequests} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.from}</th>
                  <th style={thStyle}>{t.subject}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.submitted}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((v) => {
                  const col = STATUS_COLOR[v.status] ?? STATUS_COLOR.new;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => { setSelected(v); setReply(v.adminReply ?? ""); }}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>{v.email}</div>
                        {v.phone && <div style={{ color: MUTED, fontSize: 11 }}>{v.phone}</div>}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {v.subject}
                          {v.attachmentUrl && <ImageIcon size={12} color={MUTED} />}
                        </div>
                        {v.context?.page && (
                          <div style={{ color: MUTED, fontSize: 11 }}>
                            {(PAGE_LABEL[v.context.page]?.[lang]) ?? v.context.page}
                          </div>
                        )}
                      </td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: col.bg, color: col.text }}>
                          {t[v.status as keyof typeof t] as string ?? v.status}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(v.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, status)} />

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
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: (STATUS_COLOR[selected.status] ?? STATUS_COLOR.new).bg, color: (STATUS_COLOR[selected.status] ?? STATUS_COLOR.new).text, display: "inline-block", marginTop: 6 }}>
                  {t[selected.status as keyof typeof t] as string}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, fontSize: 13, color: TEXT }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={13} color={MUTED} />
                {selected.email}
                <button
                  onClick={() => copyEmail(selected.email)}
                  title={t.copyEmail}
                  style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#00D26A" : MUTED, display: "flex", padding: 2 }}
                >
                  <Copy size={13} />
                </button>
                {copied && <span style={{ color: "#00D26A", fontSize: 11 }}>{t.copied}</span>}
              </div>
              {selected.phone && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={13} color={MUTED} />{selected.phone}</div>}
              {selected.context?.page && (
                <div style={{ color: MUTED, fontSize: 12 }}>
                  {t.source}: {(PAGE_LABEL[selected.context.page]?.[lang]) ?? selected.context.page}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>{t.message}</p>
              <p style={{ color: TEXT, fontSize: 14, margin: 0, whiteSpace: "pre-wrap" }}>{selected.message}</p>
            </div>

            {selected.attachmentUrl && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>{t.attachment}</p>
                <a href={selected.attachmentUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.attachmentUrl}
                    alt=""
                    style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: `1px solid ${BORDER}`, display: "block" }}
                  />
                </a>
              </div>
            )}

            {selected.context?.pageError && (
              <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>{t.errorSeen}</p>
                <p style={{ color: TEXT, fontSize: 12, margin: 0 }}>{selected.context.pageError}</p>
              </div>
            )}

            {selected.adminReply && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>
                  {t.previousReply}{selected.repliedAt ? ` — ${t.repliedAt} ${new Date(selected.repliedAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}` : ""}
                </p>
                <p style={{ color: TEXT, fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{selected.adminReply}</p>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 6 }}>{t.reply}</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder={t.replyPH}
                style={{
                  width: "100%", borderRadius: 8, border: `1px solid ${BORDER}`,
                  backgroundColor: dark ? "#0a121c" : "#f8fafc",
                  color: TEXT, padding: 10, fontSize: 13, resize: "vertical",
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
              <p style={{
                marginTop: 6, marginBottom: 0, fontSize: 11.5,
                color: emailConfigured ? "#00D26A" : "#F4B740",
              }}>
                {emailConfigured ? t.emailAuto : t.emailManual}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.status !== "in_progress" && (
                <button
                  disabled={saving}
                  onClick={() => patch(selected.id, { status: "in_progress" })}
                  style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}
                >
                  {t.markInProgress}
                </button>
              )}
              {selected.status !== "resolved" && (
                <button
                  disabled={saving}
                  onClick={() => patch(selected.id, { status: "resolved" })}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #00D26A", backgroundColor: "rgba(0,210,106,0.1)", color: "#00D26A", fontSize: 12.5, cursor: "pointer" }}
                >
                  {t.markResolved}
                </button>
              )}
              <button
                disabled={saving || !reply.trim()}
                onClick={() => patch(selected.id, { reply })}
                style={{ marginLeft: ar ? 0 : "auto", marginRight: ar ? "auto" : 0, padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: reply.trim() ? "pointer" : "not-allowed", opacity: reply.trim() ? 1 : 0.5 }}
              >
                {t.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
