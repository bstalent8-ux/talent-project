"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, History, List, Settings2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import CandidateSettingsPanel from "./CandidateSettingsPanel";
import CandidateMoveStageModal from "./CandidateMoveStageModal";
import TodayDueButton from "../../leads/_components/TodayDueButton";
import ActivityPanel from "../../leads/_components/ActivityPanel";
import type { CandidateCategoryTerm, CandidateStage } from "@/features/candidates/types";
import type { AdminSearchResult } from "@/features/admin-roles/types";

const TX = {
  ar: {
    title: "المرشحين", all: "الكل", manageStages: "إعدادات المرشحين", dropHint: "سيب المرشح هنا", table: "جدول", board: "المراحل", activity: "سجل النشاط",
    filterAssignee: "المسؤول: الكل", filterCategory: "الكاتيجوري: الكل",
  },
  en: {
    title: "Candidates", all: "All", manageStages: "Candidate settings", dropHint: "Drop candidate here", table: "Table", board: "Stages", activity: "Activity",
    filterAssignee: "Assignee: All", filterCategory: "Category: All",
  },
};

type CandidatesView = "table" | "board" | "activity";

interface Props {
  stage: string;
  view: CandidatesView;
  stages: CandidateStage[];
  categories: CandidateCategoryTerm[];
  category?: string;
  assignedTo?: string;
  children: React.ReactNode;
}

// Mirrors AdminLeadsShell exactly — sidebar/topbar stage tabs (table view
// only), table/board toggle, filter selects, drag-and-drop-onto-a-pill
// stage move. See that file's comments for the reasoning behind each part.
export default function AdminCandidatesShell({ stage, view, stages, categories, category, assignedTo, children }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const [managingStages, setManagingStages] = useState(false);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ candidateId: string; stage: CandidateStage } | null>(null);
  const [assignees, setAssignees] = useState<AdminSearchResult[]>([]);

  useEffect(() => {
    fetch("/api/admin/candidates/assignees?q=")
      .then((r) => r.json())
      .then((d: { admins?: AdminSearchResult[] }) => setAssignees(d.admins ?? []))
      .catch(() => {});
  }, []);

  function hrefFor(overrides: Partial<{ stage: string; view: CandidatesView; category: string; assignedTo: string }>) {
    const next = { stage, view, category, assignedTo, ...overrides };
    const params = new URLSearchParams();
    if (next.stage && next.stage !== "all") params.set("stage", next.stage);
    if (next.view && next.view !== "board") params.set("view", next.view);
    if (next.category) params.set("category", next.category);
    if (next.assignedTo) params.set("assignedTo", next.assignedTo);
    const qs = params.toString();
    return qs ? `/admin/candidates?${qs}` : "/admin/candidates";
  }

  async function handleDrop(candidateId: string, target: CandidateStage) {
    if (target.fields.length > 0) {
      setPendingMove({ candidateId, stage: target });
      return;
    }
    await fetch(`/api/admin/candidates/${candidateId}/stage`, {
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
                border: `1px solid ${stage === "all" ? "#00D26A" : BORDER}`,
                backgroundColor: stage === "all" ? "rgba(0,210,106,0.1)" : "transparent",
                color: stage === "all" ? "#00D26A" : MUTED, fontSize: 13, fontWeight: stage === "all" ? 700 : 400,
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
                    const candidateId = e.dataTransfer.getData("text/plain");
                    if (candidateId) handleDrop(candidateId, s);
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
        ) : view === "board" ? <TodayDueButton module="candidate" /> : <div />}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <Link
              href={hrefFor({ view: "board" })}
              title={t.board}
              style={{
                padding: "7px 12px", display: "flex", alignItems: "center",
                backgroundColor: view === "board" ? "rgba(0,210,106,0.1)" : "transparent",
                color: view === "board" ? "#00D26A" : MUTED, textDecoration: "none",
              }}
            >
              <Columns3 size={15} />
            </Link>
            <Link
              href={hrefFor({ view: "table" })}
              title={t.table}
              style={{
                padding: "7px 12px", display: "flex", alignItems: "center",
                backgroundColor: view === "table" ? "rgba(0,210,106,0.1)" : "transparent",
                color: view === "table" ? "#00D26A" : MUTED, textDecoration: "none",
                borderInlineStart: `1px solid ${BORDER}`,
              }}
            >
              <List size={15} />
            </Link>
            <Link
              href={hrefFor({ view: "activity" })}
              title={t.activity}
              style={{
                padding: "7px 12px", display: "flex", alignItems: "center",
                backgroundColor: view === "activity" ? "rgba(0,210,106,0.1)" : "transparent",
                color: view === "activity" ? "#00D26A" : MUTED, textDecoration: "none",
                borderInlineStart: `1px solid ${BORDER}`,
              }}
            >
              <History size={15} />
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

      {view !== "activity" && (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select
          value={assignedTo ?? ""}
          onChange={(e) => router.push(hrefFor({ assignedTo: e.target.value || undefined }))}
          style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: assignedTo ? TEXT : MUTED, fontSize: 12.5, cursor: "pointer" }}
        >
          <option value="">{t.filterAssignee}</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.fullName ?? a.handle}</option>)}
        </select>
        <select
          value={category ?? ""}
          onChange={(e) => router.push(hrefFor({ category: e.target.value || undefined }))}
          style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: category ? TEXT : MUTED, fontSize: 12.5, cursor: "pointer" }}
        >
          <option value="">{t.filterCategory}</option>
          {categories.map((c) => <option key={c.id} value={c.key}>{lang === "ar" ? c.labelAr : c.labelEn}</option>)}
        </select>
      </div>
      )}

      {view === "activity" ? (
        <ActivityPanel module="candidate" assigneesApiPath="/api/admin/candidates/assignees" recordBasePath="/admin/candidates" />
      ) : children}

      {managingStages && (
        <CandidateSettingsPanel
          stages={stages}
          categories={categories}
          onClose={() => setManagingStages(false)}
          onChanged={() => router.refresh()}
        />
      )}

      {pendingMove && (
        <CandidateMoveStageModal
          candidateId={pendingMove.candidateId}
          stage={pendingMove.stage}
          onClose={() => setPendingMove(null)}
          onMoved={() => { setPendingMove(null); router.refresh(); }}
        />
      )}
    </AdminShell>
  );
}
