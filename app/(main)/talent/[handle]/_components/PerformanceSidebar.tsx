"use client";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData, BookingStats } from "@/features/talent-profile/types";
import { Star, MessageSquare, CheckCircle, CalendarCheck } from "lucide-react";

interface Props {
  talent: TalentData;
  bookingStats?: BookingStats;
}

const METRIC_ICONS = [Star, MessageSquare, CheckCircle, CalendarCheck] as const;

export default function PerformanceSidebar({ talent, bookingStats }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";

  const CARD  = dark ? "#2B211D"          : "#FBF7EA";
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";
  const MUTED = dark ? "#A99B8E"          : "#6E5F55";

  const stats = bookingStats ?? { total: 0, completed: 0, pending: 0, cancelled: 0 };
  const completedPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const ratingPct    = Math.round((talent.rating / 5) * 100);

  const metrics = [
    {
      label: ar ? "متوسط التقييم" : "Average Rating",
      value: talent.rating > 0 ? `${talent.rating.toFixed(1)} / 5` : ar ? "—" : "—",
      bar:   ratingPct,
      color: "var(--color-accent-strong)",
    },
    {
      label: ar ? "عدد التقييمات" : "Total Reviews",
      value: String(talent.reviewCount),
      color: "var(--color-primary-text)",
    },
    {
      label: ar ? "المشاريع المكتملة" : "Completed Projects",
      value: String(stats.completed),
      color: "var(--color-primary-text)",
    },
    {
      label: ar ? "إجمالي الحجوزات" : "Total Bookings",
      value: String(stats.total),
      color: "var(--color-secondary-alt)",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 22,
      }}
    >
      <h3
        style={{
          color: dark ? "#fff" : "#2B211D",
          fontSize: 16,
          fontWeight: 800,
          margin: "0 0 18px",
        }}
      >
        {ar ? "ملخص الأداء" : "Performance Summary"}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {metrics.map((m, i) => {
          const Icon = METRIC_ICONS[i];
          const hasBar = "bar" in m;
          return (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Icon size={14} style={{ color: m.color, flexShrink: 0 }} />
                <span style={{ color: MUTED, fontSize: 12 }}>{m.label}</span>
                <span style={{ marginLeft: "auto", color: m.color, fontSize: 13, fontWeight: 800 }}>
                  {m.value}
                </span>
              </div>
              {hasBar && (
                <div
                  style={{
                    height: 6,
                    backgroundColor: dark ? "#231A16" : "#F6F0DD",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.bar}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                    style={{ height: "100%", backgroundColor: m.color, borderRadius: 4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
