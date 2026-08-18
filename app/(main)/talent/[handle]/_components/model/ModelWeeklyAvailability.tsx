"use client";

// Real weekly availability strip, driven by talent_profiles.availability
// (the on/off switch) + availability_schedule (dates/exceptions), replacing
// the old hardcoded 7-day mock.
//
// Per-day status only (available/unavailable) — the exact time slots inside
// availability_schedule stay off the public page, consistent with
// lib/availability-schedule.ts's own "never the full calendar" public-summary
// rule (that module is left untouched; this is a local, coarser read of the
// same real data, not a second source of truth).
//
// Day is unavailable when: the general switch isn't "available", or an
// exceptions entry marks that date "unavailable". Otherwise available —
// a date present in `dates` is a confirmed slot, but its absence doesn't
// imply "unavailable" (matches formatAvailabilitySummary's own fallback).

import { Check, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { DAY_KEYS, DAY_LABELS, type AvailabilitySchedule } from "@/lib/availability-schedule";

const GREEN = "#10b981";
const RED = "#f43f5e";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function thisWeekDates(today: Date): { iso: string; dayIndex: number; date: number }[] {
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
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
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  if (!availability) return null;

  const generallyAvailable = availability === "available";
  const unavailableDates = new Set(
    (schedule?.exceptions ?? []).filter((e) => e.type === "unavailable").map((e) => e.date),
  );

  const week = thisWeekDates(new Date()).map(({ iso, dayIndex, date }) => ({
    day: ar ? DAY_LABELS[DAY_KEYS[dayIndex]].short_ar : DAY_LABELS[DAY_KEYS[dayIndex]].short_en,
    date,
    available: generallyAvailable && !unavailableDates.has(iso),
  }));

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>
        {ar ? "التوفر هذا الأسبوع" : "This week's availability"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {week.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
              {d.available ? (ar ? "متاحة" : "Free") : (ar ? "غير متاحة" : "Unavailable")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
