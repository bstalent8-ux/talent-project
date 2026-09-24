"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { ActivityEntry, ActivityModule, ActivityResult } from "@/features/activity/types";

const TX = {
  ar: {
    today: "مواعيد النهاردة", empty: "مفيش حاجة مستحقة النهاردة", loading: "بيحمل...",
    call: "مكالمة", message: "رسالة", email: "إيميل", meeting: "اجتماع", note: "ملاحظة",
    stageChange: "نقل مرحلة", overdue: "متأخر",
  },
  en: {
    today: "Today's follow-ups", empty: "Nothing due today", loading: "Loading...",
    call: "Call", message: "Message", email: "Email", meeting: "Meeting", note: "Note",
    stageChange: "Stage move", overdue: "overdue",
  },
};

const ACTION_LABEL_KEY: Record<string, "call" | "message" | "email" | "meeting" | "note"> = {
  call: "call", message: "message", email: "email", meeting: "meeting", note: "note",
};

interface Props {
  /** Which CRM this instance belongs to — filters the shared activity feed
   *  down to just this module's due items and builds the right record link. */
  module: ActivityModule;
}

// Sits in the board toolbar's otherwise-empty slot (stage pills only render
// in table view). Reuses the same /api/admin/activity feed the Activity Log
// page shows, just today + this module, so there's one source of truth for
// "what's due" instead of a second query path.
export default function TodayDueButton({ module }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  const [open, setOpen] = useState(false);
  const [due, setDue] = useState<ActivityEntry[] | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/admin/activity?date=${today}`)
      .then((r) => r.json())
      .then((d: ActivityResult) => setDue(d.due.filter((e) => e.module === module)))
      .catch(() => setDue([]));
  }, [module]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const count = due?.length ?? 0;
  const recordHref = (id: string) => module === "lead" ? `/admin/leads/${id}` : `/admin/candidates/${id}`;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10,
          border: `1px solid ${count > 0 ? "#F59E0B" : BORDER}`,
          backgroundColor: count > 0 ? "rgba(245,158,11,0.1)" : "transparent",
          color: count > 0 ? "#F59E0B" : MUTED,
          fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}
      >
        <Calendar size={14} />{t.today}
        {due !== null && count > 0 && (
          <span style={{ backgroundColor: "#F59E0B", color: "#fff", borderRadius: 10, fontSize: 10.5, fontWeight: 700, padding: "1px 6px" }}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", insetInlineStart: 0, marginTop: 6, width: 320, maxHeight: 360, overflowY: "auto",
          backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          {due === null ? (
            <p style={{ margin: 0, padding: 14, fontSize: 12.5, color: MUTED }}>{t.loading}</p>
          ) : due.length === 0 ? (
            <p style={{ margin: 0, padding: 14, fontSize: 12.5, color: MUTED }}>{t.empty}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {due.map((entry) => {
                const isOverdue = entry.followUpAt ? new Date(entry.followUpAt).getTime() < Date.now() && !entry.notifiedAt : false;
                const label = entry.actionType === "stage_change" ? t.stageChange : t[ACTION_LABEL_KEY[entry.actionType] ?? "note"];
                return (
                  <Link
                    key={entry.id}
                    href={recordHref(entry.recordId)}
                    onClick={() => setOpen(false)}
                    style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: TEXT }}>{entry.recordName ?? "—"}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: isOverdue ? "#EF4444" : MUTED }}>
                        <Clock size={11} />
                        {entry.followUpAt ? new Date(entry.followUpAt).toLocaleTimeString(ar ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                        {isOverdue ? ` · ${t.overdue}` : ""}
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, color: MUTED }}>{label}{entry.assignedToName ? ` · ${entry.assignedToName}` : ""}</span>
                    {entry.note && <span style={{ fontSize: 11.5, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.note}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
