"use client";
import { useSite } from "@/contexts/SiteContext";

export default function EmailLogSkeleton() {
  const { dark } = useSite();
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const PULSE = dark ? "#322722" : "#F1E8D2";

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
