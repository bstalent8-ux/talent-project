"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminVerification } from "@/features/admin/services/admin.service";
import { CheckCircle, XCircle, ExternalLink, ShieldCheck, User } from "lucide-react";

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
      body: JSON.stringify({ action: modal.type, reason }),
    });
    setLoading(false);
    setModal(null);
    setReason("");
    router.refresh();
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
          onCancel={() => { setModal(null); setReason(""); }}
        >
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
