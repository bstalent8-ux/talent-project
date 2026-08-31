"use client";
import { Sun, Moon, Languages } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { SectionProps } from "./SettingsClient";

const TX = {
  ar: {
    title: "اللغة والمظهر",
    language: "اللغة", arabic: "العربية", english: "English",
    theme: "المظهر", light: "فاتح", dark: "غامق",
  },
  en: {
    title: "Language & Appearance",
    language: "Language", arabic: "العربية", english: "English",
    theme: "Theme", light: "Light", dark: "Dark",
  },
};

export default function AppearanceSection({ dark }: SectionProps) {
  const { lang, setLang, mode, setMode } = useSite();
  const t = TX[lang];
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN  = "#00D26A";

  const optionBtn = (active: boolean, label: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 20px", borderRadius: 10,
        border: `1px solid ${active ? GREEN : BORDER}`,
        backgroundColor: active ? "rgba(0,210,106,0.1)" : "transparent",
        color: active ? GREEN : TEXT,
        fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: "pointer",
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      }}
    >
      {icon}{label}
    </button>
  );

  return (
    <div>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 20px" }}>{t.title}</h2>

      <div style={{ marginBottom: 24 }}>
        <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <Languages size={14} />{t.language}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {optionBtn(lang === "ar", t.arabic, null, () => setLang("ar"))}
          {optionBtn(lang === "en", t.english, null, () => setLang("en"))}
        </div>
      </div>

      <div>
        <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 10px" }}>{t.theme}</p>
        <div style={{ display: "flex", gap: 10 }}>
          {optionBtn(mode === "light", t.light, <Sun size={15} />, () => setMode("light"))}
          {optionBtn(mode === "dark", t.dark, <Moon size={15} />, () => setMode("dark"))}
        </div>
      </div>
    </div>
  );
}
