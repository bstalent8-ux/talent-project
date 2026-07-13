"use client";
import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function AdminShell({ title, children }: Props) {
  const { dark } = useSite();
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const BG = dark ? "#050B12" : "#F1F5F9";

  return (
    <div dir="ltr" style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: BG }}>
      <AdminSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <AdminTopbar
          title={title}
          onMenuClick={() => {
            if (typeof window !== "undefined" && window.innerWidth <= 900) {
              setSidebarOpen(true);
            } else {
              setSidebarCollapsed(c => !c);
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
