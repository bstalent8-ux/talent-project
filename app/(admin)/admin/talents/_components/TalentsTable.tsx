"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import SortableTh from "@/components/admin/SortableTh";
import type { AdminTalent, TalentStatus } from "@/features/admin/types";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import { profileApprovedNotificationContent } from "@/lib/notifications/content/profile-approved";
import { profileApprovedEmail } from "@/lib/email/templates/profile-approved";
import { ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Mail, PauseCircle, Trash2, RotateCcw, Pencil, ShieldCheck } from "lucide-react";
import { LeadWhatsAppButton } from "@/app/(admin)/admin/leads/_components/LeadContactActions";

const TX = {
  ar: {
    name: "الاسم", email: "البريد الإلكتروني", phone: "رقم الهاتف", category: "التصنيف", city: "المدينة",
    noPhone: "لا يوجد",
    completion: "اكتمال الملف",
    registered: "تاريخ التسجيل", status: "الحالة", actions: "الإجراءات",
    approve: "موافقة", reject: "رفض", suspend: "وقف", restore: "استعادة", delete: "حذف", view: "عرض",
    confirmApprove: "هل تريد الموافقة على هذه الموهبة؟",
    confirmReject:  "هل تريد رفض هذه الموهبة؟",
    confirmSuspend: "هل تريد وقف هذه الموهبة؟",
    confirmDelete:  "هل تريد حذف هذه الموهبة نهائياً؟",
    reasonLabel: "سبب الرفض (اختياري)",
    noTalents: "لا توجد مواهب",
    results: "نتيجة",
    sendNotificationLabel: "إرسال إشعار داخل الموقع",
    sendEmailLabel: "إرسال إيميل",
    preview: "معاينة المحتوى",
    hidePreview: "إخفاء المعاينة",
    notificationPreview: "الإشعار",
    emailPreview: "الإيميل",
    subject: "الموضوع",
  },
  en: {
    name: "Name", email: "Email", phone: "Phone", category: "Category", city: "City",
    noPhone: "None",
    completion: "Profile Completion",
    registered: "Registered", status: "Status", actions: "Actions",
    approve: "Approve", reject: "Reject", suspend: "Suspend", restore: "Restore", delete: "Delete", view: "View",
    confirmApprove: "Approve this talent?",
    confirmReject:  "Reject this talent?",
    confirmSuspend: "Suspend this talent?",
    confirmDelete:  "Permanently delete this talent profile?",
    reasonLabel: "Rejection reason (optional)",
    noTalents: "No talents found",
    results: "results",
    sendNotificationLabel: "Send in-app notification",
    sendEmailLabel: "Send email",
    preview: "Preview content",
    hidePreview: "Hide preview",
    notificationPreview: "Notification",
    emailPreview: "Email",
    subject: "Subject",
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
  category?: string;
  city?:     string;
  sort?:     string;
  dir?:      "asc" | "desc";
}

function hrefFor(page: number, status: string, pageSize: number, category?: string, city?: string, sort?: string, dir?: "asc" | "desc") {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status !== "all") params.set("status", status);
  if (pageSize !== 10) params.set("pageSize", String(pageSize));
  if (category) params.set("category", category);
  if (city) params.set("city", city);
  if (sort) { params.set("sort", sort); params.set("dir", dir ?? "asc"); }
  const qs = params.toString();
  return qs ? `/admin/talents?${qs}` : "/admin/talents";
}

const SORT_COL = { name: "full_name", city: "city", registered: "created_at" } as const;

