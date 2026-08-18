"use client";

// Port of model/components/BottomStatsGrid.tsx — 3-col row: compact Reviews
// (REAL, first review), Career Timeline (HARD-CODED — no achievement/
// milestone log table exists), Performance (HARD-CODED — repeat-clients/
// cancellation/on-time/no-show/late-arrival/response rates are not tracked
// anywhere; see CLAUDE.md's model-profile report).

import { Star } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { Review } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

const TIMELINE_AR = [
  { title: "تم الانضمام إلى Talents", date: "يونيو 2026", highlight: true },
  { title: "8 مشاريع مع TechStore", date: "مايو 2026", highlight: false },
  { title: "Glow Beauty Campaign", date: "أبريل 2026", highlight: false },
  { title: "الحصول على Gold Model", date: "مارس 2026", highlight: true },
  { title: "Top Rated Model", date: "فبراير 2026", highlight: true },
];
const TIMELINE_EN = [
  { title: "Joined Talents", date: "Jun 2026", highlight: true },
  { title: "8 projects with TechStore", date: "May 2026", highlight: false },
  { title: "Glow Beauty Campaign", date: "Apr 2026", highlight: false },
  { title: "Earned Gold Model", date: "Mar 2026", highlight: true },
  { title: "Top Rated Model", date: "Feb 2026", highlight: true },
];
const PERF_AR = [
  { label: "عملاء متكررون", value: "82%", pct: 82 },
  { label: "معدل الإلغاء", value: "0%", pct: 0 },
  { label: "تسليم في الموعد", value: "100%", pct: 100 },
  { label: "معدل عدم الحضور", value: "0%", pct: 0 },
  { label: "التأخر عن الموعد", value: "1%", pct: 1 },
  { label: "معدل الاستجابة", value: "98%", pct: 98 },
];
const PERF_EN = [
  { label: "Repeat Clients", value: "82%", pct: 82 },
  { label: "Cancellation Rate", value: "0%", pct: 0 },
  { label: "On-time Delivery", value: "100%", pct: 100 },
  { label: "No Show Rate", value: "0%", pct: 0 },
  { label: "Late Arrival Rate", value: "1%", pct: 1 },
  { label: "Response Rate", value: "98%", pct: 98 },
];

export default function ModelBottomGrid({ reviews, reviewCount }: { reviews: Review[]; reviewCount: number }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const timeline = ar ? TIMELINE_AR : TIMELINE_EN;
  const performance = ar ? PERF_AR : PERF_EN;
  const featured = reviews[0] ?? null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
      <style>{`@media (max-width:900px){.model-bottom-grid{grid-template-columns:1fr !important}}`}</style>
      <div className="model-bottom-grid" style={{ display: "contents" }}>

        {/* Reviews */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: 0 }}>Reviews ({reviewCount})</h3>
            <span style={{ color: GOLD, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>{ar ? "عرض الكل" : "View all"}</span>
          </div>

          {featured ? (
            <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}55`, color: GOLD, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {featured.brand.slice(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: TEXT, fontSize: 11.5, fontWeight: 800 }}>{featured.brand}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <span style={{ color: GOLD, fontSize: 11, fontWeight: 800 }}>{featured.rating.toFixed(1)}</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={9} color={GOLD} fill={i < Math.round(featured.rating) ? GOLD : "none"} />
                      ))}
                    </div>
                  </div>
                </div>
                <span style={{ color: MUTED, fontSize: 10 }}>{featured.date}</span>
              </div>
              <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: 0 }}>&quot;{featured.text}&quot;</p>
            </div>
          ) : (
            <p style={{ color: MUTED, fontSize: 12 }}>{ar ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
          )}
        </div>

        {/* Career Timeline — hardcoded */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: "0 0 14px" }}>{ar ? "المسار المهني" : "Career Timeline"}</h3>
          <div style={{ position: "relative", paddingInlineStart: 16 }}>
            <div style={{ position: "absolute", insetInlineStart: 5, top: 6, bottom: 6, width: 2, backgroundColor: BORDER }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {timeline.map((item, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", insetInlineStart: -16, top: 3, width: 11, height: 11, borderRadius: "50%",
                    backgroundColor: item.highlight ? GOLD : SURFACE,
                    border: `2px solid ${item.highlight ? GOLD : MUTED}`,
                    boxShadow: item.highlight ? `0 0 0 3px ${GOLD}33` : "none",
                  }} />
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{item.title}</span>
                    <span style={{ color: MUTED, fontSize: 10.5, whiteSpace: "nowrap" }}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance — hardcoded */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: "0 0 14px" }}>{ar ? "الأداء" : "Performance"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {performance.map((m) => (
              <div key={m.label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: MUTED, fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: GOLD }} />{m.label}
                  </span>
                  <span style={{ color: TEXT, fontSize: 12, fontWeight: 800 }}>{m.value}</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 999, backgroundColor: SURFACE, overflow: "hidden" }}>
                  <div style={{ width: `${m.pct}%`, height: "100%", borderRadius: 999, backgroundColor: "#10b981" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
