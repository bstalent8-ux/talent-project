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
import BulkDeleteButton from "@/components/admin/BulkDeleteButton";
import SortableTh from "@/components/admin/SortableTh";
import { LeadCallButton, LeadWhatsAppButton } from "../../leads/_components/LeadContactActions";
import LeadAssigneePicker from "../../leads/_components/LeadAssigneePicker";
import type { Candidate } from "@/features/candidates/types";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: {
    name: "الاسم", contact: "بيانات التواصل", stageCol: "المرحلة", categoryCol: "الكاتيجوري", jobCol: "الوظيفة", salaryCol: "الراتب المتوقع",
    assigned: "المسؤول", created: "تاريخ الإضافة",
    unnamed: "بدون اسم", noContact: "—", possibleDuplicate: "محتمل يكون مكرر", noStage: "—", noTag: "—",
    results: (n: number) => `${n} مرشح`,
    none: "لسه مفيش مرشحين متضافين",
    view: "شوف البروفايل", edit: "تعديل سريع", delete: "مسح",
    deleteTitle: "مسح المرشح؟", deleteDesc: (name: string) => `هيتمسح "${name}" وكل سجل المتابعة بتاعه — الخطوة دي مش هترجع.`,
    cancel: "إلغاء", save: "حفظ",
    editTitle: "تعديل سريع", namePh: "الاسم", phonePh: "رقم التليفون", emailPh: "الإيميل", handlePh: "اكونت السوشيال ميديا",
    selectedCount: (n: number) => `${n} متحدد`, assignSelected: "عيّن لـ", assigning: "بيتعين...", clearSelection: "إلغاء التحديد",
  },
  en: {
    name: "Name", contact: "Contact", stageCol: "Stage", categoryCol: "Category", jobCol: "Job", salaryCol: "Expected salary",
    assigned: "Assigned to", created: "Added",
    unnamed: "Unnamed", noContact: "—", possibleDuplicate: "Possible duplicate", noStage: "—", noTag: "—",
    results: (n: number) => `${n} candidates`,
    none: "No candidates added yet",
    view: "View profile", edit: "Quick edit", delete: "Delete",
    deleteTitle: "Delete this candidate?", deleteDesc: (name: string) => `"${name}" and its whole follow-up history will be deleted — this can't be undone.`,
    cancel: "Cancel", save: "Save",
    editTitle: "Quick edit", namePh: "Name", phonePh: "Phone", emailPh: "Email", handlePh: "Social handle",
    selectedCount: (n: number) => `${n} selected`, assignSelected: "Assign to", assigning: "Assigning...", clearSelection: "Clear selection",
  },
};

interface Props {
  candidates: Candidate[];
  total: number;
  page: number;
  pageSize: number;
  stage: string;
  category?: string;
  assignedTo?: string;
  actionDate?: string;
  actionPersonId?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

function hrefFor(page: number, stage: string, pageSize: number, category?: string, assignedTo?: string, actionDate?: string, actionPersonId?: string, sort?: string, dir?: "asc" | "desc") {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (stage !== "all") params.set("stage", stage);
  if (pageSize !== 10) params.set("pageSize", String(pageSize));
  if (category) params.set("category", category);
  if (assignedTo) params.set("assignedTo", assignedTo);
  if (actionDate) params.set("actionDate", actionDate);
  if (actionPersonId) params.set("actionPersonId", actionPersonId);
  if (sort) { params.set("sort", sort); params.set("dir", dir ?? "asc"); }
  params.set("view", "table");
  const qs = params.toString();
  return qs ? `/admin/candidates?${qs}` : "/admin/candidates";
}

// header label -> the DB column fetchCandidatesPage sorts on
const SORT_COL = {
  name: "full_name", contact: "phone", stage: "stage_id", category: "category_id",
  job: "job_title", salary: "expected_salary", assigned: "assigned_to", created: "created_at",
} as const;

export default function CandidatesTable({ candidates, total, page, pageSize, stage, category, assignedTo, actionDate, actionPersonId, sort, dir }: Props) {
  const { dark, lang } = useSite();
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.candidates?.canDelete;
  const canAssign = permissions === null || !!permissions.candidates?.canUpdate;
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const TH = dark ? "#261C18" : "#F1E8D2";

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };

