"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, List, Settings2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import CustomSelect from "@/components/ui/CustomSelect";
import LeadSettingsPanel from "./LeadSettingsPanel";
import MoveStageModal from "./MoveStageModal";
import TodayDueButton from "./TodayDueButton";
import type { LeadStage, LeadTaxonomyTerm } from "@/features/leads/types";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: {
    title: "العملاء المحتملين", all: "الكل", manageStages: "إعدادات الليدز", dropHint: "سيب الليد هنا", table: "جدول", board: "المراحل",
    filterAssignee: "المسؤول: الكل", filterChannel: "المصدر: الكل", filterCategory: "الكاتيجوري: الكل",
    filterActionPerson: "بواسطة: الكل", filterActionDate: "التاريخ",
  },
  en: {
    title: "Leads", all: "All", manageStages: "Lead settings", dropHint: "Drop lead here", table: "Table", board: "Stages",
    filterAssignee: "Assignee: All", filterChannel: "Source: All", filterCategory: "Category: All",
    filterActionPerson: "Action by: All", filterActionDate: "Date",
  },
};

type LeadsView = "table" | "board";

interface Props {
  stage: string;
  view: LeadsView;
  stages: LeadStage[];
  channels: LeadTaxonomyTerm[];
  categories: LeadTaxonomyTerm[];
  channel?: string;
  category?: string;
  assignedTo?: string;
  /** Who logged an action, and on what day — filters which leads show up
   *  in both board and table (a lead needs a matching lead_actions row),
   *  distinct from `assignedTo` (who currently owns the lead). */
  actionDate?: string;
  actionPersonId?: string;
  children: React.ReactNode;
}

