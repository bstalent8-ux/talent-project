"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import { STAGE_FIELD_TYPES, type LeadStage, type StageFieldType } from "@/features/leads/types";

const COLOR_SWATCHES = ["#00D26A", "#0EA5E9", "#F4B740", "#8B5CF6", "#EF4444", "#94A3B8", "#EC4899", "#10B981"];

const TX = {
  ar: {
    newStage: "مرحلة جديدة", stageNamePh: "الاسم (عربي)", stageNameEnPh: "الاسم (إنجليزي)", add: "إضافة",
    leadsOnStage: (n: number) => `${n} ليد عليها`,
    delete: "مسح", deleteTitle: "مسح المرحلة؟",
    deleteDesc: (n: number) => n > 0 ? `${n} ليد هيتنقلوا للمرحلة التانية القريبة تلقائي.` : "مفيش ليدز عليها دلوقتي.",
    cancel: "إلغاء",
    questions: "الأسئلة الخاصة بالمرحلة", addQuestion: "سؤال جديد", noQuestions: "مفيش أسئلة مخصصة لسه",
    questionLabelPh: "نص السؤال (عربي)", questionLabelEnPh: "نص السؤال (إنجليزي)",
    fieldTypeText: "نص", fieldTypeDate: "تاريخ", fieldTypeSelect: "اختيار من قايمة", fieldTypeTextarea: "نص طويل", fieldTypeNumber: "رقم",
    required: "إجباري", optionsPh: "الاختيارات (افصل بينهم بفاصلة ,)",
    cantDeleteLast: "لازم تفضل مرحلة واحدة على الأقل",
  },
  en: {
    newStage: "New stage", stageNamePh: "Name (Arabic)", stageNameEnPh: "Name (English)", add: "Add",
    leadsOnStage: (n: number) => `${n} lead(s) on it`,
    delete: "Delete", deleteTitle: "Delete this stage?",
    deleteDesc: (n: number) => n > 0 ? `${n} lead(s) will move to the next nearest stage automatically.` : "No leads on it right now.",
    cancel: "Cancel",
    questions: "Stage questions", addQuestion: "New question", noQuestions: "No custom questions yet",
    questionLabelPh: "Question text (Arabic)", questionLabelEnPh: "Question text (English)",
    fieldTypeText: "Text", fieldTypeDate: "Date", fieldTypeSelect: "Select", fieldTypeTextarea: "Long text", fieldTypeNumber: "Number",
    required: "Required", optionsPh: "Options (comma-separated)",
    cantDeleteLast: "At least one stage must remain",
  },
};

const FIELD_TYPE_LABEL_KEY: Record<StageFieldType, "fieldTypeText" | "fieldTypeDate" | "fieldTypeSelect" | "fieldTypeTextarea" | "fieldTypeNumber"> = {
  text: "fieldTypeText", date: "fieldTypeDate", select: "fieldTypeSelect", textarea: "fieldTypeTextarea", number: "fieldTypeNumber",
};

