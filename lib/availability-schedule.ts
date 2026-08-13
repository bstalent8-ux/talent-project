// ─── Structured talent availability ─────────────────────────────────────────
// Pure, no JSX, no React — importable from a vitest test.
//
// Storage: talent_profiles.social_links.availability_schedule (existing JSONB
// catch-all, see lib/profile-fields.ts for the sibling key lists). The plain
// talent_profiles.availability column ("available" | "unavailable") stays the
// authoritative on/off switch; this module only adds the structured detail
// shown when it is "available". No new table, no new column.

export type DayKey =
  | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export const DAY_KEYS: DayKey[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

export const DAY_LABELS: Record<DayKey, { ar: string; en: string; short_ar: string; short_en: string }> = {
  sunday:    { ar: "الأحد",     en: "Sunday",    short_ar: "أحد",  short_en: "Sun" },
  monday:    { ar: "الاثنين",   en: "Monday",    short_ar: "اثنين", short_en: "Mon" },
  tuesday:   { ar: "الثلاثاء",  en: "Tuesday",   short_ar: "ثلاثاء", short_en: "Tue" },
  wednesday: { ar: "الأربعاء",  en: "Wednesday", short_ar: "أربعاء", short_en: "Wed" },
  thursday:  { ar: "الخميس",    en: "Thursday",  short_ar: "خميس", short_en: "Thu" },
  friday:    { ar: "الجمعة",    en: "Friday",    short_ar: "جمعة", short_en: "Fri" },
  saturday:  { ar: "السبت",     en: "Saturday",  short_ar: "سبت",  short_en: "Sat" },
};

/** 24h "HH:mm" strings — kept simple, formatted for display only at the edges. */
export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  /** 1 primary slot, optionally a 2nd for a split shift. Max 2, enforced on write. */
  slots: TimeSlot[];
}

export type WeeklySchedule = Record<DayKey, DaySchedule>;

export type ExceptionType = "unavailable" | "custom";

export interface AvailabilityException {
  /** "YYYY-MM-DD" */
  date: string;
  type: ExceptionType;
  /** Only meaningful when type === "custom". */
  slots?: TimeSlot[];
}

export interface AvailabilitySchedule {
  /** IANA zone, e.g. "Africa/Cairo". Null when never set. */
  timezone: string | null;
  weekly: WeeklySchedule;
  exceptions: AvailabilityException[];
}

export function emptyWeeklySchedule(): WeeklySchedule {
  return Object.fromEntries(DAY_KEYS.map((d) => [d, { enabled: false, slots: [] }])) as WeeklySchedule;
}

export function emptyAvailabilitySchedule(timezone: string | null = null): AvailabilitySchedule {
  return { timezone, weekly: emptyWeeklySchedule(), exceptions: [] };
}

function isValidTime(v: unknown): v is string {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

function isValidSlot(v: unknown): v is TimeSlot {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return isValidTime(s.start) && isValidTime(s.end) && s.start < s.end;
}

function parseSlots(raw: unknown, max: number): TimeSlot[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(isValidSlot).slice(0, max) as TimeSlot[];
}

/** Reads whatever is stored in social_links.availability_schedule — tolerant of missing/malformed data. */
export function parseAvailabilitySchedule(raw: unknown): AvailabilitySchedule {
  if (!raw || typeof raw !== "object") return emptyAvailabilitySchedule();
  const r = raw as Record<string, unknown>;

  const weekly = emptyWeeklySchedule();
  const rawWeekly = (r.weekly && typeof r.weekly === "object") ? (r.weekly as Record<string, unknown>) : {};
  for (const day of DAY_KEYS) {
    const d = rawWeekly[day];
    if (d && typeof d === "object") {
      const slots = parseSlots((d as Record<string, unknown>).slots, 2);
      weekly[day] = { enabled: Boolean((d as Record<string, unknown>).enabled) && slots.length > 0, slots };
    }
  }

  const exceptions: AvailabilityException[] = Array.isArray(r.exceptions)
    ? (r.exceptions as unknown[]).flatMap((item): AvailabilityException[] => {
        if (!item || typeof item !== "object") return [];
        const e = item as Record<string, unknown>;
        if (typeof e.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return [];
        if (e.type === "unavailable") return [{ date: e.date, type: "unavailable" as const }];
        if (e.type === "custom") {
          const slots = parseSlots(e.slots, 2);
          if (slots.length === 0) return [];
          return [{ date: e.date, type: "custom" as const, slots }];
        }
        return [];
      })
    : [];

  const timezone = typeof r.timezone === "string" && r.timezone.trim().length > 0 ? r.timezone.trim() : null;

  return { timezone, weekly, exceptions };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "14:00" -> "2 PM", "14:30" -> "2:30 PM", "09:00" -> "9 AM" (EN); returns 24h-with-label for AR. */
function formatClock(time: string, lang: "ar" | "en"): string {
  const [hStr, m] = time.split(":");
  const h = Number(hStr);
  if (lang === "ar") {
    return `${pad2(h)}:${m}`;
  }
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === "00" ? `${h12} ${period}` : `${h12}:${m} ${period}`;
}

function formatTimeRange(start: string, end: string, lang: "ar" | "en"): string {
  const arrow = lang === "ar" ? "–" : "–";
  return `${formatClock(start, lang)} ${arrow} ${formatClock(end, lang)}`;
}

function dayLabel(day: DayKey, lang: "ar" | "en"): string {
  return lang === "ar" ? DAY_LABELS[day].short_ar : DAY_LABELS[day].short_en;
}

/**
 * Compact PUBLIC summary only — never the full schedule, never date
 * exceptions (those are internal scheduling detail, not for public display).
 *
 *   unavailable                                -> "Currently unavailable"
 *   available, no weekly detail set             -> "Available now"
 *   available, one uniform contiguous day-range  -> "Sun–Thu · 10 AM–6 PM"
 *   available, irregular pattern                 -> "Available this week"
 */
export function formatAvailabilitySummary(
  availability: string | null | undefined,
  schedule: AvailabilitySchedule | null | undefined,
  lang: "ar" | "en",
): string | null {
  if (!availability) return null;

  if (availability !== "available") {
    return lang === "ar" ? "غير متاح حالياً" : "Currently unavailable";
  }

  const enabledDays = schedule
    ? DAY_KEYS.filter((d) => schedule.weekly[d].enabled && schedule.weekly[d].slots.length > 0)
    : [];

  if (enabledDays.length === 0) {
    return lang === "ar" ? "متاح الآن" : "Available now";
  }

  const indices = enabledDays.map((d) => DAY_KEYS.indexOf(d));
  const isContiguous = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);

  const firstSlot = schedule!.weekly[enabledDays[0]].slots[0];
  const uniformSlot = enabledDays.every((d) => {
    const slots = schedule!.weekly[d].slots;
    return slots.length === 1 && slots[0].start === firstSlot.start && slots[0].end === firstSlot.end;
  });

  if (isContiguous && uniformSlot) {
    const first = enabledDays[0];
    const last = enabledDays[enabledDays.length - 1];
    const range = first === last ? dayLabel(first, lang) : `${dayLabel(first, lang)}–${dayLabel(last, lang)}`;
    return `${range} · ${formatTimeRange(firstSlot.start, firstSlot.end, lang)}`;
  }

  return lang === "ar" ? "متاح هذا الأسبوع" : "Available this week";
}
