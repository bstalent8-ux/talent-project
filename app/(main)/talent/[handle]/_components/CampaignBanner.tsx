"use client";
import { motion } from "framer-motion";
import { TrendingUp, Play, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { CampaignStats, FeaturedCampaign } from "@/features/talent-profile/types";


interface Props {
  campaignStats?: CampaignStats | null;
  featuredCampaign?: FeaturedCampaign | null;
}

export default function CampaignBanner({ campaignStats, featuredCampaign }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const t = {
    featuredCampaign: ar ? "أبرز حملة" : "Featured Campaign",
    featured: ar ? "مميز" : "Featured",
    ctrBefore: ar ? "CTR قبل:" : "CTR before:",
    after: ar ? "بعد:" : "after:",
    growth: ar ? "نمو" : "Growth",
    watch: ar ? "مشاهدة" : "Watch",
    caseStudy: ar ? "دراسة الحالة" : "Case Study",
  };
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const GOLD = "#F4B740";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  if (!campaignStats && !featuredCampaign) return null;
  const stats = campaignStats;
  const campaign = featuredCampaign;

  const statItems = stats ? [
    { value: stats.views, label: ar ? "مشاهدات الحملات" : "Campaign Views" },
    { value: stats.ctr, label: ar ? "نسبة النقر CTR" : "Click Rate CTR" },
    { value: stats.sales_increase, label: ar ? "زيادة المبيعات" : "Sales Increase" },
    { value: stats.repeat, label: ar ? "تكرار التعاون" : "Repeat Clients" },
  ] : [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "2fr 1.3fr",
        gap: 20,
        marginBottom: 24,
      }}
    >
      {/* Stats */}
      <div
        style={{
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 20,
          display: "flex",
          alignItems: "center",
          minHeight: 120,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            width: "100%",
          }}
        >
          {statItems.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <span style={{ color: GREEN, fontSize: 22, fontWeight: 900 }}>{s.value}</span>
              <span style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured campaign */}
      {campaign && <div
        style={{
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: dark ? "#fff" : "#0F172A", fontSize: 14, fontWeight: 700 }}>{t.featuredCampaign}</span>
          <span
            style={{
              backgroundColor: "rgba(244,183,64,0.15)",
              color: GOLD,
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid rgba(244,183,64,0.25)",
            }}
          >
            {t.featured}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            margin: "12px 0",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: "linear-gradient(135deg,#1e3a5f,#0a1520)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Play size={18} color={GREEN} />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span style={{ color: MUTED }}>
                {t.ctrBefore} <strong style={{ color: dark ? "#fff" : "#0F172A" }}>{campaign.ctr_before}</strong>
              </span>
              <span style={{ color: MUTED }}>
                {t.after} <strong style={{ color: GREEN }}>{campaign.ctr_after}</strong>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: GREEN,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <TrendingUp size={13} />{t.growth} {campaign.growth}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(0,210,106,0.1)",
              color: GREEN,
              border: "1px solid rgba(0,210,106,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            <Play size={11} />{t.watch}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              backgroundColor: SURFACE,
              color: MUTED,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            <FileText size={11} />{t.caseStudy}
          </motion.button>
        </div>
      </div>}
    </div>
  );
}
