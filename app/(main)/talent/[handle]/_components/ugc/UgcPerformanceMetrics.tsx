"use client";

// Port of ugc/untitled/components/PerformanceMetrics.tsx's card-grid shell.
// The source cards are hook-rate/watch-rate/CTR/engagement/conversion/
// delivery-time with 7-point sparklines — none of that is tracked anywhere
// in the schema (talent_profiles has no per-video or campaign analytics).
// This renders the same card shell with the numbers Talents actually has:
// rating, review count, completed/total bookings, profile views. No
// sparklines are drawn since there is no real time-series behind them.

import { motion } from "framer-motion";
import { Star, MessageSquare, CheckCircle2, CalendarCheck, Eye, TrendingUp } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData, BookingStats } from "@/features/talent-profile/types";

const VIOLET = "#7C3AED";

interface Props {
  talent: TalentData;
  bookingStats: BookingStats;
}

export default function UgcPerformanceMetrics({ talent, bookingStats }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const TILE = dark ? "#0A121C" : "#F8FAFC";

  const completedPct = bookingStats.total > 0 ? Math.round((bookingStats.completed / bookingStats.total) * 100) : 0;

  const cards = [
    { icon: Star, label: ar ? "متوسط التقييم" : "Average Rating", value: talent.rating > 0 ? talent.rating.toFixed(1) : "—", color: "#F4B740" },
    { icon: MessageSquare, label: ar ? "عدد التقييمات" : "Total Reviews", value: String(talent.reviewCount), color: VIOLET },
    { icon: CheckCircle2, label: ar ? "المشاريع المكتملة" : "Completed Projects", value: String(bookingStats.completed), color: "#10B981" },
    { icon: CalendarCheck, label: ar ? "إجمالي الحجوزات" : "Total Bookings", value: String(bookingStats.total), color: "#3B82F6" },
    { icon: Eye, label: ar ? "مشاهدات الملف" : "Profile Views", value: talent.views, color: "#06B6D4" },
    { icon: TrendingUp, label: ar ? "نسبة الإنجاز" : "Completion Rate", value: `${completedPct}%`, color: "#059669" },
  ];

  const hasAny = talent.rating > 0 || talent.reviewCount > 0 || bookingStats.total > 0;
  if (!hasAny) return null;

  return (
    <section id="ugc-performance" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24 }}>
      <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{ar ? "مؤشرات الأداء" : "Performance Metrics"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ backgroundColor: TILE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
            <c.icon size={15} color={c.color} style={{ marginBottom: 8 }} />
            <div style={{ color: TEXT, fontSize: 20, fontWeight: 900 }}>{c.value}</div>
            <div style={{ color: MUTED, fontSize: 11.5, marginTop: 2 }}>{c.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
