"use client";
import { useEffect, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import AdminSidebar, { type SidebarMode } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

interface Props {
  title: string;
  children: React.ReactNode;
}

const STORAGE_KEY = "admin-sidebar-mode";

export default function AdminShell({ title, children }: Props) {
  const { dark } = useSite();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded");

  // Read the saved preference after mount only — localStorage isn't
  // available during edge/server render, and seeding the initial state from
  // it would create a hydration mismatch.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "expanded" || saved === "collapsed" || saved === "hover") {
      setSidebarMode(saved);
    }
  }, []);

  function changeMode(mode: SidebarMode) {
    setSidebarMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  const BG = dark ? "#050B12" : "#F1F5F9";

  // Every admin page routes through this one shell, so a single `zoom` here
  // scales the whole panel at once — text, icons, spacing all together,
  // keeping the existing size hierarchy intact instead of hand-editing
  // dozens of hardcoded fontSize values across every admin component.
  // `height: 100vh` above needs to shrink to match, or the scaled-up content
  // would overflow the (now effectively smaller) viewport.
  // Text across the panel is set with many different explicit fontWeight
  // literals (400/500/600/700...), so there's no single number to bump like
  // there was for font-size. `-webkit-text-stroke` fakes a slightly bolder
  // look uniformly, on top of whatever weight each element already has,
  // without touching every component. Same browser support caveat as `zoom`
  // (Chrome/Edge/Safari, not Firefox).
  return (
    <div dir="ltr" style={{ display: "flex", height: `${100 / 1.15}vh`, overflow: "hidden", backgroundColor: BG, zoom: 1.15, WebkitTextStroke: "0.25px currentColor" }}>
      <AdminSidebar
        open={sidebarOpen}
        mode={sidebarMode}
        onClose={() => setSidebarOpen(false)}
        onModeChange={changeMode}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <AdminTopbar
          title={title}
          onMenuClick={() => {
            if (typeof window !== "undefined" && window.innerWidth <= 900) {
              setSidebarOpen(true);
            } else {
              changeMode(sidebarMode === "collapsed" ? "expanded" : "collapsed");
            }
          }}
        />
        <main style={{ flex: 1, padding: "28px 24px", overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
