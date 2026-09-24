"use client";
import { useModalClose } from "@/hooks/useModalClose";
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
export default function LeadSettingsPanel({ stages, channels, categories, onClose: onCloseProp, onChanged }: Props) {
  const { closing, close: onClose } = useModalClose(onCloseProp);
  const { dark, lang } = useSite();
  const t = TX[lang];
  const [tab, setTab] = useState<Tab>("stages");

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  const tabs: { key: Tab; label: string }[] = [
    { key: "stages", label: t.stages },
    { key: "channels", label: t.channels },
    { key: "categories", label: t.categories },
  ];

  return (
    <div className="modal-backdrop" data-state={closing ? "closing" : "open"}
      style={{ position: "fixed", inset: 0, zIndex: 80, backgroundColor: "rgba(27,19,16,0.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div className="modal-card"
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
                backgroundColor: tab === key ? "rgba(8,127,131,0.1)" : "transparent",
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
