"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminVerification } from "@/features/admin/services/admin.service";
import { verificationApprovedNotificationContent } from "@/lib/notifications/content/verification-approved";
import { verificationApprovedEmail } from "@/lib/email/templates/verification-approved";
import { CheckCircle, ChevronDown, ChevronUp, ExternalLink, Mail, ShieldCheck, User, XCircle } from "lucide-react";

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  approved: { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  rejected: { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

const TX = {
  ar: {
    name: "الاسم", username: "اسم المستخدم", status: "الحالة",
    submitted: "تاريخ الطلب", idDoc: "وثيقة الهوية", selfie: "صورة شخصية",
    socialProof: "إثبات السوشيال", actions: "الإجراءات",
    pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض",
    approve: "موافقة", reject: "رفض",
    confirmApprove: "الموافقة على هذا الطلب وتوثيق الحساب؟",
    confirmReject:  "رفض طلب التحقق هذا؟",
    reasonLabel: "سبب الرفض (اختياري)",
    sendNotificationLabel: "إرسال إشعار داخل الموقع",
    sendEmailLabel: "إرسال إيميل",
    preview: "معاينة المحتوى",
    hidePreview: "إخفاء المعاينة",
    notificationPreview: "الإشعار",
    emailPreview: "الإيميل",
    subject: "الموضوع",
    noRequests: "لا توجد طلبات تحقق",
    view: "عرض",
    results: "طلب",
  },
  en: {
    name: "Name", username: "Username", status: "Status",
    submitted: "Submitted", idDoc: "ID Document", selfie: "Selfie",
    socialProof: "Social Proof", actions: "Actions",
    pending: "Pending", approved: "Approved", rejected: "Rejected",
    approve: "Approve", reject: "Reject",
    confirmApprove: "Approve request and mark account as verified",
    confirmReject:  "Reject this verification request?",
    reasonLabel: "Rejection reason (optional)",
    sendNotificationLabel: "Send in-app notification",
    sendEmailLabel: "Send email",
    preview: "Preview content",
    hidePreview: "Hide preview",
    notificationPreview: "Notification",
    emailPreview: "Email",
    subject: "Subject",
    noRequests: "No verification requests",
    view: "View",
    results: "requests",
  },
};

type ModalState = { type: "approve" | "reject"; id: string };

interface Props {
  verifications: AdminVerification[];
  total:         number;
  page:          number;
  pageSize:      number;
  status:        string;
}

// Always carries an explicit status param (even "all") — the page's default
// status is "pending", not "all", so a bare /admin/verifications would
// silently mean something different than the "All" tab that's currently active.
function hrefFor(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  params.set("status", status);
  return `/admin/verifications?${params.toString()}`;
}

export default function VerificationsTable({ verifications, total, page, pageSize, status }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [modal,   setModal]   = useState<ModalState | null>(null);
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  // Approve-only — the reject flow has no notification/email choice, it
  // always sends the rejection notification. Default true on both matches
  // the request: "الdefault يكونو معمولين اه" (send both by default).
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function runModal() {
    if (!modal) return;
    setLoading(true);
    await fetch(`/api/admin/verifications/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        modal.type === "approve"
          ? { action: modal.type, sendNotification, sendEmail }
          : { action: modal.type, reason }
      ),
    });
    setLoading(false);
    closeModal();
    router.refresh();
  }

  function closeModal() {
    setModal(null);
    setReason("");
    setSendNotification(true);
    setSendEmail(true);
    setShowPreview(false);
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };
  const thStyle:   React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  const confirmCfg = modal ? {
    approve: { color: "#00D26A", msg: t.confirmApprove, label: t.approve },
    reject:  { color: "#EF4444", msg: t.confirmReject,  label: t.reject  },
  }[modal.type] : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.results}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {verifications.length === 0 ? <EmptyState message={t.noRequests} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.name}</th>
                  <th style={thStyle}>{t.username}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.idDoc}</th>
                  <th style={thStyle}>{t.selfie}</th>
                  <th style={thStyle}>{t.socialProof}</th>
                  <th style={thStyle}>{t.submitted}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map(v => {
                  const col = STATUS_COLOR[v.status] ?? STATUS_COLOR.pending;
                  return (
                    <tr key={v.id}>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, backgroundColor: BORDER, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {v.avatarUrl ? (
                              <Image src={v.avatarUrl} alt="" width={34} height={34} style={{ objectFit: "cover" }} />
                            ) : (
                              <User size={16} color={MUTED} />
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>{v.fullName ?? "—"}</span>
                            {v.isVerified && (
                              <ShieldCheck size={14} color="#00D26A" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED }}>
                        {v.handle ? `@${v.handle}` : "—"}
                      </td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: col.bg, color: col.text }}>
                          {t[v.status as keyof typeof t] as string ?? v.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {v.idDocumentUrl ? (
                          <a href={v.idDocumentUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#60a5fa", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <ExternalLink size={13} /> {t.view}
                          </a>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={cellStyle}>
                        {v.selfieUrl ? (
                          <a href={v.selfieUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#60a5fa", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <ExternalLink size={13} /> {t.view}
                          </a>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={cellStyle}>
                        {v.socialProof ? (
                          <a href={v.socialProof} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#60a5fa", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <ExternalLink size={13} /> {t.view}
                          </a>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, color: MUTED }}>
                        {new Date(v.submittedAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {v.status !== "approved" && (
                            <button onClick={() => setModal({ type: "approve", id: v.id })}
                              title={t.approve}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#00D26A", padding: 4, borderRadius: 6, display: "flex" }}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {v.status !== "rejected" && (
                            <button onClick={() => setModal({ type: "reject", id: v.id })}
                              title={t.reject}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, borderRadius: 6, display: "flex" }}>
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
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

      {modal && confirmCfg && (
        <ConfirmationModal
          open
          title={confirmCfg.msg}
          confirmColor={confirmCfg.color}
          confirmLabel={loading ? (ar ? "جاري..." : "Loading...") : confirmCfg.label}
          onConfirm={runModal}
          onCancel={closeModal}
        >
          {modal.type === "approve" && (() => {
            const target = verifications.find(v => v.id === modal.id);
            const name = target?.fullName ?? "";
            const notif = verificationApprovedNotificationContent(lang);
            const email = verificationApprovedEmail(lang, name);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: TEXT, cursor: "pointer" }}>
                  <input type="checkbox" checked={sendNotification} onChange={e => setSendNotification(e.target.checked)} />
                  {t.sendNotificationLabel}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: TEXT, cursor: "pointer" }}>
                  <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
                  {t.sendEmailLabel}
                </label>

                <button
                  type="button"
                  onClick={() => setShowPreview(s => !s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: "var(--color-primary)", fontSize: 13, fontWeight: 600,
                  }}
                >
                  {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showPreview ? t.hidePreview : t.preview}
                </button>

                {showPreview && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sendNotification && (
                      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, backgroundColor: dark ? "#0a121c" : "#f8fafc" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
                          <ShieldCheck size={12} /> {t.notificationPreview}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>{notif.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: MUTED }}>{notif.message}</p>
                      </div>
                    )}
                    {sendEmail && (
                      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, backgroundColor: dark ? "#0a121c" : "#f8fafc" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
                          <Mail size={12} /> {t.emailPreview}
                        </p>
                        <p style={{ margin: "0 0 6px", fontSize: 12.5, color: MUTED }}>{t.subject}: <span style={{ color: TEXT, fontWeight: 600 }}>{email.subject}</span></p>
                        <div style={{ fontSize: 12.5, maxHeight: 160, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8 }}
                          dangerouslySetInnerHTML={{ __html: email.html }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {modal.type === "reject" && (
            <div>
              <label style={{ color: MUTED, fontSize: 13, display: "block", marginBottom: 6 }}>{t.reasonLabel}</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                style={{
                  width: "100%", borderRadius: 8, border: `1px solid ${BORDER}`,
                  backgroundColor: dark ? "#0a121c" : "#f8fafc",
                  color: TEXT, padding: 10, fontSize: 13, resize: "vertical",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </ConfirmationModal>
      )}
    </>
  );
}