export default function TalentsTable({ talents, total, page, pageSize, status, category, city, sort, dir }: Props) {
  const { dark, lang } = useSite();
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.talents?.canDelete;
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  function goSort(col: string, nextDir: "asc" | "desc") {
    router.push(hrefFor(1, status, pageSize, category, city, col, nextDir));
    router.refresh();
  }

  const [modal,  setModal]    = useState<ModalState | null>(null);
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  // approve/restore only — default true on both matches the request:
  // "الdefault يكونو معمولين اه" (send both by default).
  const [sendNotification, setSendNotification] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isApproveLike = (type: ModalState["type"]) => type === "approve" || type === "restore";

  async function runAction(modal: ModalState) {
    setLoading(true);
    try {
      if (modal.type === "delete") {
        await fetch(`/api/admin/talents/${modal.talent.talentProfileId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/talents/${modal.talent.talentProfileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isApproveLike(modal.type)
              ? { action: modal.type, sendNotification, sendEmail }
              : { action: modal.type, reason }
          ),
        });
      }
      router.refresh();
    } finally {
      setLoading(false);
      closeModal();
    }
  }

  function closeModal() {
    setModal(null);
    setReason("");
    setSendNotification(true);
    setSendEmail(true);
    setShowPreview(false);
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

  // For an icon that sits INSIDE a <Link> (Edit/Eye) — never a <button>
  // there. A button nested inside an anchor is invalid HTML (interactive
  // content inside interactive content); browsers disagree on how its click
  // bubbles, which is exactly why stopPropagation on it was unreliable. The
  // anchor itself is the only clickable element; this is just its icon.
  const actionIcon = (icon: React.ReactNode, title_: string, color = MUTED) => (
    <span
      title={title_}
      style={{ padding: 4, borderRadius: 6, display: "flex", alignItems: "center", color }}
    >
      {icon}
    </span>
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

  // Category/city/completion/registered/status headers were start-aligned
  // (same as the name column) while their cell content is short and
  // visually centered under the browser's own default table-cell layout —
  // reads as the header floating off to one side instead of sitting over
  // its column. Centered for both header and cell so they land on the same
  // spot. Name/username (long, left-reading text) and actions (an icon row)
  // keep start alignment.
  const thCenterStyle: React.CSSProperties = { ...thStyle, textAlign: "center" };
  const cellCenterStyle: React.CSSProperties = { ...cellStyle, textAlign: "center" };

  // Keeps the first 3 and last 2 digits, masks the rest — enough to
  // recognize a number at a glance without exposing the full digits on a
  // shared screen by default.
  function completionBarColor(score: number): string {
    if (score >= 80) return "#00D26A";
    if (score >= 50) return "#00C9B1";
    if (score >= 25) return "#FFB800";
    return "#FF6B2B";
  }

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
          <div style={{ overflowX: "auto", zoom: 0.85 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <SortableTh label={t.name} col={SORT_COL.name} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <th style={thStyle}>{t.email}</th>
                  <th style={thStyle}>{t.phone}</th>
                  <th style={thCenterStyle}>{t.category}</th>
                  <SortableTh label={t.city} col={SORT_COL.city} activeCol={sort} activeDir={dir} onSort={goSort} align="center" />
                  <th style={thCenterStyle}>{t.completion}</th>
                  <SortableTh label={t.registered} col={SORT_COL.registered} activeCol={sort} activeDir={dir} onSort={goSort} align="center" />
                  <th style={thCenterStyle}>{t.status}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {talents.map(talent => (
                  <tr
                    key={talent.talentProfileId}
                    onClick={() => router.push(`/admin/talents/${talent.talentProfileId}`)}
                    style={{ cursor: "pointer" }}
                  >
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
                      {talent.email ?? "—"}
                    </td>
                    <td style={{ ...cellStyle, color: MUTED }} onClick={(e) => e.stopPropagation()}>
                      {talent.phoneNumber ? (
                        // direction + a fixed-width number column pin the
                        // WhatsApp icon at the same x-position on every row —
                        // without them it drifted left/right depending on
                        // how many digits happened to render.
                        <div style={{ display: "flex", alignItems: "center", gap: 6, direction: "ltr" }}>
                          <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 108, display: "inline-block" }}>{talent.phoneNumber}</span>
                          <LeadWhatsAppButton phone={talent.phoneNumber} />
                        </div>
                      ) : t.noPhone}
                    </td>
                    <td style={cellCenterStyle}>{talent.category ?? "—"}</td>
                    <td style={cellCenterStyle}>{talent.city ?? "—"}</td>
                    <td style={cellCenterStyle}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 70 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>
                          {talent.completionScore}%
                        </span>
                        <div style={{ width: 70, height: 6, borderRadius: 4, backgroundColor: BORDER, overflow: "hidden" }}>
                          <div style={{
                            width: `${talent.completionScore}%`, height: "100%", borderRadius: 4,
                            backgroundColor: completionBarColor(talent.completionScore),
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ ...cellCenterStyle, color: MUTED }}>
                      {new Date(talent.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                    </td>
                    <td style={cellCenterStyle}>
                      <StatusBadge status={talent.status} lang={lang} />
                    </td>
                    <td style={cellStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Link
                          href={`/admin/talents/${talent.talentProfileId}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: MUTED, display: "flex" }}
                        >
                          {actionIcon(<Pencil size={16} />, ar ? "تعديل" : "Edit", "#60A5FA")}
                        </Link>
                        {talent.handle && (
                          <Link
                            href={canonicalTalentPath(talent.category, talent.handle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: MUTED, display: "flex" }}
                          >
                            {actionIcon(<Eye size={16} />, t.view)}
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
                        {canDelete && actionBtn(() => setModal({ type: "delete", talent }), <Trash2 size={16} />, t.delete, "#EF4444")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => hrefFor(p, status, pageSize, category, city, sort, dir)}
        total={total}
        pageSize={pageSize}
        buildPageSizeHref={(size) => hrefFor(1, status, size, category, city, sort, dir)}
      />

      {modal && confirmConfig && (
        <ConfirmationModal
          open
          title={confirmConfig.msg}
          confirmColor={confirmConfig.color}
          confirmLabel={loading ? (ar ? "جاري..." : "Loading...") : t[modal.type]}
          onConfirm={() => runAction(modal)}
          onCancel={closeModal}
        >
          {isApproveLike(modal.type) && (() => {
            const name = modal.talent.fullName ?? "";
            const notif = profileApprovedNotificationContent(lang);
            const email = profileApprovedEmail(lang, name);
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
