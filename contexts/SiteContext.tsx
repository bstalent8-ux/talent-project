"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";
export type Mode = "dark" | "light";

interface SiteContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  dark: boolean;
  toggleLang: () => void;
  toggleMode: () => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

interface SiteProviderProps {
  children: ReactNode;
  // Resolved server-side (app/layout.tsx) from the site_language/site_theme
  // cookies the blocking <head> script writes. Using these — not a fixed
  // "ar"/"dark" — as the initial state means the server HTML and the first
  // client render already agree, so the ~140 components that key their
  // inline styles off dark/lang (not just CSS tokens) don't flash to the
  // wrong language/theme before a client-only useEffect could correct them.
  initialLang?: Lang;
  initialMode?: Mode;
}

export function SiteProvider({ children, initialLang = "ar", initialMode = "dark" }: SiteProviderProps) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [mode, setModeState] = useState<Mode>(initialMode);

  // Safety net only, not the primary source of truth anymore — catches the
  // case where localStorage has a newer value than the cookie did (e.g.
  // changed in another tab, or the cookie write failed/was cleared).
  useEffect(() => {
    const storedLang = localStorage.getItem("site_language") as Lang | null;
    const storedMode = localStorage.getItem("site_theme") as Mode | null;
    const resolvedLang: Lang = storedLang === "ar" || storedLang === "en" ? storedLang : initialLang;
    const resolvedMode: Mode =
      storedMode === "dark" || storedMode === "light" ? storedMode : initialMode;

    if (resolvedLang !== lang || resolvedMode !== mode) {
      document.documentElement.setAttribute("lang", resolvedLang);
      document.documentElement.setAttribute("dir", resolvedLang === "ar" ? "rtl" : "ltr");
      document.documentElement.setAttribute("data-theme", resolvedMode);
      setLangState(resolvedLang);
      setModeState(resolvedMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("site_language", l);
    setCookie("site_language", l);
    document.documentElement.setAttribute("lang", l);
    document.documentElement.setAttribute("dir", l === "ar" ? "rtl" : "ltr");
  }

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem("site_theme", m);
    setCookie("site_theme", m);
    document.documentElement.setAttribute("data-theme", m);
  }

  return (
    <SiteContext.Provider
      value={{
        lang, setLang,
        mode, setMode,
        dark: mode === "dark",
        toggleLang: () => setLang(lang === "ar" ? "en" : "ar"),
        toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside SiteProvider");
  return ctx;
}
