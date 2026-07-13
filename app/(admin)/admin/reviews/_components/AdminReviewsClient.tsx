"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import type { AdminReview } from "@/features/admin/types";
import { CheckCircle, XCircle, Trash2, ExternalLink } from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

const TX = {
  ar: {
    title: "مراجعة التقييمات", brand: "الشركة", talent: "الموهبة", rating: "التقييم",
    comment: "التعليق", status: "الحالة", type: "النوع", date: "التاريخ", actions: "الإجراءات",
    proof: "إثبات", all: "الكل", pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض",
    approve: "اعتماد", reject: "رفض", delete: "حذف",
    confirmApprove: "اعتماد هذا التقييم وإظهاره للعموم؟",
    confirmReject:  "رفض هذا التقييم؟",
    confirmDelete:  "حذف هذا التقييم نهائياً؟",
    noReviews: "لا توجد تقييمات",
  },
  en: {
    title: "Reviews Moderation", brand: "Brand", talent: "Talent", rating: "Rating",
    comment: "Comment", status: "Status", type: "Type", date: "Date", actions: "Actions",
    proof: "Proof", all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected",
    approve: "Approve", reject: "Reject", delete: "Delete",
    confirmApprove: "Approve this review and make it public?",
    confirmReject:  "Reject this review?",
    confirmDelete:  "Permanently delete this review?",
    noReviews: "No reviews found",
  },
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  approved: { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  rejected: { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

const STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

type ModalType = { action: "approve" | "reject" | "delete"; id: string };

export default function AdminReviewsClient({ reviews: initial }: { reviews: AdminReview[] }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [filter,  setFilter]  = useState<typeof STATUS_FILTERS[number]>("all");
  const [modal,   setModal]   = useState<ModalType | null>(null);
  const [loading, setLoading] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const filtered = filter === "all" ? initial : initial.filter(r => r.status === filter);

  async function runModal() {
    if (!modal) return;
    setLoading(true);
    if (modal.action === "delete") {
      await fetch(`/api/admin/reviews/${modal.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/reviews/${modal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: modal.action }),
      });
    }
    setLoading(false);
    setModal(null);
    router.refresh();
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle:   React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  const confirmCfg = modal ? {
    approve: { color: "#00D26A", msg: t.confirmApprove, label: t.approve },
    reject:  { color: "#EF4444", msg: t.confirmReject,  label: t.reject  },
    delete:  { color: "#EF4444", msg: t.confirmDelete,  label: t.delete  },
  }[modal.action] : null;

  return (
    <AdminShell title={t.title}>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_FILTERS.map(s => {
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
          {filtered.length} {ar ? "نتيجة" : "results"}
        </span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0 ? <EmptyState message={t.noReviews} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.brand}</th>
                  <th style={thStyle}>{t.talent}</th>
                  <th style={thStyle}>{t.rating}</th>
                  <th style={thStyle}>{t.type}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.proof}</th>
                  <th style={thStyle}>{t.comment}</th>
                  <th style={thStyle}>{t.date}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const brand  = Array.isArray(r.brand)  ? r.brand[0]  : r.brand;
                  const talent = Array.isArray(r.talent) ? r.talent[0] : r.talent;
                  const col    = STATUS_COLOR[r.status] ?? STATUS_COLOR.pending;
                  return (
                    <tr key={r.id}>
                      <td style={cellStyle}>{brand?.full_name ?? "—"}</td>
                      <td style={cellStyle}>{talent?.full_name ?? "—"}</td>
                      <td style={{ ...cellStyle, color: "#F4B740", letterSpacing: 1, whiteSpace: "nowrap" }}>
                        {STARS(r.rating)}
                      </td>
                      <td style={{ ...cellStyle, color: MUTED }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, backgroundColor: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                          {r.review_type ?? "brand"}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: col.bg, color: col.text }}>
                          {t[r.status as keyof typeof t] as string ?? r.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {r.proof_link ? (
                          <a href={r.proof_link} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#60a5fa", display: "flex", alignItems: "center", gap: 4 }}>
                            <ExternalLink size={13} />
                          </a>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.comment ?? "—"}
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(r.created_at).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {r.status !== "approved" && (
                            <button onClick={() => setModal({ action: "approve", id: r.id })}
                              title={t.approve}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#00D26A", padding: 4, borderRadius: 6, display: "flex" }}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button onClick={() => setModal({ action: "reject", id: r.id })}
                              title={t.reject}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#F4B740", padding: 4, borderRadius: 6, display: "flex" }}>
                              <XCircle size={16} />
                            </button>
                          )}
                          <button onClick={() => setModal({ action: "delete", id: r.id })}
                            title={t.delete}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, borderRadius: 6, display: "flex" }}>
                            <Trash2 size={16} />
                          </button>
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
          onCancel={() => setModal(null)}
        />
      )}
    </AdminShell>
  );
}
