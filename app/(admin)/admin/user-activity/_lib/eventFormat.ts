// Shared between UserActivityView.tsx (the flat "recent events" feed) and
// the per-visitor detail page — one place for the event-name label, color,
// and "detail" column text so the two views can never drift apart.

import type { UserEventName, AdminUserEvent } from "@/features/admin/services/admin.service";

export const EVENT_LABEL: Record<"ar" | "en", Record<UserEventName, string>> = {
  ar: {
    page_view: "زيارة صفحة", talent_profile_view: "زيارة بروفايل", search: "بحث",
    booking_brief_sent: "طلب حجز", job_application: "تقديم وظيفة", signup: "تسجيل", login: "دخول",
    page_engagement: "مدة البقاء بالصفحة", click: "نقرة",
  },
  en: {
    page_view: "Page view", talent_profile_view: "Profile view", search: "Search",
    booking_brief_sent: "Booking brief", job_application: "Job application", signup: "Signup", login: "Login",
    page_engagement: "Page engagement", click: "Click",
  },
};

export const EVENT_COLOR: Record<UserEventName, string> = {
  page_view:           "#6E5F55",
  talent_profile_view: "#087F83",
  search:              "#0EA5E9",
  booking_brief_sent:  "#E7A58A",
  job_application:     "#B9694C",
  signup:              "#EC4899",
  login:               "#14B8A6",
  page_engagement:     "#F97316",
  click:               "#22C55E",
};

export function detailFor(e: AdminUserEvent, lang: "ar" | "en"): string {
  const m = e.metadata as Record<string, unknown>;
  if (e.eventName === "page_view" && typeof m.path === "string") return m.path;
  if (e.eventName === "search" && typeof m.query === "string") return `"${m.query}"`;
  if (e.eventName === "signup" && typeof m.role === "string") return m.role;
  if (e.eventName === "login" && typeof m.role === "string") return m.role;
  if (e.eventName === "page_engagement") {
    const parts: string[] = [];
    if (typeof m.path === "string") parts.push(m.path);
    if (typeof m.duration_ms === "number") parts.push(`${(m.duration_ms / 1000).toFixed(1)}s`);
    if (typeof m.render_ms === "number") parts.push(`${lang === "ar" ? "رندر" : "render"} ${m.render_ms}ms`);
    if (typeof m.scrolled === "boolean") {
      parts.push(m.scrolled ? (lang === "ar" ? "عمل سكرول" : "scrolled") : (lang === "ar" ? "من غير سكرول" : "no scroll"));
    }
    return parts.length ? parts.join(" · ") : "—";
  }
  if (e.eventName === "click") {
    const label = typeof m.label === "string" ? m.label : (lang === "ar" ? "عنصر" : "element");
    const path = typeof m.path === "string" ? m.path : "";
    return path ? `"${label}" — ${path}` : `"${label}"`;
  }
  return e.targetType ? `${e.targetType}${e.targetId ? ` · ${e.targetId.slice(0, 8)}` : ""}` : "—";
}