// Sidebar + topbar + stage tabs (table view only — the board already shows
// every stage as its own column, so a filter tab would be redundant there)
// + table/board toggle. In table view, the tabs double as drag-and-drop
// targets: dragging a row onto a tab moves that lead onto this stage —
// same move-stage flow the board's column drop uses, see MoveStageModal.
export default function AdminLeadsShell({ stage, view, stages, channels, categories, channel, category, assignedTo, actionDate, actionPersonId, children }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const [managingStages, setManagingStages] = useState(false);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ leadId: string; stage: LeadStage } | null>(null);
  const [assignees, setAssignees] = useState<AdminSearchResult[]>([]);

  useEffect(() => {
    fetch("/api/admin/leads/assignees?q=")
      .then((r) => r.json())
      .then((d: { admins?: AdminSearchResult[] }) => setAssignees(d.admins ?? []))
      .catch(() => {});
  }, []);

  // Every stage-pill/view-toggle/filter-select link goes through this one
  // builder so none of them accidentally drop another active filter.
  function hrefFor(overrides: Partial<{ stage: string; view: LeadsView; channel: string; category: string; assignedTo: string; actionDate: string; actionPersonId: string }>) {
    const next = { stage, view, channel, category, assignedTo, actionDate, actionPersonId, ...overrides };
    const params = new URLSearchParams();
    if (next.stage && next.stage !== "all") params.set("stage", next.stage);
    if (next.view && next.view !== "board") params.set("view", next.view);
    if (next.channel) params.set("channel", next.channel);
    if (next.category) params.set("category", next.category);
    if (next.assignedTo) params.set("assignedTo", next.assignedTo);
    if (next.actionDate) params.set("actionDate", next.actionDate);
    if (next.actionPersonId) params.set("actionPersonId", next.actionPersonId);
    const qs = params.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  }

  async function handleDrop(leadId: string, target: LeadStage) {
    if (target.fields.length > 0) {
      setPendingMove({ leadId, stage: target });
      return;
    }
    await fetch(`/api/admin/leads/${leadId}/stage`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: target.id }),
    }).catch(() => {});
    router.refresh();
  }

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {view === "table" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={hrefFor({ stage: "all" })}
              style={{
                padding: "7px 16px", borderRadius: 20,
                border: `1px solid ${stage === "all" ? "#087F83" : BORDER}`,
                backgroundColor: stage === "all" ? "rgba(8,127,131,0.1)" : "transparent",
                color: stage === "all" ? "#087F83" : MUTED, fontSize: 13, fontWeight: stage === "all" ? 700 : 400,
                textDecoration: "none",
              }}
            >
              {t.all}
            </Link>
            {stages.map((s) => {
              const active = stage === s.key;
              const isDragOver = dragOverStageId === s.id;
              return (
                <Link
                  key={s.id}
                  href={hrefFor({ stage: s.key })}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStageId(s.id); }}
                  onDragLeave={() => setDragOverStageId((cur) => (cur === s.id ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverStageId(null);
                    const leadId = e.dataTransfer.getData("text/plain");
                    if (leadId) handleDrop(leadId, s);
                  }}
                  title={isDragOver ? t.dropHint : undefined}
                  style={{
                    padding: "7px 16px", borderRadius: 20,
                    border: `1px solid ${isDragOver ? s.color : active ? s.color : BORDER}`,
                    backgroundColor: isDragOver ? `${s.color}33` : active ? `${s.color}22` : "transparent",
                    color: active || isDragOver ? s.color : MUTED, fontSize: 13, fontWeight: active ? 700 : 400,
                    textDecoration: "none", transition: "background-color 0.1s, border-color 0.1s",
                  }}
                >
                  {lang === "ar" ? s.labelAr : s.labelEn}
                </Link>
              );
            })}
          </div>
        ) : <TodayDueButton module="lead" />}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <Link
              href={hrefFor({ view: "board" })}
              title={t.board}
              style={{
                padding: "7px 12px", display: "flex", alignItems: "center",
                backgroundColor: view === "board" ? "rgba(8,127,131,0.1)" : "transparent",
                color: view === "board" ? "#087F83" : MUTED, textDecoration: "none",
              }}
            >
              <Columns3 size={15} />
            </Link>
            <Link
              href={hrefFor({ view: "table" })}
              title={t.table}
              style={{
                padding: "7px 12px", display: "flex", alignItems: "center",
                backgroundColor: view === "table" ? "rgba(8,127,131,0.1)" : "transparent",
                color: view === "table" ? "#087F83" : MUTED, textDecoration: "none",
                borderInlineStart: `1px solid ${BORDER}`,
              }}
            >
              <List size={15} />
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setManagingStages(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10,
              border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: MUTED,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Settings2 size={14} />{t.manageStages}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <CustomSelect
          size="sm"
          value={assignedTo ?? ""}
          onChange={(v) => router.push(hrefFor({ assignedTo: v || undefined }))}
          style={{ width: "auto", minWidth: 150 }}
          colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
          options={[
            { value: "", label: t.filterAssignee },
            ...assignees.map((a) => ({ value: a.id, label: a.fullName ?? a.handle })),
          ]}
        />
        <CustomSelect
          size="sm"
          value={channel ?? ""}
          onChange={(v) => router.push(hrefFor({ channel: v || undefined }))}
          style={{ width: "auto", minWidth: 150 }}
          colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
          options={[
            { value: "", label: t.filterChannel },
            ...channels.map((c) => ({ value: c.key, label: lang === "ar" ? c.labelAr : c.labelEn })),
          ]}
        />
        <CustomSelect
          size="sm"
          value={category ?? ""}
          onChange={(v) => router.push(hrefFor({ category: v || undefined }))}
          style={{ width: "auto", minWidth: 150 }}
          colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
          options={[
            { value: "", label: t.filterCategory },
            ...categories.map((c) => ({ value: c.key, label: lang === "ar" ? c.labelAr : c.labelEn })),
          ]}
        />

        {/* Who logged an action + on what day — narrows the board/table to
         *  leads with a matching lead_actions row. Kept separate from the
         *  Assignee select above (that's "who owns the lead"). */}
        <CustomSelect
          size="sm"
          value={actionPersonId ?? ""}
          onChange={(v) => router.push(hrefFor({ actionPersonId: v || undefined }))}
          style={{ width: "auto", minWidth: 150 }}
          colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
          options={[
            { value: "", label: t.filterActionPerson },
            ...assignees.map((a) => ({ value: a.id, label: a.fullName ?? a.handle })),
          ]}
        />
        <input
          type="date"
          value={actionDate ?? ""}
          onChange={(e) => router.push(hrefFor({ actionDate: e.target.value || undefined }))}
          title={t.filterActionDate}
          style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: actionDate ? TEXT : MUTED, fontSize: 12.5, cursor: "pointer" }}
        />
      </div>

      {children}

      {managingStages && (
        <LeadSettingsPanel
          stages={stages}
          channels={channels}
          categories={categories}
          onClose={() => setManagingStages(false)}
          onChanged={() => router.refresh()}
        />
      )}

      {pendingMove && (
        <MoveStageModal
          leadId={pendingMove.leadId}
          stage={pendingMove.stage}
          onClose={() => setPendingMove(null)}
          onMoved={() => { setPendingMove(null); router.refresh(); }}
        />
      )}
    </AdminShell>
  );
}