  // The server does the sorting (fetchCandidatesPage) — this just navigates,
  // always back to page 1. router.refresh() because Next 15's router cache
  // serves a stale RSC payload when only searchParams change (asc -> desc).
  function goSort(col: string, nextDir: "asc" | "desc") {
    router.push(hrefFor(1, stage, pageSize, category, assignedTo, actionDate, actionPersonId, col, nextDir));
    router.refresh();
  }

  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Candidate | null>(null);
  const [editDraft, setEditDraft] = useState({ fullName: "", phone: "", email: "", socialHandle: "" });
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const allOnPageSelected = candidates.length > 0 && candidates.every((c) => selectedIds.has(c.id));

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%",
  };

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
        for (const c of candidates) next.delete(c.id);
        return next;
      }
      const next = new Set(prev);
      for (const c of candidates) next.add(c.id);
      return next;
    });
  }

  async function submitBulkAssign(admin: AdminSearchResult | null) {
    setBulkAssigning(true);
    await fetch("/api/admin/candidates/bulk-assign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateIds: Array.from(selectedIds), assignedTo: admin?.id ?? null }),
    }).catch(() => {});
    setBulkAssigning(false);
    setShowBulkAssign(false);
    setSelectedIds(new Set());
    router.refresh();
  }

  function openEdit(candidate: Candidate) {
    setEditDraft({
      fullName: candidate.fullName ?? "", phone: candidate.phone ?? "", email: candidate.email ?? "", socialHandle: candidate.socialHandle ?? "",
    });
    setEditTarget(candidate);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/candidates/${deleteTarget.id}`, { method: "DELETE" }).catch(() => {});
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  }

  async function confirmEdit() {
    if (!editTarget) return;
    setSaving(true);
    await fetch(`/api/admin/candidates/${editTarget.id}`, {
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
        {(canAssign || canDelete) && selectedIds.size > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT }}>
              <Users size={13} style={{ verticalAlign: "middle", marginInlineEnd: 4 }} />
              {t.selectedCount(selectedIds.size)}
            </span>
            {canAssign && (showBulkAssign ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 220 }}>
                  <LeadAssigneePicker autoFocus apiPath="/api/admin/candidates/assignees" onPick={submitBulkAssign} />
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
            ))}
            {canDelete && (
              <BulkDeleteButton
                resource="candidates"
                ids={Array.from(selectedIds)}
                onDone={() => { setSelectedIds(new Set()); router.refresh(); }}
              />
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
        {candidates.length === 0 ? (
          <EmptyState message={t.none} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {(canAssign || canDelete) && (
                    <th style={{ ...thStyle, width: 1 }}>
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} style={{ cursor: "pointer" }} />
                    </th>
                  )}
                  <SortableTh label={t.name} col={SORT_COL.name} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.contact} col={SORT_COL.contact} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.stageCol} col={SORT_COL.stage} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.categoryCol} col={SORT_COL.category} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.jobCol} col={SORT_COL.job} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.salaryCol} col={SORT_COL.salary} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.assigned} col={SORT_COL.assigned} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <SortableTh label={t.created} col={SORT_COL.created} activeCol={sort} activeDir={dir} onSort={goSort} />
                  <th style={thStyle} />
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", candidate.id); setDraggingId(candidate.id); }}
                    onDragEnd={() => setDraggingId(null)}
                    style={{ cursor: "grab", opacity: draggingId === candidate.id ? 0.5 : 1 }}
                  >
                    {(canAssign || canDelete) && (
                      <td style={cellStyle}>
                        <input type="checkbox" checked={selectedIds.has(candidate.id)} onChange={() => toggleOne(candidate.id)} style={{ cursor: "pointer" }} />
                      </td>
                    )}
                    <td style={cellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{candidate.fullName ?? t.unnamed}</span>
                        {candidate.possibleDuplicateOf && (
                          <span title={t.possibleDuplicate} style={{ display: "flex" }}>
                            <AlertTriangle size={13} color="#C98A70" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {candidate.phone && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                            <Phone size={11} />{candidate.phone}
                          </span>
                        )}
                        {candidate.email && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                            <Mail size={11} />{candidate.email}
                          </span>
                        )}
                        {candidate.socialHandle && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                            <AtSign size={11} />{candidate.socialHandle}
                          </span>
                        )}
                        {!candidate.phone && !candidate.email && !candidate.socialHandle && (
                          <span style={{ color: MUTED }}>{t.noContact}</span>
                        )}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      {candidate.stage ? (
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: `${candidate.stage.color}22`, color: candidate.stage.color }}>
                          {ar ? candidate.stage.labelAr : candidate.stage.labelEn}
                        </span>
                      ) : (
                        <span style={{ color: MUTED }}>{t.noStage}</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {candidate.category ? (
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, backgroundColor: BORDER, color: MUTED }}>
                          {ar ? candidate.category.labelAr : candidate.category.labelEn}
                        </span>
                      ) : (
                        <span style={{ color: MUTED }}>{t.noTag}</span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: MUTED }}>{candidate.jobTitle ?? "—"}</td>
                    <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                      {candidate.expectedSalary != null ? candidate.expectedSalary.toLocaleString(ar ? "ar-EG" : "en-US") : "—"}
                    </td>
                    <td style={{ ...cellStyle, color: MUTED }}>{candidate.assignedToName ?? "—"}</td>
                    <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                      {new Date(candidate.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                    </td>
                    <td style={{ ...cellStyle, width: 1, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {candidate.phone && <LeadWhatsAppButton phone={candidate.phone} size={16} />}
                        {candidate.phone && <LeadCallButton phone={candidate.phone} size={16} />}
                        <Link href={`/admin/candidates/${candidate.id}`} title={t.view} style={{ display: "flex", color: "var(--color-primary)" }}>
                          <Eye size={16} />
                        </Link>
                        <button
                          type="button"
                          title={t.edit}
                          onClick={() => openEdit(candidate)}
                          style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer", color: "#4FA7A3" }}
                        >
                          <Pencil size={16} />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            title={t.delete}
                            onClick={() => setDeleteTarget(candidate)}
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
        buildHref={(p) => hrefFor(p, stage, pageSize, category, assignedTo, actionDate, actionPersonId, sort, dir)}
        total={total}
        pageSize={pageSize}
        buildPageSizeHref={(size) => hrefFor(1, stage, size, category, assignedTo, actionDate, actionPersonId, sort, dir)}
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
