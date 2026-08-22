"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTalent, TalentStatus } from "@/features/admin/types";
import { Eye, CheckCircle, XCircle, PauseCircle, Trash2, RotateCcw, Pencil, ShieldCheck } from "lucide-react";

const TX = {
  ar: {
    name: "الاسم", username: "اسم المستخدم", category: "التصنيف", city: "المدينة",
    registered: "تاريخ التسجيل", status: "الحالة", actions: "الإجراءات",
    approve: "موافقة", reject: "رفض", suspend: "وقف", restore: "استعادة", delete: "حذف", view: "عرض",
    confirmApprove: "هل تريد الموافقة على هذه الموهبة؟",
    confirmReject:  "هل تريد رفض هذه الموهبة؟",
    confirmSuspend: "هل تريد وقف هذه الموهبة؟",
    confirmDelete:  "هل تريد حذف هذه الموهبة نهائياً؟",
    reasonLabel: "سبب الرفض (اختياري)",
    noTalents: "لا توجد مواهب",
    results: "نتيجة",
  },
  en: {
    name: "Name", username: "Username", category: "Category", city: "City",
    registered: "Registered", status: "Status", actions: "Actions",
    approve: "Approve", reject: "Reject", suspend: "Suspend", restore: "Restore", delete: "Delete", view: "View",
    confirmApprove: "Approve this talent?",
    confirmReject:  "Reject this talent?",
    confirmSuspend: "Suspend this talent?",
    confirmDelete:  "Permanently delete this talent profile?",
    reasonLabel: "Rejection reason (optional)",
    noTalents: "No talents found",
    results: "results",
  },
};

interface ModalState {
  type: "approve" | "reject" | "suspend" | "restore" | "delete";
  talent: AdminTalent;
}

interface Props {
  talents:  AdminTalent[];
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
  return qs ? `/admin/talents?${qs}` : "/admin/talents";
}

export default function TalentsTable({ talents, total, page, pageSize, status }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [modal,  setModal]    = useState<ModalState | null>(null);
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function runAction(modal: ModalState) {
    setLoading(true);
    try {
      if (modal.type === "delete") {
        await fetch(`/api/admin/talents/${modal.talent.talentProfileId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/talents/${modal.talent.talentProfileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: modal.type, reason }),
        });
      }
      router.refresh();
    } finally {
      setLoading(false);
      setModal(null);
      setReason("");
    }
  }

  const actionBtn = (
    onClick: () => void,
    icon: React.ReactNode,
    title_: string,
    color = MUTED,
  ) => (
    <button
      onClick={onClick}
      title={title_}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color, padding: 4, borderRadius: 6, display: "flex", alignItems: "center",
      }}
    >
      {icon}
    </button>
  );

  const cellStyle: React.CSSProperties = {
    padding: "12px 14px", color: TEXT, fontSize: 13, whiteSpace: "nowrap",
    borderBottom: `1px solid ${BORDER}`,
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600,
    textAlign: ar ? "right" : "left", whiteSpace: "nowrap",
    backgroundColor: TH, borderBottom: `1px solid ${BORDER}`,
  };

  const confirmConfig = modal ? {
    approve: { color: "#00D26A", msg: t.confirmApprove },
    reject:  { color: "#EF4444", msg: t.confirmReject  },
    suspend: { color: "#F4B740", msg: t.confirmSuspend },
    restore: { color: "#00D26A", msg: t.confirmApprove },
    delete:  { color: "#EF4444", msg: t.confirmDelete  },
  }[modal.type] : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 13 }}>{total} {t.results}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {talents.length === 0 ? (
          <EmptyState message={t.noTalents} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.name}</th>
                  <th style={thStyle}>{t.username}</th>
                  <th style={thStyle}>{t.category}</th>
                  <th style={thStyle}>{t.city}</th>
                  <th style={thStyle}>{t.registered}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {talents.map(talent => (
                  <tr key={talent.talentProfileId}>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
                          flexShrink: 0, backgroundColor: BORDER,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {talent.avatarUrl ? (
                            <Image src={talent.avatarUrl} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                          ) : (
                            <span style={{ color: MUTED, fontSize: 13 }}>
                              {(talent.fullName ?? "?")[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span style={{ fontWeight: 600 }}>{talent.fullName ?? "—"}</span>
                        {talent.isVerified && (
                          <ShieldCheck size={13} color="#00D26A" aria-label={ar ? "موثق" : "Verified"} />
                        )}
                      </div>
                    </td>
                    <td style={{ ...cellStyle, color: MUTED }}>
                      {talent.handle ? `@${talent.handle}` : "—"}
                    </td>
                    <td style={cellStyle}>{talent.category ?? "—"}</td>
                    <td style={cellStyle}>{talent.city ?? "—"}</td>
                    <td style={{ ...cellStyle, color: MUTED }}>
                      {new Date(talent.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                    </td>
                    <td style={cellStyle}>
                      <StatusBadge status={talent.status} lang={lang} />
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Link href={`/admin/talents/${talent.talentProfileId}`} style={{ color: MUTED, display: "flex" }}>
                          {actionBtn(() => {}, <Pencil size={16} />, ar ? "تعديل" : "Edit", "#60A5FA")}
                        </Link>
                        {talent.handle && (
                          <Link href={`/talent/${talent.handle}`} target="_blank" style={{ color: MUTED, display: "flex" }}>
                            {actionBtn(() => {}, <Eye size={16} />, t.view)}
                          </Link>
                        )}
                        {talent.status !== "approved" && (
                          actionBtn(() => setModal({ type: "approve", talent }), <CheckCircle size={16} />, t.approve, "#00D26A")
                        )}
                        {talent.status === "approved" && (
                          actionBtn(() => setModal({ type: "suspend", talent }), <PauseCircle size={16} />, t.suspend, "#F4B740")
                        )}
                        {talent.status === "suspended" && (
                          actionBtn(() => setModal({ type: "restore", talent }), <RotateCcw size={16} />, t.restore, "#60A5FA")
                        )}
                        {talent.status !== "rejected" && (
                          actionBtn(() => setModal({ type: "reject", talent }), <XCircle size={16} />, t.reject, "#EF4444")
                        )}
                        {actionBtn(() => setModal({ type: "delete", talent }), <Trash2 size={16} />, t.delete, "#EF4444")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, status)} />

      {modal && confirmConfig && (
        <ConfirmationModal
          open
          title={confirmConfig.msg}
          confirmColor={confirmConfig.color}
          confirmLabel={loading ? (ar ? "جاري..." : "Loading...") : t[modal.type]}
          onConfirm={() => runAction(modal)}
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
                  color: TEXT, padding: 10, fontSize: 13, resize: "vertical", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </ConfirmationModal>
      )}
    </>
  );
}
