"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData } from "@/features/talent-profile/types";

const TABS_AR = [
  { key: "about",      label: "نبذة عامة",        sectionId: "section-about" },
  { key: "portfolio",  label: "الصور والفيديو",    sectionId: "section-portfolio" },
  { key: "experience", label: "الخبرات",           sectionId: "section-experience" },
  { key: "packages",   label: "الأسعار والباقات",  sectionId: "section-packages" },
  { key: "history",    label: "حقوق الاستخدام",    sectionId: "section-usage" },
];
const TABS_EN = [
  { key: "about",      label: "Overview",          sectionId: "section-about" },
  { key: "portfolio",  label: "Photos & Video",    sectionId: "section-portfolio" },
  { key: "experience", label: "Experience",        sectionId: "section-experience" },
  { key: "packages",   label: "Packages & Prices", sectionId: "section-packages" },
  { key: "history",    label: "Usage Rights",      sectionId: "section-usage" },
];

export default function TabsNavigation({
  talent,
}: {
  talent: TalentData;
  activeTab?: string;
  onTabChange?: (t: string) => void;
}) {
  const { dark, lang } = useSite();
  const TABS = lang === "en" ? TABS_EN : TABS_AR;
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const BG = dark ? "#0A121C" : "#FFFFFF";
  const [active, setActive] = useState("about");
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Sticky detection
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // Scroll spy
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id;
          const tab = TABS.find((t) => t.sectionId === id);
          if (tab) setActive(tab.key);
        }
      },
      { threshold: 0.25, rootMargin: "-80px 0px -40% 0px" }
    );

    observerRef.current = obs;
    TABS.forEach((t) => {
      const el = document.getElementById(t.sectionId);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  function scrollToSection(sectionId: string, key: string) {
    setActive(key);
    const el = document.getElementById(sectionId);
    if (!el) return;
    const navHeight = ref.current?.offsetHeight ?? 64;
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const displayName = talent.name && !talent.name.includes("@")
    ? talent.name
    : talent.handle ?? "";

  return (
    <>
      {/* Sentinel — sits right before the tab bar in normal flow */}
      <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }} />

      <div
        ref={ref}
        style={{
          position: "sticky",
          top: 62,
          zIndex: 40,
          transition: "box-shadow 0.2s",
          boxShadow: isSticky ? "0 4px 24px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <div
          style={{
            backgroundColor: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: isSticky ? "0 0 14px 14px" : 14,
            padding: "0 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 64,
            overflowX: "auto",
          }}
        >
          {/* Mini talent card — shows when sticky */}
          {isSticky && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingRight: 8,
                paddingLeft: 12,
                borderLeft: `1px solid ${BORDER}`,
                marginLeft: 4,
                flexShrink: 0,
                minWidth: 0,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${GREEN}`,
                  flexShrink: 0,
                  background: dark ? "#1a2535" : "#E2E8F0",
                }}
              >
                {talent.avatarUrl ? (
                  <img
                    src={talent.avatarUrl}
                    alt={displayName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: GREEN,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Name */}
              <span
                style={{
                  color: dark ? "#fff" : "#0F172A",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 100,
                }}
              >
                {displayName}
              </span>
            </div>
          )}

          {/* Tabs */}
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => scrollToSection(tab.sectionId, tab.key)}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  color: isActive ? GREEN : MUTED,
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  padding: "0 16px",
                  height: "100%",
                  cursor: "pointer",
                  fontFamily: "'Cairo',sans-serif",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                  outline: "none",
                  flexShrink: 0,
                }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-bar"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 6,
                      right: 6,
                      height: 3,
                      backgroundColor: GREEN,
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
