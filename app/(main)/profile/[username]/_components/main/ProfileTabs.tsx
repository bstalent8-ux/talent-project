"use client";
import { useTheme, TX } from "../ProfileThemeContext";

export default function ProfileTabs({ activeTab, onTabChange }: {
  activeTab: string; onTabChange: (tab: string) => void;
}) {
  const { lang, BORDER, MUTED, GOLD } = useTheme();
  const tx = TX[lang];

  const tabs = [
    { key: "overview",  label: tx.tabOverview },
    { key: "portfolio", label: tx.tabPortfolio },
    { key: "shoots",    label: tx.tabShoots },
    { key: "verified",  label: tx.tabVerified, badge: lang === "ar" ? "جديد" : "New" },
    { key: "reviews",   label: tx.tabReviews },
    { key: "packages",  label: tx.tabPackages },
  ];

  return (
    <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${BORDER}`, marginBottom: "16px", overflowX: "auto" }}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button key={tab.key} onClick={() => onTabChange(tab.key)} style={{
            padding: "10px 16px", border: "none", background: "transparent",
            cursor: "pointer", fontSize: "13px",
            fontWeight: active ? 700 : 500,
            color: active ? GOLD : MUTED,
            borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
            whiteSpace: "nowrap", fontFamily: "'Cairo', sans-serif",
            display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s",
          }}>
            {tab.label}
            {tab.badge && (
              <span style={{ backgroundColor: "#FF6B2B", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: "4px", padding: "1px 5px" }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
