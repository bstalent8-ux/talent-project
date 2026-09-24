"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "@/contexts/SiteContext";

// Language-switch choreography shared by the auth frame and the onboarding
// page: the old copy is wiped away, the language flips while nothing is
// visible, then the new copy is typed back in. The stylesheets key off
// `data-lang-phase` on the page root; keep these two durations in step with
// the `langOut` / `langIn*` animations (auth.module.css, onboarding.module.css).
export const LANG_OUT_MS = 720;
export const LANG_IN_MS = 1150;

export type LangPhase = "idle" | "out" | "in";

export function useLangSwitch() {
  const { toggleLang } = useSite();
  const [phase, setPhase] = useState<LangPhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
