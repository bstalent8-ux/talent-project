"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import type { CandidateCategoryTerm } from "@/features/candidates/types";

const TX = {
  ar: {
    newTerm: "إضافة", namePh: "الاسم (عربي)", nameEnPh: "الاسم (إنجليزي)", add: "إضافة",
    candidatesOnTerm: (n: number) => `${n} مرشح عليه`,
    delete: "مسح", deleteTitle: "مسح ده؟", deleteDesc: "أي مرشح متعلم بيه هيرجع بلا تصنيف — مش هيتمسح.",
    cancel: "إلغاء", empty: "مفيش عناصر لسه",
  },
  en: {
    newTerm: "Add", namePh: "Name (Arabic)", nameEnPh: "Name (English)", add: "Add",
    candidatesOnTerm: (n: number) => `${n} candidate(s) tagged`,
    delete: "Delete", deleteTitle: "Delete this?", deleteDesc: "Any candidate tagged with it goes back to untagged — not deleted.",
    cancel: "Cancel", empty: "Nothing here yet",
  },
};

interface Props {
  terms: CandidateCategoryTerm[];
  onChanged: () => void;
}

// Job-category tab of CandidateSettingsPanel — mirrors leads'
// TaxonomyManagerPanel, single-table version (candidates only have one
// admin-managed taxonomy, unlike leads' channel+category pair).
export default function CandidateCategoryManagerPanel({ terms, onChanged }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.candidates?.canDelete;

  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const inputStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%" };

  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CandidateCategoryTerm | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTerm, setNewTerm] = useState({ labelAr: "", labelEn: "" });
  const [newTermErr, setNewTermErr] = useState<string | null>(null);

  async function createTerm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNewTermErr(null);
    const res = await fetch("/api/admin/candidates/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelAr: newTerm.labelAr, labelEn: newTerm.labelEn }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null) as { error?: string } | null;
    setBusy(false);
    if (res?.ok) {
      setNewTerm({ labelAr: "", labelEn: "" });
      setShowNew(false);
      onChanged();
    } else {
      setNewTermErr(data?.error ?? "failed");
    }
  }

  async function moveTerm(id: string, direction: "up" | "down") {
    setBusy(true);
    await fetch(`/api/admin/candidates/categories/${id}/move`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ direction }),
    }).catch(() => {});
    setBusy(false);
    onChanged();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    await fetch(`/api/admin/candidates/categories/${deleteTarget.id}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    setDeleteTarget(null);
    onChanged();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {terms.length === 0 && !showNew && <p style={{ margin: "4px 0", fontSize: 12.5, color: MUTED }}>{t.empty}</p>}
      {terms.map((term, idx) => (
        <div key={term.id} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "9px 12px" }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: TEXT }}>
            {lang === "ar" ? term.labelAr : term.labelEn}
            <span style={{ fontWeight: 400, fontSize: 11, color: MUTED }}> · {t.candidatesOnTerm(term.candidateCount)}</span>
          </span>
          <button type="button" disabled={busy || idx === 0} onClick={() => moveTerm(term.id, "up")}
            style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? BORDER : MUTED, display: "flex" }}>
            <ArrowUp size={14} />
          </button>
          <button type="button" disabled={busy || idx === terms.length - 1} onClick={() => moveTerm(term.id, "down")}
            style={{ background: "none", border: "none", cursor: idx === terms.length - 1 ? "default" : "pointer", color: idx === terms.length - 1 ? BORDER : MUTED, display: "flex" }}>
            <ArrowDown size={14} />
          </button>
          {canDelete && (
            <button type="button" onClick={() => setDeleteTarget(term)} title={t.delete}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex" }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      {showNew ? (
        <form onSubmit={createTerm} style={{ display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
          <input required style={inputStyle} placeholder={t.namePh} value={newTerm.labelAr}
            onChange={(e) => setNewTerm((s) => ({ ...s, labelAr: e.target.value }))} />
          <input required style={inputStyle} placeholder={t.nameEnPh} value={newTerm.labelEn}
            onChange={(e) => setNewTerm((s) => ({ ...s, labelEn: e.target.value }))} />
          {newTermErr && <p style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>{newTermErr}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={busy} style={{ padding: "7px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {t.add}
            </button>
            <button type="button" onClick={() => setShowNew(false)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}>
              {t.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowNew(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: `1px dashed ${BORDER}`, backgroundColor: "transparent", color: "var(--color-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} />{t.newTerm}
        </button>
      )}

      <ConfirmationModal
        open={!!deleteTarget}
        title={t.deleteTitle}
        description={t.deleteDesc}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
