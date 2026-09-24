"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "@/contexts/SiteContext";

// Language-switch choreography shared by the auth frame, the onboarding page
// and the site navbar: the old copy is wiped away, the language flips while
// nothing is visible, then the new copy is typed back in. The stylesheets key
// off `data-lang-phase` (auth.module.css / onboarding.module.css on their own
// page root; app/globals.css on <html> for the main site) — keep these two
// durations in step with the `langOut` / `langIn*` animations.
export const LANG_OUT_MS = 720;
export const LANG_IN_MS = 1150;

export type LangPhase = "idle" | "out" | "in";

/**
 * `global: true` mirrors the phase onto <html data-lang-phase="…"> so the
 * site-wide rules in globals.css (main content, footer, nav links) can animate
 * without every page wiring it up. The auth / onboarding pages animate their
 * own root instead and leave it off.
 */
export function useLangSwitch({ global = false }: { global?: boolean } = {}) {
  const { toggleLang } = useSite();
  const [phase, setPhase] = useState<LangPhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!global) return;
    const root = document.documentElement;
    if (phase === "idle") root.removeAttribute("data-lang-phase");
    else root.setAttribute("data-lang-phase", phase);
    return () => root.removeAttribute("data-lang-phase");
  }, [global, phase]);

  function switchLang() {
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      toggleLang();
      return;
    }
    setPhase("out");
    timers.current.push(
      setTimeout(() => {
        toggleLang();
        setPhase("in");
      }, LANG_OUT_MS),
      setTimeout(() => setPhase("idle"), LANG_OUT_MS + LANG_IN_MS),
    );
  }

  return { phase, switchLang };
}