// Pipeline stages sub-panel of LeadSettingsPanel — body only, no modal
// chrome of its own (the tabbed shell owns that). Was previously the whole
// of StageManagerPanel before channels/categories needed their own tabs
// alongside it.
export default function StagesTab({ stages, onChanged }: { stages: LeadStage[]; onChanged: () => void }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.leads?.canDelete;

  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const inputStyle: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%" };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadStage | null>(null);
  const [busy, setBusy] = useState(false);

  const [newStage, setNewStage] = useState({ labelAr: "", labelEn: "", color: COLOR_SWATCHES[0] });
  const [showNewStage, setShowNewStage] = useState(false);
  const [newStageErr, setNewStageErr] = useState<string | null>(null);

  const [newField, setNewField] = useState({ labelAr: "", labelEn: "", fieldType: "text" as StageFieldType, required: false, optionsRaw: "" });
  const [addingFieldTo, setAddingFieldTo] = useState<string | null>(null);

  async function createStage(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNewStageErr(null);
    const res = await fetch("/api/admin/leads/stages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelAr: newStage.labelAr, labelEn: newStage.labelEn, color: newStage.color }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null) as { error?: string } | null;
    setBusy(false);
    if (res?.ok) {
      setNewStage({ labelAr: "", labelEn: "", color: COLOR_SWATCHES[0] });
      setShowNewStage(false);
      onChanged();
    } else {
      setNewStageErr(data?.error ?? "failed");
    }
  }

  async function moveStage(id: string, direction: "up" | "down") {
    setBusy(true);
    await fetch(`/api/admin/leads/stages/${id}/move`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ direction }),
    }).catch(() => {});
    setBusy(false);
    onChanged();
  }

  async function confirmDeleteStage() {
    if (!deleteTarget) return;
    if (stages.length <= 1) { setDeleteTarget(null); return; }
    setBusy(true);
    await fetch(`/api/admin/leads/stages/${deleteTarget.id}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    setDeleteTarget(null);
    onChanged();
  }

  async function addField(stageId: string, e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const options = newField.fieldType === "select"
      ? newField.optionsRaw.split(",").map((v) => v.trim()).filter(Boolean).map((v) => ({ value: v, labelAr: v, labelEn: v }))
      : undefined;
    await fetch(`/api/admin/leads/stages/${stageId}/fields`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelAr: newField.labelAr, labelEn: newField.labelEn, fieldType: newField.fieldType, required: newField.required, options }),
    }).catch(() => {});
    setBusy(false);
    setNewField({ labelAr: "", labelEn: "", fieldType: "text", required: false, optionsRaw: "" });
    setAddingFieldTo(null);
    onChanged();
  }

  async function removeField(fieldId: string) {
    setBusy(true);
    await fetch(`/api/admin/leads/stages/fields/${fieldId}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    onChanged();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {stages.map((stage, idx) => {
        const isOpen = expandedId === stage.id;
        return (
          <div key={stage.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: stage.color, flexShrink: 0 }} />
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : stage.id)}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", textAlign: "start", padding: 0 }}
              >
                {isOpen ? <ChevronUp size={13} color={MUTED} /> : <ChevronDown size={13} color={MUTED} />}
                <span style={{ fontWeight: 600, fontSize: 13.5, color: TEXT }}>{lang === "ar" ? stage.labelAr : stage.labelEn}</span>
                <span style={{ fontSize: 11, color: MUTED }}>· {t.leadsOnStage(stage.leadCount)}</span>
              </button>
              <button type="button" disabled={busy || idx === 0} onClick={() => moveStage(stage.id, "up")}
                style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? BORDER : MUTED, display: "flex" }}>
                <ArrowUp size={14} />
              </button>
              <button type="button" disabled={busy || idx === stages.length - 1} onClick={() => moveStage(stage.id, "down")}
                style={{ background: "none", border: "none", cursor: idx === stages.length - 1 ? "default" : "pointer", color: idx === stages.length - 1 ? BORDER : MUTED, display: "flex" }}>
                <ArrowDown size={14} />
              </button>
              {canDelete && (
                <button type="button" onClick={() => setDeleteTarget(stage)} title={t.delete}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex" }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {isOpen && (
              <div style={{ padding: "0 12px 12px", borderTop: `1px solid ${BORDER}` }}>
                <p style={{ margin: "10px 0 6px", fontSize: 11.5, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>{t.questions}</p>
                {stage.fields.length === 0 && <p style={{ margin: "0 0 8px", fontSize: 12.5, color: MUTED }}>{t.noQuestions}</p>}
                {stage.fields.map((f) => (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 12.5 }}>
                    <span style={{ flex: 1, color: TEXT }}>
                      {lang === "ar" ? f.labelAr : f.labelEn}
                      <span style={{ color: MUTED }}> · {t[FIELD_TYPE_LABEL_KEY[f.fieldType]]}{f.required ? ` · ${t.required}` : ""}</span>
                    </span>
                    <button type="button" onClick={() => removeField(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {addingFieldTo === stage.id ? (
                  <form onSubmit={(e) => addField(stage.id, e)} style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    <input required style={inputStyle} placeholder={t.questionLabelPh} value={newField.labelAr}
                      onChange={(e) => setNewField((f) => ({ ...f, labelAr: e.target.value }))} />
                    <input required style={inputStyle} placeholder={t.questionLabelEnPh} value={newField.labelEn}
                      onChange={(e) => setNewField((f) => ({ ...f, labelEn: e.target.value }))} />
                    <select value={newField.fieldType} onChange={(e) => setNewField((f) => ({ ...f, fieldType: e.target.value as StageFieldType }))} style={inputStyle}>
                      {STAGE_FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{t[FIELD_TYPE_LABEL_KEY[ft]]}</option>)}
                    </select>
                    {newField.fieldType === "select" && (
                      <input style={inputStyle} placeholder={t.optionsPh} value={newField.optionsRaw}
                        onChange={(e) => setNewField((f) => ({ ...f, optionsRaw: e.target.value }))} />
                    )}
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TEXT }}>
                      <input type="checkbox" checked={newField.required} onChange={(e) => setNewField((f) => ({ ...f, required: e.target.checked }))} />
                      {t.required}
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="submit" disabled={busy} style={{ padding: "6px 14px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {t.add}
                      </button>
                      <button type="button" onClick={() => setAddingFieldTo(null)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12, cursor: "pointer" }}>
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button type="button" onClick={() => setAddingFieldTo(stage.id)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                    <Plus size={12} />{t.addQuestion}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showNewStage ? (
        <form onSubmit={createStage} style={{ display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
          <input required style={inputStyle} placeholder={t.stageNamePh} value={newStage.labelAr}
            onChange={(e) => setNewStage((s) => ({ ...s, labelAr: e.target.value }))} />
          <input required style={inputStyle} placeholder={t.stageNameEnPh} value={newStage.labelEn}
            onChange={(e) => setNewStage((s) => ({ ...s, labelEn: e.target.value }))} />
          <div style={{ display: "flex", gap: 6 }}>
            {COLOR_SWATCHES.map((c) => (
              <button key={c} type="button" onClick={() => setNewStage((s) => ({ ...s, color: c }))}
                style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: c, border: newStage.color === c ? `2px solid ${TEXT}` : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
          {newStageErr && <p style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>{newStageErr}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={busy} style={{ padding: "7px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {t.add}
            </button>
            <button type="button" onClick={() => setShowNewStage(false)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}>
              {t.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowNewStage(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: `1px dashed ${BORDER}`, backgroundColor: "transparent", color: "var(--color-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} />{t.newStage}
        </button>
      )}

      <ConfirmationModal
        open={!!deleteTarget}
        title={t.deleteTitle}
        description={deleteTarget ? (stages.length <= 1 ? t.cantDeleteLast : t.deleteDesc(deleteTarget.leadCount)) : undefined}
        confirmLabel={deleteTarget && stages.length <= 1 ? undefined : t.delete}
        cancelLabel={t.cancel}
        onConfirm={confirmDeleteStage}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
