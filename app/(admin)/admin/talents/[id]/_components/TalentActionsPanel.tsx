"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { Clock, Phone, MessageSquare, Mail, Users, StickyNote, Pencil, Trash2, History as HistoryIcon, PlusCircle, MinusCircle } from "lucide-react";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import CustomSelect from "@/components/ui/CustomSelect";
import { TALENT_ACTION_TYPES, type TalentAction, type TalentActionType, type TalentActionAuditEntry } from "@/features/admin/types";

const TX = {
  ar: {
    title: "المتابعة (CRM)",
    addAction: "سجّل أكشن جديد",
    actionType: "نوع الأكشن",
    note: "ملاحظة / نتيجة المكالمة (اختياري)",
    followUp: "موعد متابعة",
    followUpHint: "(اختياري — هتوصلك إشعار وقتها)",
    submit: "حفظ",
    submitting: "جاري الحفظ...",
    timeline: "السجل",
    noActions: "لسه مفيش أي أكشن متسجل.",
    performedBy: "بواسطة",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    none: "—",
    deleteTitle: "حذف الأكشن؟",
    deleteDesc: "الأكشن ده هيتمسح نهائياً من سجل المتابعة، والإجراء ده مايترجعش.",
    genericError: "حصل خطأ — تأكد إن عندك صلاحية كافية وحاول تاني.",
    changeLog: "سجل التعديلات",
    hideChangeLog: "إخفاء سجل التعديلات",
    noLog: "لسه مفيش أي تعديل أو حذف متسجل.",
    logCreated: "أنشأ أكشن جديد",
    logUpdated: "عدّل الأكشن",
    logDeleted: "حذف الأكشن",
    deletedSnapshot: "البيانات اللي اتمسحت",
    fieldType: "النوع", fieldNote: "الملاحظة", fieldFollowUp: "موعد المتابعة",
    types: { call: "مكالمة", message: "رسالة", email: "إيميل", meeting: "اجتماع", note: "ملاحظة" } as Record<TalentActionType, string>,
  },
  en: {
    title: "Follow-up (CRM)",
    addAction: "Log a new action",
    actionType: "Action type",
    note: "Note / call outcome (optional)",
    followUp: "Follow-up date",
    followUpHint: "(optional — you'll get a reminder notification)",
    submit: "Save",
    submitting: "Saving...",
    timeline: "History",
    noActions: "No actions logged yet.",
    performedBy: "by",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    none: "—",
    deleteTitle: "Delete this action?",
    deleteDesc: "This action will be permanently removed from the follow-up history — this can't be undone.",
    genericError: "Something went wrong — make sure you have permission for this and try again.",
    changeLog: "Change log",
    hideChangeLog: "Hide change log",
    noLog: "No edits or deletions logged yet.",
    logCreated: "created this action",
    logUpdated: "edited this action",
    logDeleted: "deleted this action",
    deletedSnapshot: "What was deleted",
    fieldType: "Type", fieldNote: "Note", fieldFollowUp: "Follow-up date",
    types: { call: "Call", message: "Message", email: "Email", meeting: "Meeting", note: "Note" } as Record<TalentActionType, string>,
  },
};

const ACTION_ICON: Record<TalentActionType, React.ComponentType<{ size?: number }>> = {
  call: Phone, message: MessageSquare, email: Mail, meeting: Users, note: StickyNote,
};

interface Props {
  talentProfileId: string;
  initialActions: TalentAction[];
}

interface EditForm {
  actionType: TalentActionType;
  note: string;
  followUpAt: string; // yyyy-mm-dd, "" = none
}

