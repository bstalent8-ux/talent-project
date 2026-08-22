"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminBrand } from "@/features/admin/services/admin.service";
import { CheckCircle, XCircle, RotateCcw, ShieldBan, ShieldCheck, ExternalLink } from "lucide-react";

const BRAND_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:  { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  approved: { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  rejected: { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

const TX = {
  ar: {
    name: "الاسم", username: "اسم المستخدم", city: "المدينة",
    registered: "التسجيل", brandStatus: "حالة الاعتماد", accountStatus: "حالة الحساب",
    taxDoc: "المستند الضريبي", actions: "الإجراءات",
    pending: "قيد الانتظار", approved: "معتمد", rejected: "مرفوض",
    active: "نشط", blocked: "محظور", suspended: "معلق",
    approve: "اعتماد", reject: "رفض", reset: "إعادة للانتظار",
    block: "حظر الحساب", unblock: "رفع الحظر",
    confirmApprove: "اعتماد هذه الشركة والسماح لها بالنشر؟",
    confirmReject:  "رفض هذه الشركة؟",
    confirmReset:   "إعادة الشركة لحالة الانتظار؟",
    confirmBlock:   "حظر هذا الحساب؟",
    confirmUnblock: "رفع الحظر عن هذا الحساب؟",
    reasonLabel: "سبب الرفض (اختياري)",
    blockReasonLabel: "سبب الحظر (اختياري)",
    noData: "لا توجد شركات",
    view: "عرض",
    results: "نتيجة",
  },
  en: {
    name: "Name", username: "Username", city: "City",
    registered: "Registered", brandStatus: "Approval Status", accountStatus: "Account",
    taxDoc: "Tax Document", actions: "Actions",
    pending: "Pending", approved: "Approved", rejected: "Rejected",
    active: "Active", blocked: "Blocked", suspended: "Suspended",
    approve: "Approve", reject: "Reject", reset: "Reset to Pending",
    block: "Block Account", unblock: "Unblock",
    confirmApprove: "Approve this brand and allow them to post?",
    confirmReject:  "Reject this brand?",
    confirmReset:   "Reset brand back to pending review?",
    confirmBlock:   "Block this account?",
    confirmUnblock: "Unblock this account?",
    reasonLabel: "Rejection reason (optional)",
    blockReasonLabel: "Block reason (optional)",
    noData: "No brands found",
    view: "View",
    results: "results",
  },
};

type ModalType = "approve" | "reject" | "reset" | "block" | "unblock";
type ModalState = { type: ModalType; brand: AdminBrand };

interface Props {
  brands:   AdminBrand[];
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
  return qs ? `/admin/brands?${qs}` : "/admin/brands";
}

export default function BrandsTable({ brands, total, page, pageSize, status }: Props) {
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
    if (modal.type === "block" || modal.type === "unblock") {
      await fetch(`/api/admin/users/${modal.brand.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: modal.type === "block" ? "block" : "unblock", reason }),
      });
    } else {
      await fetch(`/api/admin/brands/${modal.brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: modal.type, reason }),
      });
    }
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
    reset:   { color: "#F4B740", msg: t.confirmReset,   label: t.reset   },
    block:   { color: "#EF4444", msg: t.confirmBlock,   label: t.block   },
    unblock: { color: "#00D26A", msg: t.confirmUnblock, label: t.unblock },
  }[modal.type] : null;

  const showReason = modal?.type === "reject" || modal?.type === "block";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.results}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {brands.length === 0 ? <EmptyState message={t.noData} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.name}</th>
                  <th style={thStyle}>{t.username}</th>
                  <th style={thStyle}>{t.city}</th>
                  <th style={thStyle}>{t.brandStatus}</th>
                  <th style={thStyle}>{t.accountStatus}</th>
                  <th style={thStyle}>{t.taxDoc}</th>
                  <th style={thStyle}>{t.registered}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(b => {
                  const bCol      = BRAND_STATUS_COLOR[b.brandStatus] ?? BRAND_STATUS_COLOR.pending;
                  const isBlocked = b.accountStatus !== "active";
                  return (
                    <tr key={b.id}>
                      <td style={{ ...cellStyle, fontWeight: 600 }}>{b.fullName ?? "—"}</td>
                      <td style={{ ...cellStyle, color: MUTED }}>{b.handle ? `@${b.handle}` : "—"}</td>
                      <td style={cellStyle}>{b.city ?? "—"}</td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: bCol.bg, color: bCol.text }}>
                          {t[b.brandStatus as keyof typeof t] as string ?? b.brandStatus}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          backgroundColor: isBlocked ? "rgba(239,68,68,0.15)" : "rgba(0,210,106,0.12)",
                          color: isBlocked ? "#EF4444" : "#00D26A",
                        }}>
                          {isBlocked ? (b.accountStatus === "blocked" ? t.blocked : t.suspended) : t.active}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {b.taxDocumentUrl ? (
                          <a href={b.taxDocumentUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#60a5fa", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <ExternalLink size={13} /> {t.view}
                          </a>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, color: MUTED }}>
                        {new Date(b.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {b.brandStatus !== "approved" && (
                            <button onClick={() => setModal({ type: "approve", brand: b })} title={t.approve}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#00D26A", padding: 4, borderRadius: 6, display: "flex" }}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {b.brandStatus !== "rejected" && (
                            <button onClick={() => setModal({ type: "reject", brand: b })} title={t.reject}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, borderRadius: 6, display: "flex" }}>
                              <XCircle size={16} />
                            </button>
                          )}
                          {b.brandStatus !== "pending" && (
                            <button onClick={() => setModal({ type: "reset", brand: b })} title={t.reset}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#F4B740", padding: 4, borderRadius: 6, display: "flex" }}>
                              <RotateCcw size={15} />
                            </button>
                          )}
                          {isBlocked ? (
                            <button onClick={() => setModal({ type: "unblock", brand: b })} title={t.unblock}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#00D26A", padding: 4, borderRadius: 6, display: "flex" }}>
                              <ShieldCheck size={16} />
                            </button>
                          ) : (
                            <button onClick={() => setModal({ type: "block", brand: b })} title={t.block}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, borderRadius: 6, display: "flex" }}>
                              <ShieldBan size={16} />
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
          {showReason && (
            <div>
              <label style={{ color: MUTED, fontSize: 13, display: "block", marginBottom: 6 }}>
                {modal.type === "block" ? t.blockReasonLabel : t.reasonLabel}
              </label>
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
