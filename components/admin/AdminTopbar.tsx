"use client";
import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { Menu, Sun, Moon, Globe, Bell, Search } from "lucide-react";

interface Props {
  title: string;
  onMenuClick: () => void;
}

export default function AdminTopbar({ title, onMenuClick }: Props) {
  const { dark, toggleMode, lang, toggleLang } = useSite();
  const [search, setSearch] = useState("");

  const BG     = dark ? "#090e1a" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#0d1527" : "#f1f5f9";
  const ar     = lang === "ar";

  const iconBtn = (onClick: () => void, child: React.ReactNode, tip: string) => (
    <button
      onClick={onClick}
      title={tip}
      style={{
        background: "none", border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: 8, cursor: "pointer", color: MUTED,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {child}
    </button>
  );

  return (
    <header
      style={{
        backgroundColor: BG,
        borderBottom: `1px solid ${BORDER}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* ── Left: Menu toggle ── */}
      <button
        onClick={onMenuClick}
        title={ar ? "القائمة" : "Menu"}
        style={{
          background: "none", border: `1px solid ${BORDER}`, borderRadius: 8,
          padding: 8, cursor: "pointer", color: MUTED,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "color 0.15s",
        }}
      >
        <Menu size={20} />
      </button>

      {/* ── Center: Title (flex: 1 pushes right group to edge) ── */}
      <h1 style={{
        color: TEXT, fontSize: 17, fontWeight: 800, margin: 0,
        whiteSpace: "nowrap", flex: 1, textAlign: "center",
      }}>
        {title}
      </h1>

      {/* ── Right: Search + actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: "relative" }} className="admin-search-wrap">
          <Search
            size={15}
            style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              [ar ? "right" : "left"]: 10,
              color: MUTED, pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ar ? "بحث..." : "Search..."}
            style={{
              backgroundColor: INPUT,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: ar ? "8px 32px 8px 12px" : "8px 12px 8px 32px",
              color: TEXT, fontSize: 13, outline: "none",
              width: 200, boxSizing: "border-box",
            }}
          />
        </div>

        {iconBtn(toggleLang, <Globe size={17} />, ar ? "English" : "عربي")}
        {iconBtn(toggleMode, dark ? <Sun size={17} /> : <Moon size={17} />, ar ? "تبديل المظهر" : "Toggle theme")}
        {iconBtn(() => {}, <Bell size={17} />, ar ? "الإشعارات" : "Notifications")}

        {/* <div style={{
          width: 34, height: 34, borderRadius: "50%",
          backgroundColor: "#00D26A22", border: "2px solid #00D26A44",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#00D26A", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0,
        }}>
          A
        </div> */}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .admin-search-wrap { display: none; }
        }
      `}</style>
    </header>
  );
}
