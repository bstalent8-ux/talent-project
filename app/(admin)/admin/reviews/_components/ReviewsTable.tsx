"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminReview } from "@/features/admin/types";
import { CheckCircle, XCircle, Trash2, ExternalLink } from "lucide-react";

const TX = {
  ar: {
    brand: "الشركة", talent: "الموهبة", rating: "التقييم",
    comment: "التعليق", status: "الحالة", type: "النوع", date: "التاريخ", actions: "الإجراءات",
    proof: "إثبات", pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض",
    approve: "اعتماد", reject: "رفض", delete: "حذف",
    confirmApprove: "اعتماد هذا التقييم وإظهاره للعموم؟",
    confirmReject:  "رفض هذا التقييم؟",
    confirmDelete:  "حذف هذا التقييم نهائياً؟",
    noReviews: "لا توجد تقييمات",
    results: "نتيجة",
  },
  en: {
    brand: "Brand", talent: "Talent", rating: "Rating",
    comment: "Comment", status: "Status", type: "Type", date: "Date", actions: "Actions",
    proof: "Proof", pending: "Pending", approved: "Approved", rejected: "Rejected",
    approve: "Approve", reject: "Reject", delete: "Delete",
    confirmApprove: "Approve this review and make it public?",
    confirmReject:  "Reject this review?",
    confirmDelete:  "Permanently delete this review?",
    noReviews: "No reviews found",
    results: "results",
  },
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  approved: { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  rejected: { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

const STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

type ModalType = { action: "approve" | "reject" | "delete"; id: string };

interface Props {
  reviews:  AdminReview[];
  total:    number;
  page:     number;
  pageSize: number;
  status:   string;
}

function hrefFor(page: number, status: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status !== "all") params.set("status", status);
  const qs = params.toString();
  return qs ? `/admin/reviews?${qs}` : "/admin/reviews";
}

export default function ReviewsTable({ reviews, total, page, pageSize, status }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [modal,   setModal]   = useState<ModalType | null>(null);
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
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.results}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {reviews.length === 0 ? <EmptyState message={t.noReviews} /> : (
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
                {reviews.map(r => {
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

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, status)} />

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
    </>
  );
}
