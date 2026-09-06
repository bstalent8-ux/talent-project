"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Mail, Phone, AtSign, AlertTriangle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import type { Lead, LeadStatus } from "@/features/leads/types";

const TX = {
  ar: {
    name: "الاسم", contact: "بيانات التواصل", status: "الحالة", assigned: "المسؤول", created: "تاريخ الإضافة",
    unnamed: "بدون اسم", noContact: "—", possibleDuplicate: "محتمل يكون مكرر",
    new: "جديد", contacted: "تم التواصل", interested: "مهتم", not_interested: "مش مهتم", converted: "اتحول لعميل",
    results: (n: number) => `${n} ليد`,
    none: "لسه مفيش ليدز متضافة",
    view: "شوف البروفايل", edit: "تعديل سريع", delete: "مسح",
    deleteTitle: "مسح الليد؟", deleteDesc: (name: string) => `هيتمسح "${name}" وكل سجل المتابعة بتاعه — الخطوة دي مش هترجع.`,
    cancel: "إلغاء", save: "حفظ",
    editTitle: "تعديل سريع", namePh: "الاسم", phonePh: "رقم التليفون", emailPh: "الإيميل", handlePh: "اكونت السوشيال ميديا",
  },
  en: {
    name: "Name", contact: "Contact", status: "Status", assigned: "Assigned to", created: "Added",
    unnamed: "Unnamed", noContact: "—", possibleDuplicate: "Possible duplicate",
    new: "New", contacted: "Contacted", interested: "Interested", not_interested: "Not interested", converted: "Converted",
    results: (n: number) => `${n} leads`,
    none: "No leads added yet",
    view: "View profile", edit: "Quick edit", delete: "Delete",
    deleteTitle: "Delete this lead?", deleteDesc: (name: string) => `"${name}" and its whole follow-up history will be deleted — this can't be undone.`,
    cancel: "Cancel", save: "Save",
    editTitle: "Quick edit", namePh: "Name", phonePh: "Phone", emailPh: "Email", handlePh: "Social handle",
  },
};

const STATUS_COLOR: Record<LeadStatus, { bg: string; text: string }> = {
  new:            { bg: "rgba(14,165,233,0.15)",  text: "#0EA5E9" },
  contacted:      { bg: "rgba(244,183,64,0.15)",   text: "#F4B740" },
  interested:     { bg: "rgba(0,210,106,0.15)",    text: "#00D26A" },
  not_interested: { bg: "rgba(148,163,184,0.15)",  text: "#94A3B8" },
  converted:      { bg: "rgba(139,92,246,0.15)",   text: "#8B5CF6" },
};

interface Props {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  status: string;
}

function hrefFor(page: number, status: string, pageSize: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (status !== "all") params.set("status", status);
  if (pageSize !== 10) params.set("pageSize", String(pageSize));
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export default function LeadsTable({ leads, total, page, pageSize, status }: Props) {
  const { dark, lang } = useSite();
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.leads?.canDelete;
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };

  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [editDraft, setEditDraft] = useState({ fullName: "", phone: "", email: "", socialHandle: "" });
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%",
  };

  function openEdit(lead: Lead) {
    setEditDraft({
      fullName: lead.fullName ?? "", phone: lead.phone ?? "", email: lead.email ?? "", socialHandle: lead.socialHandle ?? "",
    });
    setEditTarget(lead);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/leads/${deleteTarget.id}`, { method: "DELETE" }).catch(() => {});
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  }

  async function confirmEdit() {
    if (!editTarget) return;
    setSaving(true);
    await fetch(`/api/admin/leads/${editTarget.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: editDraft.fullName || null,
        phone: editDraft.phone || null,
        email: editDraft.email || null,
        socialHandle: editDraft.socialHandle || null,
      }),
    }).catch(() => {});
    setSaving(false);
    setEditTarget(null);
    router.refresh();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, color: MUTED, fontSize: 12.5 }}>
        {t.results(total)}
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {leads.length === 0 ? (
          <EmptyState message={t.none} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.name}</th>
                  <th style={thStyle}>{t.contact}</th>
                  <th style={thStyle}>{t.status}</th>
                  <th style={thStyle}>{t.assigned}</th>
                  <th style={thStyle}>{t.created}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const col = STATUS_COLOR[lead.status];
                  return (
                    <tr key={lead.id}>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600 }}>{lead.fullName ?? t.unnamed}</span>
                          {lead.possibleDuplicateOf && (
                            <span title={t.possibleDuplicate} style={{ display: "flex" }}>
                              <AlertTriangle size={13} color="#F59E0B" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {lead.phone && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                              <Phone size={11} />{lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                              <Mail size={11} />{lead.email}
                            </span>
                          )}
                          {lead.socialHandle && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                              <AtSign size={11} />{lead.socialHandle}
                            </span>
                          )}
                          {!lead.phone && !lead.email && !lead.socialHandle && (
                            <span style={{ color: MUTED }}>{t.noContact}</span>
                          )}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: col.bg, color: col.text }}>
                          {t[lead.status]}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED }}>{lead.assignedToName ?? "—"}</td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(lead.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                      </td>
                      <td style={{ ...cellStyle, width: 1, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Link href={`/admin/leads/${lead.id}`} title={t.view} style={{ display: "flex", color: "var(--color-primary)" }}>
                            <Eye size={16} />
                          </Link>
                          <button
                            type="button"
                            title={t.edit}
                            onClick={() => openEdit(lead)}
                            style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer", color: "#60A5FA" }}
                          >
                            <Pencil size={16} />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              title={t.delete}
                              onClick={() => setDeleteTarget(lead)}
                              style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer", color: "#EF4444" }}
                            >
                              <Trash2 size={16} />
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

      <AdminPagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => hrefFor(p, status, pageSize)}
        total={total}
        pageSize={pageSize}
        buildPageSizeHref={(size) => hrefFor(1, status, size)}
      />

      <ConfirmationModal
        open={!!deleteTarget}
        title={t.deleteTitle}
        description={deleteTarget ? t.deleteDesc(deleteTarget.fullName ?? t.unnamed) : undefined}
        confirmLabel={deleting ? undefined : t.delete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmationModal
        open={!!editTarget}
        title={t.editTitle}
        confirmLabel={saving ? undefined : t.save}
        cancelLabel={t.cancel}
        onConfirm={confirmEdit}
        onCancel={() => setEditTarget(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input style={inputStyle} placeholder={t.namePh} value={editDraft.fullName}
            onChange={(e) => setEditDraft((d) => ({ ...d, fullName: e.target.value }))} />
          <input style={inputStyle} placeholder={t.phonePh} value={editDraft.phone}
            onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))} />
          <input style={inputStyle} placeholder={t.emailPh} value={editDraft.email}
            onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))} />
          <input style={inputStyle} placeholder={t.handlePh} value={editDraft.socialHandle}
            onChange={(e) => setEditDraft((d) => ({ ...d, socialHandle: e.target.value }))} />
        </div>
      </ConfirmationModal>
    </>
  );
}
