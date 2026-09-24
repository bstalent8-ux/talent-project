"use client";
import { useSite } from "@/contexts/SiteContext";

export default function PendingMediaSkeleton() {
  const { dark } = useSite();
  const BG = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const BAR = dark ? "#3A2E28" : "#E6DCC6";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ aspectRatio: "4 / 3", backgroundColor: BAR, opacity: 0.6 }} />
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 12, width: "60%", borderRadius: 6, backgroundColor: BAR }} />
            <div style={{ height: 10, width: "40%", borderRadius: 6, backgroundColor: BAR }} />
          </div>
        </div>
      ))}
    </div>
  );
}
