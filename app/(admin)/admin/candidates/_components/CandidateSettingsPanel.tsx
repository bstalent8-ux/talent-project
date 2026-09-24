"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import CandidateStagesTab from "./CandidateStagesTab";
import CandidateCategoryManagerPanel from "./CandidateCategoryManagerPanel";
import type { CandidateCategoryTerm, CandidateStage } from "@/features/candidates/types";

type Tab = "stages" | "categories";

const TX = {
  ar: { title: "إعدادات المرشحين", close: "إغلاق", stages: "المراحل", categories: "الكاتيجوري" },
  en: { title: "Candidate settings", close: "Close", stages: "Stages", categories: "Category" },
};

interface Props {
  stages: CandidateStage[];
  categories: CandidateCategoryTerm[];
  onClose: () => void;
  onChanged: () => void;
}

export default function CandidateSettingsPanel({ stages, categories, onClose, onChanged }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const [tab, setTab] = useState<Tab>("stages");

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  const tabs: { key: Tab; label: string }[] = [
    { key: "stages", label: t.stages },
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
          {tab === "stages" && <CandidateStagesTab stages={stages} onChanged={onChanged} />}
          {tab === "categories" && <CandidateCategoryManagerPanel terms={categories} onChanged={onChanged} />}
        </div>
      </div>
    </div>
  );
}
