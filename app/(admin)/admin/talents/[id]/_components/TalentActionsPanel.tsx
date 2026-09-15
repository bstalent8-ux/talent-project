"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { Clock, Phone, MessageSquare, Mail, Users, StickyNote } from "lucide-react";
import { TALENT_ACTION_TYPES, type TalentAction, type TalentActionType } from "@/features/admin/types";

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
    editFollowUp: "تعديل الموعد",
    save: "حفظ",
    saving: "جاري الحفظ...",
    none: "—",
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
    editFollowUp: "Edit date",
    save: "Save",
    saving: "Saving...",
    none: "—",
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
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editFollowUpValue, setEditFollowUpValue] = useState("");

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

  async function submitAction(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch(`/api/admin/talents/${talentProfileId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          note: note.trim() || null,
          followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
        }),
      });
      setNote("");
      setFollowUpAt("");
      await refreshActions();
    } finally {
      setBusy(false);
    }
  }

  async function saveFollowUp(actionId: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/talents/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpAt: editFollowUpValue ? new Date(editFollowUpValue).toISOString() : null }),
      });
      setEditingActionId(null);
      await refreshActions();
    } finally {
      setBusy(false);
    }
  }

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 20px" }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <>
      {section(t.addAction, (
        <form onSubmit={submitAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <span style={labelStyle}>{t.actionType}</span>
              <select value={actionType} onChange={(e) => setActionType(e.target.value as TalentActionType)} style={inp}>
                {TALENT_ACTION_TYPES.map((a) => <option key={a} value={a}>{t.types[a]}</option>)}
              </select>
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
        </form>
      ))}

      {section(t.timeline, (
        actions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noActions}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actions.map((action) => {
              const type = (action.actionType as TalentActionType) in t.types ? (action.actionType as TalentActionType) : "note";
              const Icon = ACTION_ICON[type];
              const isPast = action.followUpAt && new Date(action.followUpAt).getTime() < Date.now();
              const isEditing = editingActionId === action.id;
              return (
                <div key={action.id} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: TEXT, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon size={13} />
                      {t.types[type]}
                      <span style={{ color: MUTED, fontWeight: 400 }}> · {t.performedBy} {action.performedByName ?? t.none}</span>
                    </span>
                    <span style={{ color: MUTED }}>
                      {new Date(action.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  {action.note && <p style={{ margin: "6px 0 0", color: TEXT }}>{action.note}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <Clock size={12} color={isPast && !action.notifiedAt ? "#F59E0B" : MUTED} />
                    {isEditing ? (
                      <>
                        <input
                          type="date"
                          value={editFollowUpValue}
                          onChange={(e) => setEditFollowUpValue(e.target.value)}
                          style={{ ...inp, width: "auto", padding: "4px 8px" }}
                        />
                        <button type="button" disabled={busy} onClick={() => saveFollowUp(action.id)}
                          style={{ fontSize: 12, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                          {busy ? t.saving : t.save}
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: isPast && !action.notifiedAt ? "#F59E0B" : MUTED }}>
                          {action.followUpAt ? new Date(action.followUpAt).toLocaleDateString(ar ? "ar-EG" : "en-US") : t.none}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActionId(action.id);
                            setEditFollowUpValue(action.followUpAt ? action.followUpAt.slice(0, 10) : "");
                          }}
                          style={{ fontSize: 11.5, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                          {t.editFollowUp}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ))}
    </>
  );
}
