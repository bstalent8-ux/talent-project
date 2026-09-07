"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import StagesTab from "./StagesTab";
import TaxonomyManagerPanel from "./TaxonomyManagerPanel";
import type { LeadStage, LeadTaxonomyTerm } from "@/features/leads/types";

type Tab = "stages" | "channels" | "categories";

const TX = {
  ar: { title: "إعدادات الليدز", close: "إغلاق", stages: "المراحل", channels: "المصدر", categories: "الكاتيجوري" },
  en: { title: "Lead settings", close: "Close", stages: "Stages", channels: "Source", categories: "Category" },
};

interface Props {
  stages: LeadStage[];
  channels: LeadTaxonomyTerm[];
  categories: LeadTaxonomyTerm[];
  onClose: () => void;
  onChanged: () => void;
}

// One modal, three tabs — the pipeline stages manager plus the two
// admin-managed taxonomies (real-world source channel, talent category).
// Replaces the old standalone StageManagerPanel; its body now lives in
// StagesTab so it can sit next to the other two.
export default function LeadSettingsPanel({ stages, channels, categories, onClose, onChanged }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const [tab, setTab] = useState<Tab>("stages");

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";

  const tabs: { key: Tab; label: string }[] = [
    { key: "stages", label: t.stages },
    { key: "channels", label: t.channels },
    { key: "categories", label: t.categories },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 80, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, backgroundColor: CARD, zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>{t.title}</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 16px 0" }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${tab === key ? "var(--color-primary)" : BORDER}`,
                backgroundColor: tab === key ? "rgba(0,210,106,0.1)" : "transparent",
                color: tab === key ? "var(--color-primary)" : MUTED,
                fontSize: 12.5, fontWeight: tab === key ? 700 : 400, cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: 16 }}>
          {tab === "stages" && <StagesTab stages={stages} onChanged={onChanged} />}
          {tab === "channels" && <TaxonomyManagerPanel table="lead_channels" apiPath="/api/admin/leads/channels" terms={channels} onChanged={onChanged} />}
          {tab === "categories" && <TaxonomyManagerPanel table="lead_categories" apiPath="/api/admin/leads/categories" terms={categories} onChanged={onChanged} />}
        </div>
      </div>
    </div>
  );
}
