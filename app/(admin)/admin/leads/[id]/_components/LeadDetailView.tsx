"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, Phone, AtSign, AlertTriangle, Clock, Pencil, Trash2, UserCircle2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import CustomSelect from "@/components/ui/CustomSelect";
import MoveStageModal from "../../_components/MoveStageModal";
import { LeadCallButton, LeadWhatsAppButton } from "../../_components/LeadContactActions";
import LeadAssigneePicker from "../../_components/LeadAssigneePicker";
import { LEAD_ACTION_TYPES, LEAD_ASSIGN_ACTION_TYPE, STAGE_CHANGE_ACTION_TYPE, type LeadStage, type LeadTaxonomyTerm, type LeadWithActions } from "@/features/leads/types";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: {
    back: "رجوع للقائمة",
    contact: "بيانات التواصل", extra: "بيانات إضافية", status: "الحالة", assigned: "المسؤول",
    createdBy: "أضافه", createdAt: "تاريخ الإضافة", source: "طريقة الإضافة",
    channel: "المصدر", category: "الكاتيجوري", unset: "بدون تحديد",
    manual: "يدوي", excel: "إكسيل", sheet: "شيت",
    unnamed: "بدون اسم", none: "—",
    new: "جديد", contacted: "تم التواصل", interested: "مهتم", not_interested: "مش مهتم", converted: "اتحول لعميل",
    duplicateBanner: "الرقم ده مطابق لليد موجود قبل كده — نفس الشخص؟",
    viewOther: "شوف الليد التاني", merge: "دمج", dismiss: "لأ، شخص مختلف",
    timeline: "سجل المتابعة", noActions: "لسه مفيش أكشن اتسجل",
    addAction: "سجّل أكشن جديد", actionType: "نوع الأكشن", note: "ملاحظة (اختياري)",
    followUp: "معاد الفولو أب", followUpDefault: "افتراضي: بعد يومين",
    submit: "سجّل", submitting: "بيتسجل...",
    call: "مكالمة", message: "رسالة", email: "إيميل", meeting: "اجتماع",
    editFollowUp: "عدّل المعاد", save: "حفظ", saving: "بيتحفظ...",
    performedBy: "بواسطة", overdue: "متأخر", upcoming: "جاي",
    changeStatus: "المرحلة",
    editContact: "تعديل بيانات التواصل", saveContact: "حفظ", cancel: "إلغاء",
    deleteLead: "مسح الليد", deleteTitle: "مسح الليد؟",
    deleteDesc: "هيتمسح وكل سجل المتابعة بتاعه — الخطوة دي مش هترجع.",
    stageChange: "اتنقل للمرحلة",
    leadAssigned: "اتعين لـ", editAssignee: "غيّر المسؤول",
    taskAssignee: "التاسك ده لمين؟", taskFor: "لـ",
  },
  en: {
    back: "Back to list",
    contact: "Contact", extra: "Extra data", status: "Status", assigned: "Assigned to",
    createdBy: "Added by", createdAt: "Added", source: "Entry method",
    channel: "Source", category: "Category", unset: "Unset",
    manual: "Manual", excel: "Excel", sheet: "Sheet",
    unnamed: "Unnamed", none: "—",
    new: "New", contacted: "Contacted", interested: "Interested", not_interested: "Not interested", converted: "Converted",
    duplicateBanner: "This phone number matches an existing lead — same person?",
    viewOther: "View the other lead", merge: "Merge", dismiss: "No, different person",
    timeline: "Follow-up log", noActions: "No actions logged yet",
    addAction: "Log a new action", actionType: "Action type", note: "Note (optional)",
    followUp: "Follow-up date", followUpDefault: "Default: in 2 days",
    submit: "Log it", submitting: "Logging...",
    call: "Call", message: "Message", email: "Email", meeting: "Meeting",
    editFollowUp: "Edit date", save: "Save", saving: "Saving...",
    performedBy: "by", overdue: "overdue", upcoming: "upcoming",
    changeStatus: "Stage",
    editContact: "Edit contact info", saveContact: "Save", cancel: "Cancel",
    deleteLead: "Delete lead", deleteTitle: "Delete this lead?",
    deleteDesc: "It and its whole follow-up history will be deleted — this can't be undone.",
    stageChange: "Moved to stage",
    leadAssigned: "Assigned to", editAssignee: "Change assignee",
    taskAssignee: "Assign this task to", taskFor: "for",
  },
};

const ACTION_LABEL_KEY: Record<string, "call" | "message" | "email" | "meeting" | "note"> = {
  call: "call", message: "message", email: "email", meeting: "meeting", note: "note",
};