export default function TalentActionsPanel({ talentProfileId, initialActions }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [actions, setActions] = useState(initialActions);
  const [actionType, setActionType] = useState<TalentActionType>("call");
  const [note, setNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ actionType: "call", note: "", followUpAt: "" });
  const [deleteTarget, setDeleteTarget] = useState<TalentAction | null>(null);

  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState<TalentActionAuditEntry[] | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#0a121c" : "#f8fafc";

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${BORDER}`, backgroundColor: INPUT,
    color: TEXT, fontSize: 13.5, outline: "none",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 12.5, display: "block", marginBottom: 6, fontWeight: 500 };

  async function refreshActions() {
    const res = await fetch(`/api/admin/talents/${talentProfileId}/actions`);
    if (res.ok) {
      const { actions: fresh } = await res.json();
      setActions(fresh);
    }
    router.refresh();
  }

  async function toggleLog() {
    if (showLog) {
      setShowLog(false);
      return;
    }
    setShowLog(true);
    setLogLoading(true);
    try {
      const res = await fetch(`/api/admin/talents/${talentProfileId}/actions/audit-log`);
      if (res.ok) {
        const { entries } = await res.json();
        setLogEntries(entries);
      }
    } finally {
      setLogLoading(false);
    }
  }

  async function submitAction(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/talents/${talentProfileId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          note: note.trim() || null,
          followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        }),
      });
      if (!res.ok) { setErrorMsg(t.genericError); return; }
      setNote("");
      setFollowUpAt("");
      await refreshActions();
      if (showLog) await refreshLogSilently();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(action: TalentAction) {
    setErrorMsg(null);
    setEditingActionId(action.id);
    setEditForm({
      actionType: (action.actionType as TalentActionType) in t.types ? (action.actionType as TalentActionType) : "note",
      note: action.note ?? "",
      followUpAt: action.followUpAt ? action.followUpAt.slice(0, 10) : "",
    });
  }

  async function saveEdit(actionId: string) {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/talents/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: editForm.actionType,
          note: editForm.note.trim() || null,
          followUpAt: editForm.followUpAt ? new Date(editForm.followUpAt).toISOString() : null,
        }),
      });
      if (!res.ok) { setErrorMsg(t.genericError); return; }
      setEditingActionId(null);
      await refreshActions();
      if (showLog) await refreshLogSilently();
    } finally {
      setBusy(false);
    }
  }

  async function refreshLogSilently() {
    const res = await fetch(`/api/admin/talents/${talentProfileId}/actions/audit-log`);
    if (res.ok) {
      const { entries } = await res.json();
      setLogEntries(entries);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/talents/actions/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { setErrorMsg(t.genericError); setDeleteTarget(null); return; }
      setDeleteTarget(null);
      await refreshActions();
      if (showLog) await refreshLogSilently();
    } finally {
      setBusy(false);
    }
  }

  const section = (title: string, children: React.ReactNode, extra?: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: 0 }}>{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  );

  const fieldLabel = (key: "action_type" | "note" | "follow_up_at") =>
    key === "action_type" ? t.fieldType : key === "note" ? t.fieldNote : t.fieldFollowUp;

  const fieldValue = (key: "action_type" | "note" | "follow_up_at", raw: unknown): string => {
    if (raw === null || raw === undefined || raw === "") return t.none;
    if (key === "action_type") {
      const k = raw as TalentActionType;
      return k in t.types ? t.types[k] : String(raw);
    }
    if (key === "follow_up_at") return new Date(String(raw)).toLocaleDateString(ar ? "ar-EG" : "en-US");
    return String(raw);
  };

  return (
    <>
      {section(t.addAction, (
        <form onSubmit={submitAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <span style={labelStyle}>{t.actionType}</span>
              <CustomSelect
                value={actionType}
                onChange={(v) => setActionType(v as TalentActionType)}
                style={inp}
                colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }}
                options={TALENT_ACTION_TYPES.map((a) => ({ value: a, label: t.types[a] }))}
              />
            </div>
            <div>
              <span style={labelStyle}>{t.followUp} <span style={{ opacity: 0.7 }}>{t.followUpHint}</span></span>
              <input type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <span style={labelStyle}>{t.note}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                alignSelf: "flex-start", padding: "9px 20px", borderRadius: 8, border: "none",
                backgroundColor: "#00D26A", color: "#000", fontSize: 13.5, fontWeight: 800,
                cursor: busy ? "wait" : "pointer", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? t.submitting : t.submit}
            </button>
            {errorMsg && <span style={{ color: "#EF4444", fontSize: 12.5 }}>{errorMsg}</span>}
          </div>
        </form>
      ))}

      {section(
        t.timeline,
        actions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noActions}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actions.map((action) => {
              const type = (action.actionType as TalentActionType) in t.types ? (action.actionType as TalentActionType) : "note";
              const Icon = ACTION_ICON[type];
              const isPast = action.followUpAt && new Date(action.followUpAt).getTime() < Date.now();
              const isEditing = editingActionId === action.id;

              if (isEditing) {
                return (
                  <div key={action.id} style={{ padding: "12px", borderRadius: 10, border: `1px solid var(--color-primary)`, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                      <div>
                        <span style={labelStyle}>{t.actionType}</span>
                        <CustomSelect
                          value={editForm.actionType}
                          onChange={(v) => setEditForm((f) => ({ ...f, actionType: v as TalentActionType }))}
                          style={inp}
                          colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }}
                          options={TALENT_ACTION_TYPES.map((a) => ({ value: a, label: t.types[a] }))}
                        />
                      </div>
                      <div>
                        <span style={labelStyle}>{t.followUp}</span>
                        <input
                          type="date"
                          value={editForm.followUpAt}
                          onChange={(e) => setEditForm((f) => ({ ...f, followUpAt: e.target.value }))}
                          style={inp}
                        />
                      </div>
                    </div>
                    <div>
                      <span style={labelStyle}>{t.note}</span>
                      <textarea
                        value={editForm.note}
                        onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                        rows={2}
                        style={{ ...inp, resize: "vertical" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveEdit(action.id)}
                        style={{
                          padding: "7px 16px", borderRadius: 8, border: "none",
                          backgroundColor: "#00D26A", color: "#000", fontSize: 12.5, fontWeight: 800,
                          cursor: busy ? "wait" : "pointer", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        }}
                      >
                        {busy ? t.saving : t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingActionId(null)}
                        style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: MUTED, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        {t.cancel}
                      </button>
                      {errorMsg && <span style={{ color: "#EF4444", fontSize: 12 }}>{errorMsg}</span>}
                    </div>
                  </div>
                );
              }

              return (
                <div key={action.id} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: TEXT, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon size={13} />
                      {t.types[type]}
                      <span style={{ color: MUTED, fontWeight: 400 }}> · {t.performedBy} {action.performedByName ?? t.none}</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: MUTED }}>
                        {new Date(action.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(action)}
                        title={t.edit}
                        style={{ display: "flex", background: "none", border: "none", color: MUTED, cursor: "pointer" }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(action)}
                        title={t.delete}
                        style={{ display: "flex", background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {action.note && <p style={{ margin: "6px 0 0", color: TEXT }}>{action.note}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <Clock size={12} color={isPast && !action.notifiedAt ? "#F59E0B" : MUTED} />
                    <span style={{ color: isPast && !action.notifiedAt ? "#F59E0B" : MUTED }}>
                      {action.followUpAt ? new Date(action.followUpAt).toLocaleDateString(ar ? "ar-EG" : "en-US") : t.none}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ),
        <button
          type="button"
          onClick={toggleLog}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--color-primary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          <HistoryIcon size={13} />{showLog ? t.hideChangeLog : t.changeLog}
        </button>
      )}

      {showLog && (
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>{t.changeLog}</h3>
          {logLoading ? (
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>…</p>
          ) : !logEntries || logEntries.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noLog}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {logEntries.map((entry) => {
                const LogIcon = entry.action === "created" ? PlusCircle : entry.action === "deleted" ? MinusCircle : Pencil;
                const logColor = entry.action === "created" ? "#00D26A" : entry.action === "deleted" ? "#EF4444" : "#F59E0B";
                const label = entry.action === "created" ? t.logCreated : entry.action === "deleted" ? t.logDeleted : t.logUpdated;

                const changedFields = (["action_type", "note", "follow_up_at"] as const).filter((key) => {
                  if (entry.action !== "updated" || !entry.oldValue || !entry.newValue) return false;
                  return JSON.stringify(entry.oldValue[key] ?? null) !== JSON.stringify(entry.newValue[key] ?? null);
                });

                return (
                  <div key={entry.id} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12.5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: TEXT, fontWeight: 700 }}>
                        <LogIcon size={13} color={logColor} />
                        {entry.changedByName ?? t.none} {label}
                      </span>
                      <span style={{ color: MUTED }}>
                        {new Date(entry.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    {entry.action === "updated" && changedFields.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                        {changedFields.map((key) => (
                          <div key={key} style={{ color: MUTED }}>
                            <b style={{ color: TEXT, fontWeight: 700 }}>{fieldLabel(key)}:</b>{" "}
                            {fieldValue(key, entry.oldValue?.[key])} → {fieldValue(key, entry.newValue?.[key])}
                          </div>
                        ))}
                      </div>
                    )}

                    {entry.action === "deleted" && entry.oldValue && (
                      <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, backgroundColor: dark ? "#0a121c" : "#f8fafc", border: `1px solid ${BORDER}` }}>
                        <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{t.deletedSnapshot}</div>
                        <div style={{ color: TEXT }}>
                          {fieldLabel("action_type")}: {fieldValue("action_type", entry.oldValue.action_type)}
                          {entry.oldValue.note ? ` · ${fieldLabel("note")}: ${fieldValue("note", entry.oldValue.note)}` : ""}
                          {entry.oldValue.follow_up_at ? ` · ${fieldLabel("follow_up_at")}: ${fieldValue("follow_up_at", entry.oldValue.follow_up_at)}` : ""}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
    </>
  );
}
