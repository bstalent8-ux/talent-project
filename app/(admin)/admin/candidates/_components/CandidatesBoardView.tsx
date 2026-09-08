"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Mail, Phone } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import CandidateMoveStageModal from "./CandidateMoveStageModal";
import { LeadCallButton, LeadWhatsAppButton } from "../../leads/_components/LeadContactActions";
import type { Candidate, CandidateStage } from "@/features/candidates/types";

const TX = {
  ar: { loading: "بيحمل...", noCandidates: "مفيش مرشحين", unnamed: "بدون اسم" },
  en: { loading: "Loading...", noCandidates: "No candidates", unnamed: "Unnamed" },
};

interface Props {
  stages: CandidateStage[];
  category?: string;
  assignedTo?: string;
  actionDate?: string;
  actionPersonId?: string;
}

export default function CandidatesBoardView({ stages, category, assignedTo, actionDate, actionPersonId }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ candidateId: string; stage: CandidateStage } | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (assignedTo) params.set("assignedTo", assignedTo);
    if (actionDate) params.set("actionDate", actionDate);
    if (actionPersonId) params.set("actionPersonId", actionPersonId);
    const qs = params.toString();
    const res = await fetch(`/api/admin/candidates/board${qs ? `?${qs}` : ""}`).catch(() => null);
    const data = await res?.json().catch(() => null) as { candidates?: Candidate[] } | null;
    setCandidates(data?.candidates ?? []);
  }
  useEffect(() => { load(); }, [category, assignedTo, actionDate, actionPersonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function moveTo(candidateId: string, stage: CandidateStage) {
    if (stage.fields.length > 0) {
      setPendingMove({ candidateId, stage });
      return;
    }
    await fetch(`/api/admin/candidates/${candidateId}/stage`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: stage.id }),
    }).catch(() => {});
    load();
    router.refresh();
  }

  if (candidates === null) {
    return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>{t.loading}</div>;
  }

  const byStage: Record<string, Candidate[]> = {};
  for (const c of candidates) {
    const key = c.stage?.id ?? "__none__";
    (byStage[key] ??= []).push(c);
  }

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {stages.map((stage) => {
        const stageCandidates = byStage[stage.id] ?? [];
        const isDragOver = dragOverStage === stage.id;
        return (
          <div
            key={stage.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
            onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              if (dragId) moveTo(dragId, stage);
              setDragId(null);
            }}
            style={{
              flex: "0 0 260px", display: "flex", flexDirection: "column",
              backgroundColor: isDragOver ? `${stage.color}11` : TH,
              border: `1px solid ${isDragOver ? stage.color : BORDER}`,
              borderRadius: 12, maxHeight: "calc(100vh - 260px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: stage.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: TEXT, flex: 1 }}>{lang === "ar" ? stage.labelAr : stage.labelEn}</span>
              <span style={{ fontSize: 11, color: MUTED, backgroundColor: BORDER, borderRadius: 10, padding: "2px 7px" }}>{stageCandidates.length}</span>
            </div>

            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
              {stageCandidates.length === 0 && (
                <p style={{ margin: "10px 0", textAlign: "center", fontSize: 11.5, color: MUTED }}>{t.noCandidates}</p>
              )}
              {stageCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/candidates/${candidate.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/admin/candidates/${candidate.id}`); }}
                  draggable
                  onDragStart={() => setDragId(candidate.id)}
                  onDragEnd={() => setDragId(null)}
                  style={{
                    display: "block", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: 10, cursor: "grab",
                    opacity: dragId === candidate.id ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: TEXT }}>{candidate.fullName ?? t.unnamed}</div>
                    {candidate.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <LeadWhatsAppButton phone={candidate.phone} size={14} />
                        <LeadCallButton phone={candidate.phone} size={14} />
                      </div>
                    )}
                  </div>
                  {candidate.jobTitle && <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{candidate.jobTitle}</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {candidate.phone && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED }}><Phone size={10} />{candidate.phone}</span>}
                    {candidate.email && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED }}><Mail size={10} />{candidate.email}</span>}
                    {candidate.socialHandle && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED }}><AtSign size={10} />{candidate.socialHandle}</span>}
                  </div>
                  {candidate.category && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, backgroundColor: BORDER, color: MUTED }}>
                        {lang === "ar" ? candidate.category.labelAr : candidate.category.labelEn}
                      </span>
                    </div>
                  )}
                  {candidate.assignedToName && (
                    <div style={{ marginTop: 6, fontSize: 10.5, color: MUTED }}>{candidate.assignedToName}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {pendingMove && (
        <CandidateMoveStageModal
          candidateId={pendingMove.candidateId}
          stage={pendingMove.stage}
          onClose={() => setPendingMove(null)}
          onMoved={() => { setPendingMove(null); load(); router.refresh(); }}
        />
      )}
    </div>
  );
}
