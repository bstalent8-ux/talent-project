"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import type { AdminTestimonial } from "@/features/admin/services/admin.service";
import { CheckCircle, XCircle, Quote } from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  approved: { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  rejected: { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

const TX = {
  ar: {
    title: "آراء الصفحة الرئيسية", author: "الكاتب", quote: "الرأي", status: "الحالة",
    submitted: "تاريخ الإرسال", actions: "الإجراءات",
    all: "الكل", pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض",
    approve: "موافقة", reject: "رفض",
    confirmApprove: "الموافقة على هذا الرأي وإظهاره في الصفحة الرئيسية؟",
    confirmReject: "رفض هذا الرأي؟",
    reasonLabel: "سبب الرفض (اختياري)",
    noRequests: "لا توجد آراء بعد",
  },
  en: {
    title: "Home Page Testimonials", author: "Author", quote: "Quote", status: "Status",
    submitted: "Submitted", actions: "Actions",
    all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected",
    approve: "Approve", reject: "Reject",
    confirmApprove: "Approve this testimonial and show it on the home page?",
    confirmReject: "Reject this testimonial?",
    reasonLabel: "Rejection reason (optional)",
    noRequests: "No testimonials yet",
  },
};

type ModalState = { type: "approve" | "reject"; id: string };

export default function AdminTestimonialsClient({ testimonials }: { testimonials: AdminTestimonial[] }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [filter,  setFilter]  = useState<typeof STATUS_FILTERS[number]>("pending");
  const [modal,   setModal]   = useState<ModalState | null>(null);
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const filtered = filter === "all" ? testimonials : testimonials.filter((v) => v.status === filter);

  async function runModal() {
    if (!modal) return;
    setLoading(true);
    await fetch(`/api/admin/landing/testimonials/${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: modal.type, reason }),
    });
    setLoading(false);
    setModal(null);
    setReason("");
    router.refresh();
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle:   React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  const confirmCfg = modal ? {
    approve: { color: "#00D26A", msg: t.confirmApprove, label: t.approve },
    reject:  { color: "#EF4444", msg: t.confirmReject,  label: t.reject  },
  }[modal.type] : null;

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_FILTERS.map((s) => {
          const active = filter === s;
          const col = s === "all" ? "#60a5fa" : (STATUS_COLOR[s]?.text ?? MUTED);
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "6px 14px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${active ? col : BORDER}`,
              backgroundColor: active ? `${col}22` : "transparent",
              color: active ? col : MUTED, fontSize: 12, fontWeight: active ? 700 : 400,
            }}>
              {t[s as keyof typeof t] as string}
            </button>
          );
        })}
        <span style={{ color: MUTED, fontSize: 12, alignSelf: "center", marginLeft: "auto" }}>
          {filtered.length} {ar ? "رأي" : "items"}
        </span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0 ? <EmptyState message={t.noRequests} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.author}</th>
                  <th style={thStyle}>{t.quote}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.submitted}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const col = STATUS_COLOR[v.status] ?? STATUS_COLOR.pending;
                  return (
                    <tr key={v.id}>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: BORDER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Quote size={13} color={MUTED} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{v.authorName}</div>
                            <div style={{ color: MUTED, fontSize: 11 }}>
                              {[v.authorRole, v.company].filter(Boolean).join(" · ") || (v.submitterHandle ? `@${v.submitterHandle}` : "—")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 360, whiteSpace: "normal" }}>{v.quote}</td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: col.bg, color: col.text }}>
                          {t[v.status as keyof typeof t] as string ?? v.status}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(v.submittedAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {v.status !== "approved" && (
                            <button onClick={() => setModal({ type: "approve", id: v.id })} title={t.approve}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#00D26A", padding: 4, borderRadius: 6, display: "flex" }}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {v.status !== "rejected" && (
                            <button onClick={() => setModal({ type: "reject", id: v.id })} title={t.reject}
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
                onChange={(e) => setReason(e.target.value)}
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
    </AdminShell>
  );
}
