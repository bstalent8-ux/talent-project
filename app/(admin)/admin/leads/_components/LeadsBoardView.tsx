"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Mail, Phone } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import MoveStageModal from "./MoveStageModal";
import { LeadCallButton, LeadWhatsAppButton } from "./LeadContactActions";
import type { Lead, LeadStage } from "@/features/leads/types";

const TX = {
  ar: { loading: "بيحمل...", noLeads: "مفيش ليدز", unnamed: "بدون اسم" },
  en: { loading: "Loading...", noLeads: "No leads", unnamed: "Unnamed" },
};

// Every stage shows as its own column, all visible on one screen at once —
// no clicking a tab to see what's in another stage. The paginated table
// (LeadsTable) stays available as the other view for when a flat sortable
// list is more useful; this is the default.
interface Props {
  stages: LeadStage[];
  channel?: string;
  category?: string;
  assignedTo?: string;
  actionDate?: string;
  actionPersonId?: string;
}

export default function LeadsBoardView({ stages, channel, category, assignedTo, actionDate, actionPersonId }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const TH = dark ? "#261C18" : "#F1E8D2";

  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ leadId: string; stage: LeadStage } | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (channel) params.set("channel", channel);
    if (category) params.set("category", category);
    if (assignedTo) params.set("assignedTo", assignedTo);
    if (actionDate) params.set("actionDate", actionDate);
    if (actionPersonId) params.set("actionPersonId", actionPersonId);
    const qs = params.toString();
    const res = await fetch(`/api/admin/leads/board${qs ? `?${qs}` : ""}`).catch(() => null);
    const data = await res?.json().catch(() => null) as { leads?: Lead[] } | null;
    setLeads(data?.leads ?? []);
  }
  useEffect(() => { load(); }, [channel, category, assignedTo, actionDate, actionPersonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function moveTo(leadId: string, stage: LeadStage) {
    if (stage.fields.length > 0) {
      setPendingMove({ leadId, stage });
      return;
    }
    // No custom questions — move immediately, no modal in the way.
    await fetch(`/api/admin/leads/${leadId}/stage`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: stage.id }),
    }).catch(() => {});
    load();
    router.refresh();
  }

  if (leads === null) {
    return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>{t.loading}</div>;
  }

  const leadsByStage: Record<string, Lead[]> = {};
  for (const lead of leads) {
    const key = lead.stage?.id ?? "__none__";
    (leadsByStage[key] ??= []).push(lead);
  }

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {stages.map((stage) => {
        const stageLeads = leadsByStage[stage.id] ?? [];
        const isDragOver = dragOverStage === stage.id;
        return (
          <div
            key={stage.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
            onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              if (dragLeadId) moveTo(dragLeadId, stage);
              setDragLeadId(null);
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
              <span style={{ fontSize: 11, color: MUTED, backgroundColor: BORDER, borderRadius: 10, padding: "2px 7px" }}>{stageLeads.length}</span>
            </div>

            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
              {stageLeads.length === 0 && (
                <p style={{ margin: "10px 0", textAlign: "center", fontSize: 11.5, color: MUTED }}>{t.noLeads}</p>
              )}
              {stageLeads.map((lead) => (
                // A plain div, not <Link> — the WhatsApp/call buttons below
                // are themselves <a>/<button> elements, and an <a> can't
                // legally nest inside another <a>. Click-to-navigate instead.
                <div
                  key={lead.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/admin/leads/${lead.id}`); }}
                  draggable
                  onDragStart={() => setDragLeadId(lead.id)}
                  onDragEnd={() => setDragLeadId(null)}
                  style={{
                    display: "block", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: 10, cursor: "grab",
                    opacity: dragLeadId === lead.id ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: TEXT }}>{lead.fullName ?? t.unnamed}</div>
                    {lead.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <LeadWhatsAppButton phone={lead.phone} size={14} />
                        <LeadCallButton phone={lead.phone} size={14} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {lead.phone && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED }}><Phone size={10} />{lead.phone}</span>}
                    {lead.email && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED }}><Mail size={10} />{lead.email}</span>}
                    {lead.socialHandle && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED }}><AtSign size={10} />{lead.socialHandle}</span>}
                  </div>
                  {(lead.channel || lead.category) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {lead.channel && (
                        <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, backgroundColor: BORDER, color: MUTED }}>
                          {lang === "ar" ? lead.channel.labelAr : lead.channel.labelEn}
                        </span>
                      )}
                      {lead.category && (
                        <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, backgroundColor: BORDER, color: MUTED }}>
                          {lang === "ar" ? lead.category.labelAr : lead.category.labelEn}
                        </span>
                      )}
                    </div>
                  )}
                  {lead.assignedToName && (
                    <div style={{ marginTop: 6, fontSize: 10.5, color: MUTED }}>{lead.assignedToName}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {pendingMove && (
        <MoveStageModal
          leadId={pendingMove.leadId}
          stage={pendingMove.stage}
          onClose={() => setPendingMove(null)}
          onMoved={() => { setPendingMove(null); load(); router.refresh(); }}
        />
      )}
    </div>
  );
}
