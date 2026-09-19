"use client";

// ─── Insights + Recent Activity ────────────────────────────────────────────
// Two cards built to the approved reference. The contents are FIXED demo text
// shown identically on every UGC profile, by explicit request — no analytics or
// per-event activity log exists behind them (best content type, top industry,
// estimated bookings, "delivered / reviewed / booked / viewed" events).
// Renders as a fragment so the shell can lay both cards out in one grid row.

import {
  Lightbulb, Shapes, Sparkles, CalendarCheck, Target, Play, Star, Calendar, Eye,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const INDIGO = "#5B6CF0";

const INSIGHTS = [
  { icon: Shapes, title: { ar: "أفضل نوع محتوى أداءً", en: "Best performing content type" }, body: { ar: "مراجعات المنتجات (تفاعل أعلى بنسبة 72%)", en: "Product Reviews (72% higher engagement)" } },
  { icon: Sparkles, title: { ar: "أفضل قطاع أداءً", en: "Top performing industry" }, body: { ar: "الجمال والعناية بالبشرة (نسبة نجاح 85%)", en: "Beauty & Skincare (85% success rate)" } },
  { icon: CalendarCheck, title: { ar: "الحجوزات الشهرية المتوقعة", en: "Estimated monthly bookings" }, body: { ar: "3-5 مشاريع", en: "3-5 projects" }, badge: { ar: "طلب عالي", en: "High Demand" } },
  { icon: Target, title: { ar: "حسّن نسبة التطابق", en: "Improve your match score" }, body: { ar: "أضف تنوع أكتر في أساليب المحتوى", en: "Add more variety in content styles" } },
];

const ACTIVITY = [
  { icon: Play, color: "#3B82F6", bg: "#E5EEFE", darkBg: "rgba(59,130,246,0.18)", text: { ar: "تم تسليم 3 فيديوهات لـ TechStore", en: "Delivered 3 videos to TechStore" }, time: { ar: "من يومين", en: "2 days ago" } },
  { icon: Star, color: "#F59E0B", bg: "#FEF1C7", darkBg: "rgba(245,158,11,0.18)", text: { ar: "تقييم جديد من Glow Beauty", en: "New review from Glow Beauty" }, time: { ar: "من 5 أيام", en: "5 days ago" } },
  { icon: Calendar, color: "#6C4DFF", bg: "#ECE8FF", darkBg: "rgba(108,77,255,0.20)", text: { ar: "حجز من BeBold", en: "Booked by BeBold" }, time: { ar: "من أسبوع", en: "1 week ago" } },
  { icon: Eye, color: "#64748B", bg: "#ECEFF4", darkBg: "rgba(148,163,184,0.16)", text: { ar: "شاف الملف Nike", en: "Profile viewed by Nike" }, time: { ar: "من أسبوعين", en: "2 weeks ago" } },
];

export default function UgcInsightsActivity() {
  const { dark, lang } = useSite();
  const L = lang !== "en" ? "ar" : "en";
  const ar = L === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(255,255,255,0.10)" : "#E5E7EB";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const card = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, minWidth: 0 } as const;

  return (
    <>
      <section style={card}>
        <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 18px", display: "flex", alignItems: "center", gap: 9 }}>
          <Lightbulb size={17} color="#F5B301" />{ar ? "رؤى" : "Insights"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {INSIGHTS.map((it) => (
            <div key={it.title.en} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: INDIGO, flexShrink: 0 }}>
                <it.icon size={24} strokeWidth={1.6} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: TEXT, fontSize: 13.5, fontWeight: 700 }}>{it.title[L]}</div>
                <div style={{ color: MUTED, fontSize: 12.5, marginTop: 3 }}>{it.body[L]}</div>
              </div>
              {it.badge && (
                <span style={{ padding: "3px 10px", borderRadius: 6, backgroundColor: dark ? "rgba(34,197,94,0.16)" : "#DCFCE7", color: dark ? "#86EFAC" : "#15803D", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {it.badge[L]}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 18px" }}>{ar ? "آخر النشاط" : "Recent Activity"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {ACTIVITY.map((a) => (
            <div key={a.text.en} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: dark ? a.darkBg : a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <a.icon size={16} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: TEXT, fontSize: 13.5, fontWeight: 600 }}>{a.text[L]}</div>
                <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{a.time[L]}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
