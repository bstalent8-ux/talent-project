// ─── Structured talent availability ─────────────────────────────────────────
// Pure, no JSX, no React — importable from a vitest test.
//
// Storage: talent_profiles.availability_schedule — a dedicated jsonb column
// (supabase/migrations/20260813_talent_availability_schedule.sql). The plain
// talent_profiles.availability column ("available" | "unavailable") stays the
// authoritative on/off switch; this module only adds the structured detail
// shown when it is "available": specific calendar dates with time slots, plus
// a separate date-exceptions list, plus a timezone.

export type DayKey =
  | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

/** Sun-first, matching the calendar grid's column order. */
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

export const MONTH_LABELS: { ar: string; en: string; short_en: string }[] = [
  { ar: "يناير",   en: "January",   short_en: "Jan" },
  { ar: "فبراير",  en: "February",  short_en: "Feb" },
  { ar: "مارس",    en: "March",     short_en: "Mar" },
  { ar: "أبريل",   en: "April",     short_en: "Apr" },
  { ar: "مايو",    en: "May",       short_en: "May" },
  { ar: "يونيو",   en: "June",      short_en: "Jun" },
  { ar: "يوليو",   en: "July",      short_en: "Jul" },
  { ar: "أغسطس",   en: "August",    short_en: "Aug" },
  { ar: "سبتمبر",  en: "September", short_en: "Sep" },
  { ar: "أكتوبر",  en: "October",   short_en: "Oct" },
  { ar: "نوفمبر",  en: "November",  short_en: "Nov" },
  { ar: "ديسمبر",  en: "December",  short_en: "Dec" },
];

/** 24h "HH:mm" strings — kept simple, formatted for display only at the edges. */
export interface TimeSlot {
  start: string;
  end: string;
}

export type ExceptionType = "unavailable" | "custom";

export interface AvailabilityException {
  /** "YYYY-MM-DD" */
  date: string;
  type: ExceptionType;
  /** Only meaningful when type === "custom". */
  slots?: TimeSlot[];
}

/** "YYYY-MM-DD" -> up to 2 time slots that date. Presence in the map = selected on the calendar. */
export type DatesMap = Record<string, TimeSlot[]>;

export interface AvailabilitySchedule {
  /** IANA zone, e.g. "Africa/Cairo". Null when never set. */
  timezone: string | null;
  dates: DatesMap;
  exceptions: AvailabilityException[];
}

export function emptyAvailabilitySchedule(timezone: string | null = null): AvailabilitySchedule {
  return { timezone, dates: {}, exceptions: [] };
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads whatever is stored in talent_profiles.availability_schedule — tolerant of missing/malformed data. */
export function parseAvailabilitySchedule(raw: unknown): AvailabilitySchedule {
  if (!raw || typeof raw !== "object") return emptyAvailabilitySchedule();
  const r = raw as Record<string, unknown>;

  const dates: DatesMap = {};
  const rawDates = (r.dates && typeof r.dates === "object") ? (r.dates as Record<string, unknown>) : {};
  for (const [date, value] of Object.entries(rawDates)) {
    if (!DATE_RE.test(date)) continue;
    const slots = parseSlots(value, 2);
    if (slots.length > 0) dates[date] = slots;
  }

  const exceptions: AvailabilityException[] = Array.isArray(r.exceptions)
    ? (r.exceptions as unknown[]).flatMap((item): AvailabilityException[] => {
        if (!item || typeof item !== "object") return [];
        const e = item as Record<string, unknown>;
        if (typeof e.date !== "string" || !DATE_RE.test(e.date)) return [];
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

  return { timezone, dates, exceptions };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "14:00" -> "2 PM", "14:30" -> "2:30 PM", "09:00" -> "9 AM" (EN); 24h for AR. */
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
  return `${formatClock(start, lang)} – ${formatClock(end, lang)}`;
}

/** "2026-08-16" -> "Aug 16" (en) / "16 أغسطس" (ar). */
function formatMonthDay(date: string, lang: "ar" | "en"): string {
  const [, mStr, dStr] = date.split("-");
  const day = Number(dStr);
  const month = MONTH_LABELS[Number(mStr) - 1];
  return lang === "ar" ? `${day} ${month.ar}` : `${month.short_en} ${day}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Compact PUBLIC summary only — never the full calendar, never date
 * exceptions (those are internal scheduling detail, not for public display).
 *
 *   unavailable                                    -> "Currently unavailable"
 *   available, no dates selected                    -> "Available now"
 *   available, upcoming dates share one time range   -> "Available Aug 16, 18, 20 · 10 AM – 2 PM"
 *   available, upcoming dates are irregular          -> "Available this week"
 */
export function formatAvailabilitySummary(
  availability: string | null | undefined,
  schedule: AvailabilitySchedule | null | undefined,
  lang: "ar" | "en",
  today: string = todayISO(),
): string | null {
  if (!availability) return null;

  if (availability !== "available") {
    return lang === "ar" ? "غير متاح حالياً" : "Currently unavailable";
  }

  const upcoming = schedule
    ? Object.keys(schedule.dates).filter((d) => d >= today).sort()
    : [];

  if (upcoming.length === 0) {
    return lang === "ar" ? "متاح الآن" : "Available now";
  }

  const shown = upcoming.slice(0, 3);
  const firstSlot = schedule!.dates[shown[0]][0];
  const uniformSlot = shown.every((d) => {
    const slots = schedule!.dates[d];
    return slots.length === 1 && slots[0].start === firstSlot.start && slots[0].end === firstSlot.end;
  });

  if (uniformSlot) {
    const dateList = shown.map((d) => formatMonthDay(d, lang)).join(lang === "ar" ? "، " : ", ");
    return lang === "ar"
      ? `متاح ${dateList} · ${formatTimeRange(firstSlot.start, firstSlot.end, lang)}`
      : `Available ${dateList} · ${formatTimeRange(firstSlot.start, firstSlot.end, lang)}`;
  }

  return lang === "ar" ? "متاح هذا الأسبوع" : "Available this week";
}
