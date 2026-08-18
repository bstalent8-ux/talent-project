"use client";

// Port of model/components/RightSidebar.tsx's Weekly Availability strip.
// HARD-CODED — availability_schedule only stores time slots per date, not a
// per-day available/booked/limited status, so this is a visual mock, not a
// real calendar. See CLAUDE.md's model-profile report.

import { Check, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const GOLD = "#d89b37";
const GREEN = "#10b981";
const RED = "#f43f5e";

const WEEK_AR = [
  { day: "السبت", date: 17, available: true },
  { day: "الجمعة", date: 16, available: false },
  { day: "الخميس", date: 15, available: true },
  { day: "الأربعاء", date: 14, available: true },
  { day: "الثلاثاء", date: 13, available: true },
  { day: "الاثنين", date: 12, available: false },
  { day: "الأحد", date: 11, available: true },
];
const WEEK_EN = [
  { day: "Sat", date: 17, available: true },
  { day: "Fri", date: 16, available: false },
  { day: "Thu", date: 15, available: true },
  { day: "Wed", date: 14, available: true },
  { day: "Tue", date: 13, available: true },
  { day: "Mon", date: 12, available: false },
  { day: "Sun", date: 11, available: true },
];

export default function ModelWeeklyAvailability() {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const week = ar ? WEEK_AR : WEEK_EN;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>
        {ar ? "التوفر هذا الأسبوع" : "This week's availability"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 14 }}>
        {week.map((d) => (
          <div key={d.day + d.date} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: MUTED, fontWeight: 600, marginBottom: 2 }}>{d.day}</span>
            <span style={{ fontSize: 12, color: TEXT, fontWeight: 800, marginBottom: 6 }}>{d.date}</span>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: d.available ? "rgba(16,185,129,0.14)" : "rgba(244,63,94,0.12)",
              border: `1px solid ${d.available ? GREEN : RED}66`,
            }}>
              {d.available ? <Check size={11} color={GREEN} /> : <X size={11} color={RED} />}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4, color: d.available ? GREEN : RED }}>
              {d.available ? (ar ? "متاحة" : "Free") : (ar ? "مشغولة" : "Booked")}
            </span>
          </div>
        ))}
      </div>

      <button type="button" style={{ width: "100%", padding: "9px 0", backgroundColor: SURFACE, color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
        {ar ? "عرض التقويم الكامل" : "View full calendar"}
      </button>
    </div>
  );
}
