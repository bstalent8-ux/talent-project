"use client";
import { useSite } from "@/contexts/SiteContext";

export default function NotificationLogSkeleton() {
  const { dark } = useSite();
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const PULSE = dark ? "#141b29" : "#F1F5F9";

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ padding: "14px 16px", borderBottom: i < 5 ? `1px solid ${BORDER}` : "none", display: "flex", gap: 16 }}>
          <div style={{ width: 160, height: 14, borderRadius: 4, backgroundColor: PULSE }} />
          <div style={{ width: 220, height: 14, borderRadius: 4, backgroundColor: PULSE }} />
          <div style={{ width: 80, height: 14, borderRadius: 4, backgroundColor: PULSE }} />
        </div>
      ))}
    </div>
  );
}
