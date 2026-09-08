"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Mail, Phone, AtSign, AlertTriangle, Users, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { LeadCallButton, LeadWhatsAppButton } from "./LeadContactActions";
import LeadAssigneePicker from "./LeadAssigneePicker";
import type { Lead } from "@/features/leads/types";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: {
    name: "الاسم", contact: "بيانات التواصل", stageCol: "المرحلة", channelCol: "المصدر", categoryCol: "الكاتيجوري", assigned: "المسؤول", created: "تاريخ الإضافة",
    unnamed: "بدون اسم", noContact: "—", possibleDuplicate: "محتمل يكون مكرر", noStage: "—", noTag: "—",
    results: (n: number) => `${n} ليد`,
    none: "لسه مفيش ليدز متضافة",
    view: "شوف البروفايل", edit: "تعديل سريع", delete: "مسح",
    deleteTitle: "مسح الليد؟", deleteDesc: (name: string) => `هيتمسح "${name}" وكل سجل المتابعة بتاعه — الخطوة دي مش هترجع.`,
    cancel: "إلغاء", save: "حفظ",
    editTitle: "تعديل سريع", namePh: "الاسم", phonePh: "رقم التليفون", emailPh: "الإيميل", handlePh: "اكونت السوشيال ميديا",
    selectedCount: (n: number) => `${n} متحدد`, assignSelected: "عيّن لـ", assigning: "بيتعين...", clearSelection: "إلغاء التحديد",
  },
  en: {
    name: "Name", contact: "Contact", stageCol: "Stage", channelCol: "Source", categoryCol: "Category", assigned: "Assigned to", created: "Added",
    unnamed: "Unnamed", noContact: "—", possibleDuplicate: "Possible duplicate", noStage: "—", noTag: "—",
    results: (n: number) => `${n} leads`,
    none: "No leads added yet",
    view: "View profile", edit: "Quick edit", delete: "Delete",
    deleteTitle: "Delete this lead?", deleteDesc: (name: string) => `"${name}" and its whole follow-up history will be deleted — this can't be undone.`,
    cancel: "Cancel", save: "Save",
    editTitle: "Quick edit", namePh: "Name", phonePh: "Phone", emailPh: "Email", handlePh: "Social handle",
    selectedCount: (n: number) => `${n} selected`, assignSelected: "Assign to", assigning: "Assigning...", clearSelection: "Clear selection",
  },
};

interface Props {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  stage: string;
  channel?: string;
  category?: string;
  assignedTo?: string;
  actionDate?: string;
  actionPersonId?: string;
}

function hrefFor(page: number, stage: string, pageSize: number, channel?: string, category?: string, assignedTo?: string, actionDate?: string, actionPersonId?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (stage !== "all") params.set("stage", stage);
  if (pageSize !== 10) params.set("pageSize", String(pageSize));
  if (channel) params.set("channel", channel);
  if (category) params.set("category", category);
  if (assignedTo) params.set("assignedTo", assignedTo);
  if (actionDate) params.set("actionDate", actionDate);
  if (actionPersonId) params.set("actionPersonId", actionPersonId);
  params.set("view", "table");
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export default function LeadsTable({ leads, total, page, pageSize, stage, channel, category, assignedTo, actionDate, actionPersonId }: Props) {
  const { dark, lang } = useSite();
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.leads?.canDelete;
  const canAssign = permissions === null || !!permissions.leads?.canUpdate;
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
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [editDraft, setEditDraft] = useState({ fullName: "", phone: "", email: "", socialHandle: "" });
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const allOnPageSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelectedIds((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        for (const l of leads) next.delete(l.id);
        return next;
      }
      const next = new Set(prev);
      for (const l of leads) next.add(l.id);
      return next;
    });
  }

  async function submitBulkAssign(admin: AdminSearchResult | null) {
    setBulkAssigning(true);
    await fetch("/api/admin/leads/bulk-assign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: Array.from(selectedIds), assignedTo: admin?.id ?? null }),
    }).catch(() => {});
    setBulkAssigning(false);
    setShowBulkAssign(false);
    setSelectedIds(new Set());
    router.refresh();
  }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        {canAssign && selectedIds.size > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT }}>
              <Users size={13} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />
              {t.selectedCount(selectedIds.size)}
            </span>
            {showBulkAssign ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 220 }}>
                  <LeadAssigneePicker autoFocus onPick={submitBulkAssign} />
                </div>
                {bulkAssigning && <span style={{ fontSize: 12, color: MUTED }}>{t.assigning}</span>}
                <button type="button" onClick={() => setShowBulkAssign(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowBulkAssign(true)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                {t.assignSelected}
              </button>
            )}
            <button type="button" onClick={() => setSelectedIds(new Set())}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 12, textDecoration: "underline" }}>
              {t.clearSelection}
            </button>
          </div>
        ) : <div />}
        <span style={{ color: MUTED, fontSize: 12.5 }}>{t.results(total)}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {leads.length === 0 ? (
          <EmptyState message={t.none} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {canAssign && (
                    <th style={{ ...thStyle, width: 1 }}>
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} style={{ cursor: "pointer" }} />
                    </th>
                  )}
                  <th style={thStyle}>{t.name}</th>
                  <th style={thStyle}>{t.contact}</th>
                  <th style={thStyle}>{t.stageCol}</th>
                  <th style={thStyle}>{t.channelCol}</th>
                  <th style={thStyle}>{t.categoryCol}</th>
                  <th style={thStyle}>{t.assigned}</th>
                  <th style={thStyle}>{t.created}</th>
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", lead.id); setDraggingId(lead.id); }}
                    onDragEnd={() => setDraggingId(null)}
                    style={{ cursor: "grab", opacity: draggingId === lead.id ? 0.5 : 1 }}
                  >
                    {canAssign && (
                      <td style={cellStyle}>
                        <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleOne(lead.id)} style={{ cursor: "pointer" }} />
                      </td>
                    )}
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
                      {lead.stage ? (
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: `${lead.stage.color}22`, color: lead.stage.color }}>
                          {ar ? lead.stage.labelAr : lead.stage.labelEn}
                        </span>
                      ) : (
                        <span style={{ color: MUTED }}>{t.noStage}</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {lead.channel ? (
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, backgroundColor: BORDER, color: MUTED }}>
                          {ar ? lead.channel.labelAr : lead.channel.labelEn}
                        </span>
                      ) : (
                        <span style={{ color: MUTED }}>{t.noTag}</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {lead.category ? (
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, backgroundColor: BORDER, color: MUTED }}>
                          {ar ? lead.category.labelAr : lead.category.labelEn}
                        </span>
                      ) : (
                        <span style={{ color: MUTED }}>{t.noTag}</span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: MUTED }}>{lead.assignedToName ?? "—"}</td>
                    <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                      {new Date(lead.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                    </td>
                    <td style={{ ...cellStyle, width: 1, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {lead.phone && <LeadWhatsAppButton phone={lead.phone} size={16} />}
                        {lead.phone && <LeadCallButton phone={lead.phone} size={16} />}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => hrefFor(p, stage, pageSize, channel, category, assignedTo, actionDate, actionPersonId)}
        total={total}
        pageSize={pageSize}
        buildPageSizeHref={(size) => hrefFor(1, stage, size, channel, category, assignedTo, actionDate, actionPersonId)}
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
