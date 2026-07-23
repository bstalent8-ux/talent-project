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

function getTimeBasedMode(): Mode {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "light" : "dark";
}

export function SiteProvider({ children }: { children: ReactNode }) {
  // SSR defaults must match server render to avoid hydration mismatch.
  // useEffect runs after hydration and syncs from localStorage in one silent re-render,
  // no console errors. The blocking <head> script handles CSS/DOM side instantly.
  const [lang, setLangState] = useState<Lang>("ar");
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    const storedLang = localStorage.getItem("site_language") as Lang | null;
    const storedMode = localStorage.getItem("site_theme") as Mode | null;
    const resolvedLang: Lang = storedLang === "ar" || storedLang === "en" ? storedLang : "ar";
    const resolvedMode: Mode =
      storedMode === "dark" || storedMode === "light" ? storedMode : getTimeBasedMode();

    document.documentElement.setAttribute("lang", resolvedLang);
    document.documentElement.setAttribute("dir", resolvedLang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("data-theme", resolvedMode);

    setLangState(resolvedLang);
    setModeState(resolvedMode);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("site_language", l);
    document.documentElement.setAttribute("lang", l);
    document.documentElement.setAttribute("dir", l === "ar" ? "rtl" : "ltr");
  }

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem("site_theme", m);
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
