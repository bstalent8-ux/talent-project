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

  return (
    <div dir="ltr" style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: BG }}>
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
