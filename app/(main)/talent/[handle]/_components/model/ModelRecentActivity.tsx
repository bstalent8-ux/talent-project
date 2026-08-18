"use client";

// Port of model/components/RightSidebar.tsx's "Recent Activity" card.
// HARD-CODED — no activity-log table exists for talent pages. See
// CLAUDE.md's model-profile report.

import { Star, Calendar } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const GOLD = "#d89b37";
const GREEN = "#10b981";
const BLUE = "#3b82f6";

export default function ModelRecentActivity({ talentName }: { talentName: string }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  const items = [
    { icon: Star, color: GOLD, title: ar ? "تم إضافة 5 صور جديدة" : "5 new photos added", time: ar ? "منذ ساعتين" : "2h ago" },
    { icon: Calendar, color: GREEN, title: ar ? "تم تحديث التوفر" : "Availability updated", time: ar ? "منذ 5 ساعات" : "5h ago" },
    { icon: Star, color: BLUE, title: ar ? "تم تقييم مشروع L'Oréal Paris" : "L'Oréal Paris project reviewed", time: ar ? "منذ يومين" : "2d ago" },
  ];

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>
        {ar ? `نشاط ${talentName} مؤخراً` : `${talentName}'s recent activity`}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: `${item.color}22`, border: `1px solid ${item.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <item.icon size={13} color={item.color} fill={item.icon === Star ? item.color : "none"} />
            </span>
            <div>
              <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>{item.title}</p>
              <span style={{ color: MUTED, fontSize: 10.5 }}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      <button type="button" style={{ width: "100%", padding: "9px 0", backgroundColor: SURFACE, color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
        {ar ? "عرض كل النشاط" : "View all activity"}
      </button>
    </div>
  );
}