interface Props {
  lead: LeadWithActions;
  stages: LeadStage[];
  channels: LeadTaxonomyTerm[];
  categories: LeadTaxonomyTerm[];
}

export default function LeadDetailView({ lead, stages, channels, categories }: Props) {
  const { dark, lang } = useSite();
  const permissions = useAdminPermissions();
  const canDelete = permissions === null || !!permissions.leads?.canDelete;
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";
  const BackIcon = ar ? ArrowRight : ArrowLeft;

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  const [busy, setBusy] = useState(false);
  const [actionType, setActionType] = useState<string>("call");
  const [note, setNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editFollowUpValue, setEditFollowUpValue] = useState("");

  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({
    fullName: lead.fullName ?? "", phone: lead.phone ?? "", email: lead.email ?? "", socialHandle: lead.socialHandle ?? "",
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<LeadStage | null>(null);

  const [editingAssignee, setEditingAssignee] = useState(false);
  // Defaults the new-action "assign this task to" field to the lead's
  // current owner — the common case is a task staying with whoever already
  // owns the lead; picking someone else here doesn't touch leads.assigned_to.
  const [taskAssignee, setTaskAssignee] = useState<{ id: string; name: string | null } | null>(
    lead.assignedTo ? { id: lead.assignedTo, name: lead.assignedToName } : null
  );

  const cardStyle: React.CSSProperties = {
    backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18,
  };
  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: MUTED, marginBottom: 4, display: "block" };

  async function changeStage(stageId: string) {
    const target = stages.find((s) => s.id === stageId);
    if (!target) return;
    if (target.fields.length > 0) {
      setPendingStage(target);
      return;
    }
    setBusy(true);
    await fetch(`/api/admin/leads/${lead.id}/stage`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  async function changeTaxonomy(field: "channelId" | "categoryId", value: string) {
    setBusy(true);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  async function changeAssignee(admin: AdminSearchResult | null) {
    setBusy(true);
    await fetch(`/api/admin/leads/${lead.id}/assign`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: admin?.id ?? null }),
    }).catch(() => {});
    setBusy(false);
    setEditingAssignee(false);
    router.refresh();
  }

  async function resolveDuplicate(decision: "merge" | "dismiss") {
    setBusy(true);
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duplicateDecision: decision }),
    }).catch(() => null);
    setBusy(false);
    if (decision === "merge" && res?.ok) {
      router.push(`/admin/leads/${lead.possibleDuplicateOf}`);
      return;
    }
    router.refresh();
  }

  async function saveContact() {
    setBusy(true);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: contactDraft.fullName || null,
        phone: contactDraft.phone || null,
        email: contactDraft.email || null,
        socialHandle: contactDraft.socialHandle || null,
      }),
    }).catch(() => {});
    setBusy(false);
    setEditingContact(false);
    router.refresh();
  }

  async function deleteThisLead() {
    setBusy(true);
    const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    setDeleteOpen(false);
    if (res?.ok) router.push("/admin/leads");
  }

  async function submitAction(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch(`/api/admin/leads/${lead.id}/actions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionType,
        note: note || null,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
        assignedTo: taskAssignee?.id ?? null,
      }),
    }).catch(() => {});
    setBusy(false);
    setNote(""); setFollowUpAt("");
    router.refresh();
  }

  async function saveFollowUp(actionId: string) {
    setBusy(true);
    await fetch(`/api/admin/leads/actions/${actionId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt: editFollowUpValue ? new Date(editFollowUpValue).toISOString() : null }),
    }).catch(() => {});
    setBusy(false);
    setEditingActionId(null);
    router.refresh();
  }

  const extraEntries = Object.entries(lead.extra ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <Link href="/admin/leads" style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 13, textDecoration: "none", width: "fit-content" }}>
          <BackIcon size={14} />{t.back}
        </Link>
        {canDelete && (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 12.5, fontWeight: 600 }}
          >
            <Trash2 size={14} />{t.deleteLead}
          </button>
        )}
      </div>

      {lead.possibleDuplicateOf && (
        <div style={{ ...cardStyle, borderColor: "#F59E0B", backgroundColor: "rgba(245,158,11,0.08)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13.5, color: TEXT, minWidth: 200 }}>{t.duplicateBanner}</span>
          <Link href={`/admin/leads/${lead.possibleDuplicateOf}`} target="_blank" style={{ fontSize: 12.5, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
            {t.viewOther}
          </Link>
          <button type="button" disabled={busy} onClick={() => resolveDuplicate("merge")}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", backgroundColor: "#F59E0B", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            {t.merge}
          </button>
          <button type="button" disabled={busy} onClick={() => resolveDuplicate("dismiss")}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}>
            {t.dismiss}
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT }}>{lead.fullName ?? t.unnamed}</h3>
            {!editingContact && (
              <button
                type="button"
                title={t.editContact}
                onClick={() => {
                  setContactDraft({
                    fullName: lead.fullName ?? "", phone: lead.phone ?? "", email: lead.email ?? "", socialHandle: lead.socialHandle ?? "",
                  });
                  setEditingContact(true);
                }}
                style={{ display: "flex", background: "none", border: "none", cursor: "pointer", color: "#4FA7A3", flexShrink: 0 }}
              >
                <Pencil size={15} />
              </button>
            )}
          </div>

          {editingContact ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={inputStyle} placeholder={t.unnamed} value={contactDraft.fullName}
                onChange={(e) => setContactDraft((d) => ({ ...d, fullName: e.target.value }))} />
              <input style={inputStyle} placeholder="Phone" value={contactDraft.phone}
                onChange={(e) => setContactDraft((d) => ({ ...d, phone: e.target.value }))} />
              <input style={inputStyle} placeholder="Email" value={contactDraft.email}
                onChange={(e) => setContactDraft((d) => ({ ...d, email: e.target.value }))} />
              <input style={inputStyle} placeholder="@handle" value={contactDraft.socialHandle}
                onChange={(e) => setContactDraft((d) => ({ ...d, socialHandle: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" disabled={busy} onClick={saveContact}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {busy ? t.saving : t.saveContact}
                </button>
                <button type="button" onClick={() => setEditingContact(false)}
                  style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 12.5, cursor: "pointer" }}>
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: lead.phone ? TEXT : MUTED }}>
                <Phone size={13} />{lead.phone ?? t.none}
                {lead.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: 10, marginInlineStart: "auto" }}>
                    <LeadWhatsAppButton phone={lead.phone} size={16} />
                    <LeadCallButton phone={lead.phone} size={16} />
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: lead.email ? TEXT : MUTED }}>
                <Mail size={13} />{lead.email ?? t.none}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: lead.socialHandle ? TEXT : MUTED }}>
                <AtSign size={13} />{lead.socialHandle ?? t.none}
              </div>
            </div>
          )}

          {extraEntries.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              <span style={labelStyle}>{t.extra}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {extraEntries.map(([key, value]) => (
                  <div key={key} style={{ fontSize: 12.5, color: TEXT }}>
                    <span style={{ color: MUTED }}>{key}: </span>{value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>{t.changeStatus}</span>
          <CustomSelect
            value={lead.stage?.id ?? ""}
            disabled={busy}
            onChange={changeStage}
            style={{ marginBottom: 14 }}
            colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
            options={[
              ...(!lead.stage ? [{ value: "", label: t.none }] : []),
              ...stages.map((s) => ({ value: s.id, label: ar ? s.labelAr : s.labelEn })),
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <span style={labelStyle}>{t.channel}</span>
              <CustomSelect
                value={lead.channel?.id ?? ""}
                disabled={busy}
                onChange={(v) => changeTaxonomy("channelId", v)}
                colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
                options={[{ value: "", label: t.unset }, ...channels.map((c) => ({ value: c.id, label: ar ? c.labelAr : c.labelEn }))]}
              />
            </div>
            <div>
              <span style={labelStyle}>{t.category}</span>
              <CustomSelect
                value={lead.category?.id ?? ""}
                disabled={busy}
                onChange={(v) => changeTaxonomy("categoryId", v)}
                colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
                options={[{ value: "", label: t.unset }, ...categories.map((c) => ({ value: c.id, label: ar ? c.labelAr : c.labelEn }))]}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <div style={{ position: "relative" }}>
              <span style={{ color: MUTED }}>{t.assigned}: </span>
              {editingAssignee ? (
                <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <LeadAssigneePicker autoFocus placeholder={lead.assignedToName ?? undefined} onPick={changeAssignee} />
                  </div>
                  <button type="button" onClick={() => setEditingAssignee(false)}
                    style={{ padding: "9px 10px", background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", color: MUTED, fontSize: 12 }}>
                    {t.cancel}
                  </button>
                </div>
              ) : (
                <>
                  {lead.assignedToName ?? t.none}
                  <button
                    type="button"
                    title={t.editAssignee}
                    onClick={() => setEditingAssignee(true)}
                    style={{ display: "inline-flex", verticalAlign: "middle", marginInlineStart: 6, background: "none", border: "none", cursor: "pointer", color: "#4FA7A3" }}
                  >
                    <Pencil size={12} />
                  </button>
                </>
              )}
            </div>
            <div><span style={{ color: MUTED }}>{t.createdBy}: </span>{lead.createdByName ?? t.none}</div>
            <div><span style={{ color: MUTED }}>{t.source}: </span>{t[lead.source]}</div>
            <div><span style={{ color: MUTED }}>{t.createdAt}: </span>{new Date(lead.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.addAction}</h3>
        <form onSubmit={submitAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <div>
              <span style={labelStyle}>{t.actionType}</span>
              <CustomSelect
                value={actionType}
                onChange={setActionType}
                colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
                options={LEAD_ACTION_TYPES.map((a) => ({ value: a, label: t[ACTION_LABEL_KEY[a]] }))}
              />
            </div>
            <div>
              <span style={labelStyle}>{t.followUp} <span style={{ opacity: 0.7 }}>({t.followUpDefault})</span></span>
              <input type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>{t.taskAssignee}</span>
              <LeadAssigneePicker
                placeholder={taskAssignee?.name ?? undefined}
                onPick={(admin) => setTaskAssignee(admin ? { id: admin.id, name: admin.fullName ?? admin.handle } : null)}
              />
            </div>
          </div>
          <div>
            <span style={labelStyle}>{t.note}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <button
            type="submit"
            disabled={busy}
            style={{
              alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8, border: "none",
              backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? t.submitting : t.submit}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.timeline}</h3>
        {lead.actions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noActions}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lead.actions.map((action) => {
              const isPast = action.followUpAt && new Date(action.followUpAt).getTime() < Date.now();
              const isEditing = editingActionId === action.id;
              return (
                <div key={action.id} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: TEXT }}>
                      {action.actionType === STAGE_CHANGE_ACTION_TYPE ? (
                        <>{t.stageChange} <span style={{ color: action.stage?.color }}>{action.stage ? (ar ? action.stage.labelAr : action.stage.labelEn) : ""}</span></>
                      ) : action.actionType === LEAD_ASSIGN_ACTION_TYPE ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <UserCircle2 size={13} />{t.leadAssigned} {action.assignedToName ?? t.none}
                        </span>
                      ) : (
                        <>
                          {t[ACTION_LABEL_KEY[action.actionType] ?? "note"]}
                          {action.assignedToName && <span style={{ color: MUTED, fontWeight: 400 }}> · {t.taskFor} {action.assignedToName}</span>}
                        </>
                      )}
                      <span style={{ color: MUTED, fontWeight: 400 }}> · {t.performedBy} {action.performedByName ?? t.none}</span>
                    </span>
                    <span style={{ color: MUTED }}>
                      {new Date(action.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  {action.note && <p style={{ margin: "6px 0 0", color: TEXT }}>{action.note}</p>}
                  {action.stageAnswers && Object.keys(action.stageAnswers).length > 0 && (
                    <div style={{ margin: "6px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                      {Object.entries(action.stageAnswers).map(([key, value]) => (
                        <div key={key} style={{ fontSize: 12, color: TEXT }}>
                          <span style={{ color: MUTED }}>{key}: </span>{value}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <Clock size={12} color={isPast && !action.notifiedAt ? "#F59E0B" : MUTED} />
                    {isEditing ? (
                      <>
                        <input
                          type="date"
                          value={editFollowUpValue}
                          onChange={(e) => setEditFollowUpValue(e.target.value)}
                          style={{ ...inputStyle, width: "auto", padding: "4px 8px" }}
                        />
                        <button type="button" disabled={busy} onClick={() => saveFollowUp(action.id)}
                          style={{ fontSize: 12, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                          {busy ? t.saving : t.save}
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: isPast && !action.notifiedAt ? "#F59E0B" : MUTED }}>
                          {action.followUpAt
                            ? new Date(action.followUpAt).toLocaleDateString(ar ? "ar-EG" : "en-US")
                            : t.none}
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
        )}
      </div>

      <ConfirmationModal
        open={deleteOpen}
        title={t.deleteTitle}
        description={t.deleteDesc}
        confirmLabel={busy ? undefined : t.deleteLead}
        cancelLabel={t.cancel}
        onConfirm={deleteThisLead}
        onCancel={() => setDeleteOpen(false)}
      />

      {pendingStage && (
        <MoveStageModal
          leadId={lead.id}
          stage={pendingStage}
          onClose={() => setPendingStage(null)}
          onMoved={() => { setPendingStage(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
