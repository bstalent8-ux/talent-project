"use client";

// ─── Performance Metrics + Top Content Types ───────────────────────────────
// Two cards side by side, built to the approved reference. The figures here are
// FIXED demo values shown identically on every UGC profile, by explicit request —
// nothing in the schema tracks hook rate, watch rate, CTR, engagement, conversion,
// delivery time or a per-video content-type mix. The real booking/review numbers
// live in UgcPerformanceMetrics ("Booking Track Record") further down the page.

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";

const BLUE = "var(--color-secondary-alt)";

interface Metric {
  label: { ar: string; en: string };
  value: { ar: string; en: string };
  status: { ar: string; en: string };
  statusColor: string;
  color: string;
  points: number[];
}

const EXCELLENT = { ar: "ممتاز", en: "Excellent" };
const VERY_GOOD = { ar: "جيد جداً", en: "Very Good" };

const METRICS: Metric[] = [
  { label: { ar: "معدل الجذب", en: "Hook Rate" }, value: { ar: "72%", en: "72%" }, status: EXCELLENT, statusColor: "var(--color-success)", color: "var(--color-primary-text)", points: [12, 18, 14, 22, 19, 27, 23, 30, 34] },
  { label: { ar: "معدل المشاهدة", en: "Watch Rate" }, value: { ar: "68%", en: "68%" }, status: EXCELLENT, statusColor: "var(--color-success)", color: "var(--color-secondary-alt)", points: [10, 12, 20, 16, 23, 19, 26, 24, 33] },
  { label: { ar: "نسبة النقر CTR", en: "CTR" }, value: { ar: "4.8%", en: "4.8%" }, status: VERY_GOOD, statusColor: "var(--color-success)", color: "var(--color-success)", points: [14, 17, 13, 21, 18, 24, 22, 28, 30] },
  { label: { ar: "معدل التفاعل", en: "Engagement Rate" }, value: { ar: "8.2%", en: "8.2%" }, status: EXCELLENT, statusColor: "var(--color-success)", color: "var(--color-accent-strong)", points: [8, 14, 11, 19, 15, 22, 18, 25, 34] },
  { label: { ar: "معدل التحويل", en: "Conversion Rate" }, value: { ar: "3.1%", en: "3.1%" }, status: VERY_GOOD, statusColor: "var(--color-success)", color: "var(--color-primary-text)", points: [10, 15, 13, 19, 17, 23, 20, 27, 31] },
  { label: { ar: "متوسط وقت التسليم", en: "Avg. Delivery Time" }, value: { ar: "2.1 يوم", en: "2.1 Days" }, status: EXCELLENT, statusColor: BLUE, color: "var(--color-primary-text)", points: [16, 12, 20, 15, 22, 19, 24, 21, 30] },
];

const SLICES = [
  { name: { ar: "مراجعة المنتجات", en: "Product Review" }, pct: 42, color: "var(--color-primary-text)", dot: "var(--color-primary-text)" },
  { name: { ar: "فتح الصناديق", en: "Unboxing" }, pct: 25, color: "var(--color-secondary-alt)", dot: "var(--color-secondary-alt)" },
  { name: { ar: "الشروحات", en: "Tutorial" }, pct: 18, color: "var(--color-success)", dot: "var(--color-success)" },
  { name: { ar: "لايف ستايل", en: "Lifestyle" }, pct: 10, color: "var(--color-accent-strong)", dot: "var(--color-accent-strong)" },
  // The reference draws this slice coral while its legend swatch is grey — kept as is.
  { name: { ar: "أخرى", en: "Others" }, pct: 5, color: "#F0616D", dot: "#D9CFBB" },
];

function Sparkline({ points, color, id }: { points: number[]; color: string; id: string }) {
  const w = 100, h = 40, pad = 4;
  const max = Math.max(...points), min = Math.min(...points);
  const xy = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${h} ${line} ${w - pad},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block", direction: "ltr" }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill={color} vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

export default function UgcPerformanceOverview() {
  const phone = useIsMobile(640);
  const compact = useIsMobile(1024);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const L = ar ? "ar" : "en";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(255,255,255,0.10)" : "#E6DCC3";
  const TEXT = dark ? "#fff" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const TILE_BORDER = dark ? "rgba(255,255,255,0.10)" : "#E9E0CB";
  const [hovered, setHovered] = useState<number | null>(null);

  // Donut: clockwise from 12 o'clock, thick ring, rounded slice ends with a small gap between slices.
  const size = 150, stroke = 26, r = (size - stroke) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const gap = 5;
  let acc = 0;
  const arcs = SLICES.map((s) => {
    const len = (s.pct / 100) * circ;
    const arc = { ...s, dash: `${Math.max(len - gap, 1)} ${circ}`, offset: -(acc / 100) * circ - gap / 2 };
    acc += s.pct;
    return arc;
  });

  return (
    <div id="ugc-performance" style={{ display: "grid", gridTemplateColumns: compact ? "minmax(0,1fr)" : "minmax(0,2.25fr) minmax(0,1fr)", gap: 20, alignItems: "stretch" }}>
      <section style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: phone ? 16 : 22, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, border: `1.6px solid ${BLUE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={12} color={BLUE} strokeWidth={3} />
          </span>
          <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>{ar ? "مؤشرات الأداء" : "Performance Metrics"}</h2>
          <span style={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>{ar ? "(آخر 90 يوم)" : "(Last 90 Days)"}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${phone ? 2 : compact ? 3 : 6}, minmax(0, 1fr))`, gap: 12 }}>
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label.en}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ border: `1px solid ${TILE_BORDER}`, borderRadius: 12, padding: "14px 12px 10px", textAlign: "center", minWidth: 0, backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#fff" }}
            >
              <div style={{ color: TEXT, fontSize: 12.5, fontWeight: 600 }}>{m.label[L]}</div>
              <div style={{ color: TEXT, fontSize: 22, fontWeight: 800, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{m.value[L]}</div>
              <div style={{ color: m.statusColor, fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>{m.status[L]}</div>
              <div style={{ marginTop: 10 }}><Sparkline points={m.points} color={m.color} id={`ugc-spark-${i}`} /></div>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: phone ? 16 : 22, minWidth: 0 }}>
        <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 18px" }}>{ar ? "أنواع المحتوى الأكثر إنتاجاً" : "Top Content Types"}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: phone ? "center" : "flex-start" }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} aria-hidden="true">
            {arcs.map((s, i) => (
              <circle
                key={s.name.en}
                cx={c} cy={c} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={hovered === i ? stroke + 4 : stroke}
                strokeLinecap="round"
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
                style={{ transition: "stroke-width .2s", cursor: "pointer" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 11 }}>
            {SLICES.map((s, i) => (
              <div key={s.name.en} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 9, color: TEXT, minWidth: 0 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: s.dot, flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name[L]}</span>
                </span>
                <span style={{ color: TEXT, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
