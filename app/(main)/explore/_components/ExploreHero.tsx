"use client";
import { Search } from "lucide-react";

const GOLD = "#F4B740";

interface TypeTab { key: string; label_ar: string; label_en: string }

interface Props {
  dark: boolean;
  lang: "ar" | "en";
  search: string;
  onSearch: (v: string) => void;
  types: TypeTab[];
  activeType: string;
  onTypeChange: (t: string) => void;
  resultCount: number;
}

export default function ExploreHero({
  dark, lang, search, onSearch,
  types, activeType, onTypeChange, resultCount,
}: Props) {
  const TEXT   = dark ? "#FFFFFF"   : "#0F172A";
  const MUTED  = dark ? "#A8B3C2"   : "#64748B";
  const CARD   = dark ? "#0D1623"   : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN  = "#00D26A";

  const title = lang === "ar" ? "استكشف المواهب" : "Explore Talents";
  const sub   = lang === "ar"
    ? `${resultCount} موهبة متاحة الآن`
    : `${resultCount} talents available`;
  const ph = lang === "ar" ? "ابحث عن موهبة، تخصص، أو اسم..." : "Search by name, specialty...";

  return (
    <section style={{
      backgroundColor: dark ? "#0A121C" : "#FFFFFF",
      borderBottom: `1px solid ${BORDER}`,
      padding: "32px 24px 0",
    }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: TEXT, fontSize: 28, fontWeight: 900, margin: 0 }}>{title}</h1>
          <p style={{ color: MUTED, fontSize: 14, margin: "6px 0 0" }}>{sub}</p>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          backgroundColor: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 14, padding: "12px 18px", marginBottom: 24,
          boxShadow: dark ? "0 0 0 1px rgba(0,210,106,0.05)" : "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <Search size={18} color={MUTED} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={ph}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: TEXT, fontSize: 15, width: "100%",
              fontFamily: "'Cairo',sans-serif",
            }}
          />
          {search && (
            <button onClick={() => onSearch("")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: MUTED, fontSize: 18, lineHeight: 1, padding: 0,
            }}>×</button>
          )}
        </div>

        {/* Type tab pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {types.map(tab => {
            const active = tab.key === activeType;
            const label  = lang === "ar" ? tab.label_ar : tab.label_en;
            return (
              <button
                key={tab.key}
                onClick={() => onTypeChange(tab.key)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "12px 12px 0 0",
                  border: `1px solid ${active ? GREEN : BORDER}`,
                  borderBottom: active ? `1px solid ${dark ? "#0A121C" : "#FFFFFF"}` : `1px solid ${BORDER}`,
                  backgroundColor: active ? (dark ? "rgba(0,210,106,0.12)" : "rgba(0,210,106,0.08)") : "transparent",
                  color: active ? GREEN : MUTED,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                  transition: "all 0.18s",
                  marginBottom: active ? -1 : 0,
                  position: "relative",
                  zIndex: active ? 2 : 1,
                }}
              >
                {label}
                {active && (
                  <span style={{
                    position: "absolute", bottom: -1, left: 0, right: 0,
                    height: 2, backgroundColor: GOLD, borderRadius: "2px 2px 0 0",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
