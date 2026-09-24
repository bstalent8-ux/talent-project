"use client";

// Real weekly availability strip, driven by talent_profiles.availability
// (the on/off switch) + availability_schedule (dates/exceptions).
//
// Per-day status only (free / busy) — the exact time slots inside
// availability_schedule stay off the public page, consistent with
// lib/availability-schedule.ts's "never the full calendar" public-summary rule.
//
// A day is busy when: the general switch isn't "available", or an exceptions
// entry marks that date "unavailable". Otherwise free — a date present in
// `dates` is a confirmed slot, but its absence doesn't imply "unavailable".
//
// "View full calendar" reveals the next three weeks in the same per-day form.

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { DAY_KEYS, DAY_LABELS, type AvailabilitySchedule } from "@/lib/availability-schedule";

const GREEN = "var(--color-primary-text)";
const RED = "var(--color-error)";
const GOLD = "var(--color-accent-strong)";
const EXTRA_WEEKS = 3;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function weekDates(today: Date, weekOffset: number): { iso: string; dayIndex: number; date: number }[] {
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7); // Sunday
  return DAY_KEYS.map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      iso: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
      dayIndex: i,
      date: d.getDate(),
    };
  });
}

interface Props {
  availability: string | null | undefined;
  schedule: AvailabilitySchedule | null | undefined;
}

export default function ModelWeeklyAvailability({ availability, schedule }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FBF7EA";
  const BORDER = dark ? "var(--border-subtle)" : "#E6DCC3";
  const TEXT = dark ? "var(--text-primary)" : "#2B211D";
  const MUTED = dark ? "var(--text-muted)" : "#6E5F55";
  const HAIR = dark ? "rgba(255,255,255,0.10)" : "#E6DCC3";
  const [full, setFull] = useState(false);

  if (!availability) return null;

  const generallyAvailable = availability === "available";
  const unavailableDates = new Set(
    (schedule?.exceptions ?? []).filter((e) => e.type === "unavailable").map((e) => e.date),
  );
  const today = new Date();
  const isFree = (iso: string) => generallyAvailable && !unavailableDates.has(iso);

  const week = weekDates(today, 0).map(({ iso, dayIndex, date }) => ({
    day: ar ? DAY_LABELS[DAY_KEYS[dayIndex]].ar : DAY_LABELS[DAY_KEYS[dayIndex]].short_en,
    date,
    available: isFree(iso),
  }));

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 18px" }}>
        {ar ? "التوفر هذا الأسبوع" : "This week's availability"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
        {week.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <span style={{ fontSize: 10.5, color: MUTED, fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap" }}>{d.day}</span>
            <span style={{ fontSize: 14, color: TEXT, fontWeight: 800, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{d.date}</span>
            <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: d.available ? GREEN : RED }}>
              {d.available ? <Check size={13} color="#fff" strokeWidth={3} /> : <X size={13} color="#fff" strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, marginTop: 6, color: d.available ? GREEN : RED, whiteSpace: "nowrap" }}>
              {d.available ? (ar ? "متاحة" : "Free") : (ar ? "مشغولة" : "Busy")}
            </span>
          </div>
        ))}
      </div>

      {full && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${HAIR}`, display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: EXTRA_WEEKS }, (_, w) => weekDates(today, w + 1)).map((days, w) => (
            <div key={w} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
              {days.map((d) => {
                const free = isFree(d.iso);
                return (
                  <div key={d.iso} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, color: TEXT, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.date}</span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: free ? GREEN : RED }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setFull((f) => !f)}
        aria-expanded={full}
        style={{ width: "100%", marginTop: 20, padding: "11px 0", borderRadius: 10, border: `1px solid ${GOLD}`, backgroundColor: "transparent", color: GOLD, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
      >
        {full ? (ar ? "إخفاء التقويم" : "Hide calendar") : (ar ? "عرض التقويم الكامل" : "View full calendar")}
      </button>
    </div>
  );
}
