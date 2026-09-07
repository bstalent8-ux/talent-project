"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import LeadAssigneePicker from "../../leads/_components/LeadAssigneePicker";
import type { ActivityEntry, ActivityModule, ActivityResult } from "@/features/activity/types";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: {
    today: "النهاردة", pickPerson: "فلتر بالاسم...", clearPerson: "إلغاء الفلتر",
    doneTitle: "الاكشنز اللي اتاخدت", dueTitle: "المفروض تتاخد النهاردة",
    noDone: "مفيش اكشنز اتسجلت في اليوم ده", noDue: "مفيش حاجة مستحقة في اليوم ده",
    lead: "ليد", candidate: "مرشح", by: "بواسطة", forPerson: "لـ",
    call: "مكالمة", message: "رسالة", email: "إيميل", meeting: "اجتماع", note: "ملاحظة",
    stageChange: "اتنقل لمرحلة", assigned: "اتعين لـ",
    unnamed: "بدون اسم", none: "—", noAccess: "معندكش صلاحية توصل لأي من الليدز أو المرشحين",
    overdue: "متأخر",
  },
  en: {
    today: "Today", pickPerson: "Filter by name...", clearPerson: "Clear filter",
    doneTitle: "Actions taken", dueTitle: "Due today",
    noDone: "No actions logged this day", noDue: "Nothing due this day",
    lead: "Lead", candidate: "Candidate", by: "by", forPerson: "for",
    call: "Call", message: "Message", email: "Email", meeting: "Meeting", note: "Note",
    stageChange: "Moved to stage", assigned: "Assigned to",
    unnamed: "Unnamed", none: "—", noAccess: "You don't have access to leads or candidates",
    overdue: "overdue",
  },
};

const ACTION_LABEL_KEY: Record<string, "call" | "message" | "email" | "meeting" | "note"> = {
  call: "call", message: "message", email: "email", meeting: "meeting", note: "note",
};

function recordHref(module: ActivityModule, id: string): string {
  return module === "lead" ? `/admin/leads/${id}` : `/admin/candidates/${id}`;
}

interface Props {
  initial: ActivityResult;
  date: string;
  personId?: string;
}

