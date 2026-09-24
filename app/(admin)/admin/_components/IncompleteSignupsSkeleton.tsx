"use client";
import { useSite } from "@/contexts/SiteContext";
import { ADMIN_LIGHT } from "@/components/admin/adminLightTheme";

export default function IncompleteSignupsSkeleton() {
  const { dark } = useSite();
  const CARD = dark ? "#2B211D" : ADMIN_LIGHT.card;
  const BORDER = dark ? "#3A2E28" : ADMIN_LIGHT.border;
  const PULSE = dark ? "#322722" : ADMIN_LIGHT.tableHead;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginTop: 24 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ padding: "14px 16px", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none", display: "flex", gap: 16 }}>
          <div style={{ width: 160, height: 14, borderRadius: 4, backgroundColor: PULSE }} />
          <div style={{ width: 220, height: 14, borderRadius: 4, backgroundColor: PULSE }} />
          <div style={{ width: 80, height: 14, borderRadius: 4, backgroundColor: PULSE }} />
        </div>
      ))}
    </div>
  );
}
