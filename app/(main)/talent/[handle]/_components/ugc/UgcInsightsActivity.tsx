"use client";

// Port of ugc/untitled/components/InsightsAndActivity.tsx. HARDCODED per
// explicit request — "best content type" / "top industry" / "estimated
// bookings" have no real analytics behind them, and per-event activity
// logging (video delivered / booked / profile viewed) isn't tracked
// anywhere in the schema. Kept visible only once the talent has at least
// one review or completed booking, so a brand-new empty profile doesn't
// show fabricated insight cards with nothing behind them.

import { Lightbulb, Sparkles, Activity, TrendingUp, Flame, Video, Star, Calendar, Eye } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const ACCENT = "#16a3a3";

const ACTIVITY = [
  { icon: Video, color: "#3B82F6", bg: "rgba(59,130,246,0.12)", action: { ar: "تم تسليم 3 فيديوهات لصالح TechStore", en: "Delivered 3 videos to TechStore" }, time: { ar: "منذ يومين", en: "2 days ago" } },
  { icon: Star, color: "#F4B740", bg: "rgba(244,183,64,0.12)", action: { ar: "تقييم جديد 5 نجوم من Glow Beauty", en: "New 5-star review from Glow Beauty" }, time: { ar: "منذ 5 أيام", en: "5 days ago" } },
  { icon: Calendar, color: "#10B981", bg: "rgba(16,185,129,0.12)", action: { ar: "حجز جديد مؤكد من BeBold", en: "Booked by BeBold Fitness Wear" }, time: { ar: "منذ أسبوع", en: "1 week ago" } },
  { icon: Eye, color: ACCENT, bg: `${ACCENT}1f`, action: { ar: "زار فريق نايكي الشرق الأوسط الملف الشخصي", en: "Profile viewed by Nike MENA Talent Team" }, time: { ar: "منذ أسبوعين", en: "2 weeks ago" } },
];

export default function UgcInsightsActivity({ show }: { show: boolean }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";

  if (!show) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Lightbulb size={15} color="#F4B740" />{ar ? "رؤى Talents" : "Talents Insights"}
          </h3>
          <span style={{ fontSize: 9.5, padding: "2px 8px", borderRadius: 20, backgroundColor: `${ACCENT}1f`, color: ACCENT, border: `1px solid ${ACCENT}55`, fontWeight: 800 }}>
            AI Powered
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: 14, backgroundColor: dark ? "rgba(99,102,241,0.08)" : "#EEF2FF", border: `1px solid ${dark ? "rgba(99,102,241,0.2)" : "#E0E7FF"}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#4F46E5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={14} />
            </div>
            <div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 800 }}>{ar ? "النوع الأكثر أداءً" : "Best performing content type"}</div>
              <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{ar ? "مراجعات المنتجات (تفاعل أعلى بنسبة 72٪)" : "Product Reviews (72% higher engagement rate)"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: 14, backgroundColor: dark ? "rgba(244,63,94,0.08)" : "#FFF1F2", border: `1px solid ${dark ? "rgba(244,63,94,0.2)" : "#FFE4E6"}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#F43F5E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={14} />
            </div>
            <div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 800 }}>{ar ? "أعلى قطاع مبيعات" : "Top performing industry"}</div>
              <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{ar ? "العناية بالبشرة والتجميل (نسبة نجاح 85٪)" : "Beauty & Skincare (85% campaign success rate)"}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, padding: 12, borderRadius: 14, backgroundColor: dark ? "rgba(16,185,129,0.08)" : "#ECFDF5", border: `1px solid ${dark ? "rgba(16,185,129,0.2)" : "#D1FAE5"}` }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "#10B981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Flame size={14} />
              </div>
              <div>
                <div style={{ color: TEXT, fontSize: 12, fontWeight: 800 }}>{ar ? "الحجوزات الشهرية المقدرة" : "Estimated monthly bookings"}</div>
                <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{ar ? "3 - 5 مشاريع شهرياً" : "3-5 projects / month"}</div>
              </div>
            </div>
            <span style={{ padding: "3px 8px", borderRadius: 20, backgroundColor: "#10B981", color: "#fff", fontSize: 9.5, fontWeight: 800, flexShrink: 0, whiteSpace: "nowrap" }}>
              {ar ? "طلب عالي" : "High Demand"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={15} color="#10B981" />{ar ? "النشاط الأخير" : "Recent Activity"}
          </h3>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: MUTED }}>{ar ? "مباشر" : "Live"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <a.icon size={13} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{ar ? a.action.ar : a.action.en}</p>
                <span style={{ color: MUTED, fontSize: 10, fontWeight: 600 }}>{ar ? a.time.ar : a.time.en}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