export default function ActivityView({ initial, date, personId }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";

  const [result, setResult] = useState<ActivityResult>(initial);
  const [loading, setLoading] = useState(false);
  const [personName, setPersonName] = useState<string | null>(null);
  const [pickingPerson, setPickingPerson] = useState(false);

  function navigate(nextDate: string, nextPersonId?: string) {
    const params = new URLSearchParams();
    if (nextDate !== todayStr()) params.set("date", nextDate);
    if (nextPersonId) params.set("personId", nextPersonId);
    const qs = params.toString();
    router.push(qs ? `/admin/activity?${qs}` : "/admin/activity");
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function shiftDay(delta: number) {
    const d = new Date(`${date}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    navigate(d.toISOString().slice(0, 10), personId);
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (personId) params.set("personId", personId);
    fetch(`/api/admin/activity?${params.toString()}`)
      .then((r) => r.json())
      .then((d: ActivityResult) => setResult(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date, personId]);

  // Recovers the filtered person's display name after a fresh page load
  // (e.g. a bookmarked/shared ?personId= link) — the picker only sets it
  // directly on selection, so a direct link would otherwise show "…"
  // forever. Any entry matching personId carries their name already.
  useEffect(() => {
    if (!personId) { setPersonName(null); return; }
    const match = [...result.done, ...result.due].find((e) => e.performedBy === personId || e.assignedTo === personId);
    if (match) setPersonName(match.performedBy === personId ? match.performedByName : match.assignedToName);
  }, [personId, result]);

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: "transparent", color: TEXT, fontSize: 13,
  };

  function actionLabel(entry: ActivityEntry): React.ReactNode {
    if (entry.actionType === "stage_change") {
      return <>{t.stageChange} <span style={{ color: entry.stageColor ?? undefined, fontWeight: 700 }}>{ar ? entry.stageLabelAr : entry.stageLabelEn}</span></>;
    }
    if (entry.actionType === "lead_assigned" || entry.actionType === "candidate_assigned") {
      return <>{t.assigned} {entry.assignedToName ?? t.none}</>;
    }
    return t[ACTION_LABEL_KEY[entry.actionType] ?? "note"];
  }

  function renderEntry(entry: ActivityEntry, mode: "done" | "due") {
    const isOverdue = mode === "due" && entry.followUpAt && new Date(entry.followUpAt).getTime() < Date.now() && !entry.notifiedAt;
    return (
      <div key={entry.id} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <div>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: BORDER, color: MUTED, marginInlineEnd: 6 }}>
              {entry.module === "lead" ? t.lead : t.candidate}
            </span>
            <Link href={recordHref(entry.module, entry.recordId)} style={{ fontWeight: 700, color: TEXT, textDecoration: "none" }}>
              {entry.recordName ?? t.unnamed}
            </Link>
          </div>
          <span style={{ color: isOverdue ? "#EF4444" : MUTED, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            {mode === "due" && <Clock size={11} />}
            {mode === "done"
              ? new Date(entry.createdAt).toLocaleTimeString(ar ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
              : entry.followUpAt ? new Date(entry.followUpAt).toLocaleTimeString(ar ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : t.none}
            {isOverdue ? ` · ${t.overdue}` : ""}
          </span>
        </div>
        <div style={{ color: TEXT }}>
          {actionLabel(entry)}
          <span style={{ color: MUTED }}> · {t.by} {entry.performedByName ?? t.none}</span>
          {entry.assignedToName && entry.actionType !== "lead_assigned" && entry.actionType !== "candidate_assigned" && (
            <span style={{ color: MUTED }}> · {t.forPerson} {entry.assignedToName}</span>
          )}
        </div>
        {entry.note && <p style={{ margin: 0, color: TEXT }}>{entry.note}</p>}
      </div>
    );
  }

  if (result.modules.length === 0) {
    return <p style={{ fontSize: 13, color: MUTED }}>{t.noAccess}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 4 }}>
          <button type="button" onClick={() => shiftDay(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}>
            {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => navigate(e.target.value, personId)}
            style={{ ...inputStyle, border: "none", padding: "4px 6px" }}
          />
          <button type="button" onClick={() => shiftDay(1)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}>
            {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        {date !== todayStr() && (
          <button type="button" onClick={() => navigate(todayStr(), personId)}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: MUTED, fontSize: 12.5, cursor: "pointer" }}>
            {t.today}
          </button>
        )}

        {personId ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid var(--color-primary)`, backgroundColor: "rgba(0,210,106,0.1)" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-primary)" }}>{personName ?? "…"}</span>
            <button type="button" onClick={() => navigate(date, undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", display: "flex" }}>
              <X size={14} />
            </button>
          </div>
        ) : pickingPerson ? (
          <div style={{ width: 220 }}>
            <LeadAssigneePicker
              autoFocus
              apiPath="/api/admin/activity/people"
              placeholder={t.pickPerson}
              onPick={(admin: AdminSearchResult | null) => {
                setPickingPerson(false);
                if (admin) { setPersonName(admin.fullName ?? admin.handle); navigate(date, admin.id); }
              }}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setPickingPerson(true)}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: MUTED, fontSize: 12.5, cursor: "pointer" }}>
            {t.pickPerson}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, opacity: loading ? 0.6 : 1 }}>
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.doneTitle} <span style={{ color: MUTED, fontWeight: 400 }}>({result.done.length})</span></h3>
          {result.done.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noDone}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.done.map((e) => renderEntry(e, "done"))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.dueTitle} <span style={{ color: MUTED, fontWeight: 400 }}>({result.due.length})</span></h3>
          {result.due.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noDue}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.due.map((e) => renderEntry(e, "due"))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
