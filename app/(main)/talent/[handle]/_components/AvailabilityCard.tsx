"use client";

// ─── Availability (Model public profile only) ──────────────────────────────
// Sidebar chrome, not a dynamic-renderer section — same category as
// BriefCard/QuestionCard/StickyBookingBar: always mounted directly by
// TalentProfileShell for category === "model", never through the core-key
// pipeline. "availability" is deliberately INLINE in core-keys.ts (its data
// already renders inside ProfileHero as the compact badge); this card reads
// the exact same two real fields a second way, it does not reclassify the
// key or duplicate the pipeline.
//
// Public-safe by construction: only reads `availability` (the on/off
// switch) and `availabilitySchedule.dates` (which dates carry a real saved
// slot). Never reads `.exceptions` or `.timezone` — those stay private.

import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DAY_KEYS,
  DAY_LABELS,
  formatAvailabilitySummary,
  type AvailabilitySchedule,
} from "@/lib/availability-schedule";

interface Props {
  availability?: string | null;
  availabilitySchedule?: AvailabilitySchedule | null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Sun→Sat ISO dates for the week containing today, Sun-first to match DAY_KEYS. */
function currentWeekDates(): string[] {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });
}

export default function AvailabilityCard({ availability, availabilitySchedule }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const ar = lang === "ar";

  // No availability set at all — nothing real to show.
  if (!availability) return null;

  const CARD   = "var(--bg-card)";
  const BORDER = "var(--border-subtle)";
  const TEXT   = "var(--text-primary)";
  const MUTED  = "var(--text-muted)";
  const TEAL   = "var(--color-primary)";

  const isAvailable = availability === "available";
  const schedule = availabilitySchedule ?? null;
  const summary = formatAvailabilitySummary(availability, schedule, lang);
  const weekDates = currentWeekDates();
  const hasAnyRealDates = Object.keys(schedule?.dates ?? {}).length > 0;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? 16 : 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>
        {ar ? "التوفر هذا الأسبوع" : "Availability This Week"}
      </h3>

      {!isAvailable ? (
        <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
          {ar ? "غير متاح حالياً" : "Currently unavailable"}
        </p>
      ) : (
        <>
          {hasAnyRealDates && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginBottom: 12 }}>
              {weekDates.map((iso, i) => {
                const dayKey = DAY_KEYS[i];
                const label = DAY_LABELS[dayKey];
                const dayNum = Number(iso.split("-")[2]);
                const hasSlot = Boolean(schedule?.dates[iso]);
                return (
                  <div key={iso} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                    <span style={{ color: MUTED, fontSize: 10, fontWeight: 700 }}>{ar ? label.short_ar : label.short_en}</span>
                    <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{dayNum}</span>
                    <span
                      aria-label={hasSlot ? (ar ? "متاح" : "Available") : (ar ? "لا توجد بيانات" : "No data")}
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        backgroundColor: hasSlot ? TEAL : "var(--border-subtle)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {summary && (
            <p style={{ color: MUTED, fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>{summary}</p>
          )}
        </>
      )}
    </div>
  );
}
