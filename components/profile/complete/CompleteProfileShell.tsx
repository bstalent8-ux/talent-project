"use client";

// ─── Full-page guided profile completion ───────────────────────────────────
// Dedicated /profile/me/complete flow. Reuses exactly the same step keys,
// field registry, and PATCH /api/profile/complete contract the old modal
// (components/profile/ProfileCompletionCard.tsx) used — only the shell
// changed from a centered modal to a persistent sidebar + full-page layout.
// No new API routes, no new DB columns, no new storage — see lib/profile-fields.ts
// and lib/profile-completion.ts for the canonical sources this reads/writes.

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  User, Briefcase, Ruler, Image as ImageIcon, Link2, CalendarCheck,
  ClipboardCheck, Check, ChevronLeft, ChevronRight, Info, X, Play, History, ShieldCheck,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cdnImage } from "@/lib/images";
import { getWizardSteps, type WizardStepKey } from "@/components/profile/completion-wizard-steps";
import { GENERAL_PHYSICAL_FIELDS, MODEL_PHYSICAL_FIELDS, TALENT_SOCIAL_KEYS, normalizeGender } from "@/lib/profile-fields";
import { fromDbAvailability } from "@/lib/availability-status";
import { calculateCompletion } from "@/lib/profile-completion";
import { uploadToCloudinary, cloudinaryUploadErrorText } from "@/lib/cloudinary-client-upload";
import MediaReviewBadge, { mediaReviewNotice } from "@/components/profile/MediaReviewBadge";
import {
  DAY_KEYS, DAY_LABELS, MONTH_LABELS, parseAvailabilitySchedule,
  type AvailabilitySchedule, type AvailabilityException, type DatesMap, type ExceptionType, type TimeSlot,
} from "@/lib/availability-schedule";
import { resumeStepIndex, stepDone, STEP_COMPLETION_KEYS } from "@/components/profile/complete/resume-step";
import type { CompletionDTO } from "@/features/profiles/types/dto";
import CustomSelect from "@/components/ui/CustomSelect";
import AvatarCropModal from "@/components/profile/AvatarCropModal";

/* ─── translations ───────────────────────────────────────── */
const TX = {
  ar: {
    pageTitle:   "أكمل ملفك",
    back:        "رجوع",
    stepOf:      (i: number, n: number) => `الخطوة ${i} من ${n}`,
    saveDraft:   "حفظ كمسودة",
    saveContinue:"حفظ ومتابعة",
    completeBtn: "إنهاء الملف",
    saving:      "جاري الحفظ...",
    saveError:   "تعذّر الحفظ. حاول مرة أخرى.",
    completion:  "نسبة الاكتمال",
    viewAllSteps:"عرض كل الخطوات",
    hideSteps:   "إخفاء الخطوات",
    done:        "مكتمل",
    tapToAdd:    "اضغط للإضافة",
    uploading:   "جاري الرفع...",
    uploadPhoto: "ارفع صورتك",
    choose:      "اختر صورة",
    labels: {
      fullName: "الاسم الكامل", city: "المدينة", bio: "نبذة عنك",
      bioHint: "اكتب نبذة مختصرة تعرّف بك أمام الشركات...",
      category: "التخصص الأساسي",
      instagram: "إنستقرام", tiktok: "تيك توك", facebook: "فيسبوك",
      youtube: "يوتيوب", linkedin: "لينكد إن", telegram: "تيليجرام",
      website: "الموقع الإلكتروني", other: "أخرى",
      available: "متاح", unavailable: "غير متاح", availability: "حالة الإتاحة",
      eyeColor: "لون العين", chest: "محيط الصدر (سم)", waist: "محيط الخصر (سم)", hip: "محيط الأرداف (سم)",
    },
    steps: {
      basic:        { title: "المعلومات الأساسية", desc: "صورتك واسمك ومدينتك ونبذة مختصرة عنك." },
      physical:      { title: "بياناتك الشخصية", desc: "للموديل: الطول والوزن والمقاسات ولون الشعر والعين. لباقي المواهب: السن واللغات واللهجة." },
      professional: { title: "المعلومات المهنية", desc: "تخصصك، باقاتك، وحقوق الاستخدام الإضافية." },
      portfolio:    { title: "معرض الأعمال", desc: "ارفع صوراً أو مقاطع فيديو تعرض أعمالك." },
      experience:   { title: "مشاريع سابقة", desc: "أضف مشروع أو اتنين اشتغلتهم قبل كده — بيظهروا على بروفايلك بتفاصيلهم." },
      presence:     { title: "الحضور المهني", desc: "روابط حساباتك — تظهر كروابط فقط، بدون تحقق أو متابعين." },
      availability: { title: "حالة الإتاحة", desc: "هل أنت متاح لاستقبال عروض جديدة الآن؟" },
      review:       { title: "المراجعة النهائية", desc: "راجع كل قسم قبل إنهاء ملفك." },
    },
    banners: {
      presence: "لا نتحقق من حسابات التواصل الاجتماعي حالياً. الرابط الذي تضيفه يظهر كرابط فقط — وليس علامة \"موثّق\" أو \"متصل\".",
      physical: "المقاسات تظهر في الملف العام لفئة الموديل فقط. السن واللغات واللهجة تساعد البراندات تختار الأنسب لك.",
      experience: "المشروع بيظهر على طول على بروفايلك. علامة \"موثّق\" لا تظهر إلا لو راجعها أدمن — مش حاجة بتقدر تحطها بنفسك.",
    },
    reviewSections: {
      avatar: "صورة الملف", personal: "الاسم والمدينة", bio: "النبذة الشخصية",
      categories: "التخصص", social: "الحضور المهني", portfolio: "أعمالي",
      physical: "المقاسات", packages: "الباقات والأسعار", usage_addons: "حقوق الاستخدام",
      experience: "مشاريع سابقة", availability: "حالة الإتاحة", payment: "بيانات الدفع",
    },
    notStarted: "لم يبدأ بعد",
    locked: "يفتح قريباً",
    portfolioCaption: "تعليق (اختياري)",
    addPhoto: "إضافة صورة", addVideo: "إضافة فيديو",
    portfolioErrTooBig: "الملف أكبر من 200 ميجا — جرب فيديو أصغر.",
    portfolioErrSave: "اترفع بس ما اتحفظش في البروفايل، جرب تاني.",
    addPackage: "إضافة باقة", addAddon: "إضافة حق استخدام",
    pkgName: "اسم الباقة", pkgPrice: "السعر (جنيه)", pkgFeatures: "المميزات",
    pkgPopular: "الأكثر طلباً", addFeature: "إضافة ميزة",
    addonName: "الاسم", addonPrice: "السعر (جنيه)",
    addProject: "إضافة مشروع",
    expLogo: "لوجو الشركة", expLogoAdd: "إضافة لوجو", expLogoChange: "تغيير", expLogoRemove: "حذف",
    expName: "اسم المشروع / البراند", expDescription: "وصف المشروع",
    expDuration: "مدة التنفيذ", expDeliveredAt: "تاريخ/فترة التسليم", expDeliverable: "اللي اتسلّم",
    expDescriptionHint: "إيه اللي اتعمل في المشروع؟", expDurationHint: "مثلاً: أسبوعين",
    expDeliveredAtHint: "مثلاً: يوليو 2026", expDeliverableHint: "مثلاً: 3 فيديوهات قصيرة",
    expVerified: "موثّق", expEmpty: "لسه معندكش مشاريع مضافة.",
    avail: {
      weeklyTitle: "التقويم",
      weeklyDesc: "اختر تاريخاً واحداً أو أكثر تكون متاحاً خلاله لاستقبال العروض.",
      prevMonth: "الشهر السابق",
      nextMonth: "الشهر التالي",
      selectedHoursTitle: "الساعات المحددة",
      selectedHoursEmpty: "اختر تاريخاً من التقويم لتحديد ساعاته.",
      appliesTo: (n: number) => n === 1 ? "تنطبق هذه الساعات على التاريخ المحدد." : `تنطبق هذه الساعات على ${n} تواريخ محددة.`,
      addSlot: "إضافة فترة زمنية أخرى",
      removeSlot: "حذف الفترة",
      to: "إلى",
      exceptionsTitle: "استثناءات بتواريخ محددة",
      exceptionsDesc: "أضف تاريخاً تكون فيه غير متاح، أو له ساعات مختلفة عن جدولك المعتاد.",
      exceptionsEmpty: "لا توجد استثناءات مضافة.",
      exceptionDate: "التاريخ",
      exceptionType: "النوع",
      exceptionUnavailable: "غير متاح",
      exceptionCustom: "ساعات مخصصة",
      addException: "إضافة استثناء",
      removeException: "حذف",
      timezoneTitle: "المنطقة الزمنية",
      timezoneDesc: "تُستخدم لعرض ساعاتك بالتوقيت الصحيح للعلامات التجارية.",
    },
  },
  en: {
    pageTitle:   "Complete My Profile",
    back:        "Back",
    stepOf:      (i: number, n: number) => `Step ${i} of ${n}`,
    saveDraft:   "Save Draft",
    saveContinue:"Save & Continue",
    completeBtn: "Complete Profile",
    saving:      "Saving...",
    saveError:   "Couldn't save. Please try again.",
    completion:  "Profile Completion",
    viewAllSteps:"View all steps",
    hideSteps:   "Hide steps",
    done:        "Done",
    tapToAdd:    "Tap to add",
    uploading:   "Uploading...",
    uploadPhoto: "Upload your photo",
    choose:      "Choose photo",
    labels: {
      fullName: "Full name", city: "City", bio: "About you",
      bioHint: "Write a short bio that tells brands who you are...",
      category: "Main specialty",
      instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook",
      youtube: "YouTube", linkedin: "LinkedIn", telegram: "Telegram",
      website: "Website", other: "Other",
      available: "Available", unavailable: "Unavailable", availability: "Availability status",
      eyeColor: "Eye Color", chest: "Chest (cm)", waist: "Waist (cm)", hip: "Hip (cm)",
    },
    steps: {
      basic:        { title: "Basic Information", desc: "Your photo, name, city and a short bio." },
      physical:      { title: "Personal details", desc: "Models: height, weight, measurements, hair and eye color. Everyone else: age, languages and dialect." },
      professional: { title: "Professional Details", desc: "Your specialty, packages and usage-rights add-ons." },
      portfolio:    { title: "Portfolio", desc: "Upload photos or videos that showcase your work." },
      experience:   { title: "Previous Projects", desc: "Add one or two projects you've worked on — they show up on your profile with full detail." },
      presence:     { title: "Professional Presence", desc: "Links to your accounts — shown as links only, no follower counts or verification." },
      availability: { title: "Availability", desc: "Are you available to receive new briefs right now?" },
      review:       { title: "Review", desc: "Check every section before you finish." },
    },
    banners: {
      presence: "We don't verify social accounts yet. A link you add is shown as a link only — not a \"Verified\" or \"Connected\" badge.",
      physical: "Measurements only appear on Model-category public profiles. Age, languages and dialect help brands pick the right fit.",
      experience: "A project shows up on your profile right away. The \"Verified\" badge only appears once an admin reviews it — you can't set that yourself.",
    },
    reviewSections: {
      avatar: "Profile photo", personal: "Name & city", bio: "Bio",
      categories: "Specialty", social: "Professional Presence", portfolio: "Portfolio",
      physical: "Measurements", packages: "Packages & Pricing", usage_addons: "Usage Rights",
      experience: "Previous Projects", availability: "Availability", payment: "Payment info",
    },
    notStarted: "Not started",
    locked: "Coming soon",
    portfolioCaption: "Caption (optional)",
    addPhoto: "Add Photo", addVideo: "Add Video",
    portfolioErrTooBig: "That file is over 200MB — try a smaller video.",
    portfolioErrSave: "Uploaded but couldn't save to your profile — try again.",
    addPackage: "Add package", addAddon: "Add usage right",
    pkgName: "Package name", pkgPrice: "Price (EGP)", pkgFeatures: "Features",
    pkgPopular: "Most Popular", addFeature: "Add feature",
    addonName: "Name", addonPrice: "Price (EGP)",
    addProject: "Add project",
    expLogo: "Company logo", expLogoAdd: "Add logo", expLogoChange: "Change", expLogoRemove: "Remove",
    expName: "Project / brand name", expDescription: "Project description",
    expDuration: "Execution duration", expDeliveredAt: "Delivery date/window", expDeliverable: "What was delivered",
    expDescriptionHint: "What did the project involve?", expDurationHint: "e.g. 2 weeks",
    expDeliveredAtHint: "e.g. July 2026", expDeliverableHint: "e.g. 3 short videos",
    expVerified: "Verified", expEmpty: "No projects added yet.",
    avail: {
      weeklyTitle: "Calendar",
      weeklyDesc: "Select one or more dates you're available to receive new offers.",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      selectedHoursTitle: "Selected Hours",
      selectedHoursEmpty: "Pick a date on the calendar to set its hours.",
      appliesTo: (n: number) => n === 1 ? "These hours apply to the selected date." : `These hours apply to ${n} selected dates.`,
      addSlot: "Add another time slot",
      removeSlot: "Remove slot",
      to: "to",
      exceptionsTitle: "Date Exceptions",
      exceptionsDesc: "Add a specific date you're unavailable, or one with different hours than your usual schedule.",
      exceptionsEmpty: "No exceptions added yet.",
      exceptionDate: "Date",
      exceptionType: "Type",
      exceptionUnavailable: "Unavailable",
      exceptionCustom: "Custom hours",
      addException: "Add exception",
      removeException: "Remove",
      timezoneTitle: "Timezone",
      timezoneDesc: "Used to show your hours in the right time for brands.",
    },
  },
};

// Platform-wide restriction: talents are UGC or Model only (matches
// app/(auth)/register/page.tsx's TALENT_TYPES). Existing accounts with a
// legacy category value (actor/photographer/influencer/etc.) simply show
// no active button here until re-picked — their stored category is
// untouched by this list shrinking.
const CATEGORIES = [
  { value: "ugc",   ar: "صانع محتوى UGC", en: "UGC Creator" },
  { value: "model", ar: "موديل",           en: "Model" },
];

/** Icon/emoji per platform — same set the public ProfessionalPresenceSection uses. */
const PRESENCE_FIELDS: { key: string; icon: string }[] = [
  { key: "instagram", icon: "📸" },
  { key: "tiktok",    icon: "🎵" },
  { key: "facebook",  icon: "📘" },
  { key: "youtube",   icon: "▶️" },
  { key: "linkedin",  icon: "💼" },
  { key: "telegram",  icon: "✈️" },
  { key: "website",   icon: "🌐" },
  { key: "other",     icon: "🔗" },
];

const STEP_ICONS: Record<WizardStepKey, React.ComponentType<{ size?: number; color?: string }>> = {
  basic: User, physical: Ruler, professional: Briefcase, portfolio: ImageIcon,
  experience: History, presence: Link2, availability: CalendarCheck, review: ClipboardCheck,
};

// STEP_COMPLETION_KEYS / resumeStepIndex / stepDone live in ./resume-step.ts
// (pure, no JSX — importable from a vitest test without pulling in React).

interface Props {
  profile: any;
  talentProfile: any;
  portfolioItems: any[];
  completion: CompletionDTO | null;
  onUpdate: () => Promise<void> | void;
}

export default function CompleteProfileShell({ profile, talentProfile, portfolioItems, completion, onUpdate }: Props) {
  const { lang, dark } = useSite();
  const t = TX[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // Theme-aware tokens — the current Home Page design system, not the neon
  // green/teal this page's older sibling (ProfileCompletionCard modal) used.
  const TEAL   = "var(--color-primary)";
  const GOLD   = "var(--color-accent)";
  const GREEN  = "var(--color-success)";
  const RED    = "var(--color-error)";
  const TEXT   = "var(--text-primary)";
  const MUTED  = "var(--text-muted)";
  const BORDER = "var(--border-subtle)";
  const CARD   = "var(--bg-card)";
  const SURFACE= "var(--bg-surface)";
  const INP    = "var(--bg-card-muted)";
  const INK    = "var(--color-primary-ink)";

  // Tracks the live in-progress selection, not just the last-saved
  // talentProfile prop — so picking "Model" on the professional step inserts
  // the Measurements step into the sidebar immediately, and a Save & Continue
  // right after does not skip past it waiting for a save+refetch round trip.
  const [category, setCategory] = useState(talentProfile?.category ?? "");
  const steps = useMemo(() => getWizardSteps(category || talentProfile?.category), [category, talentProfile?.category]);

  const [stepIdx, setStepIdx] = useState(0);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Resolve the starting step once: an explicit ?step= wins (deep link from
  // elsewhere in the app), otherwise resume at the first incomplete step per
  // the canonical CompletionDTO — not just "wherever the URL happened to be".
  useEffect(() => {
    const key = searchParams.get("step");
    const idx = key ? steps.indexOf(key as WizardStepKey) : -1;
    setStepIdx(idx >= 0 ? idx : resumeStepIndex(steps, completion?.sections));
    // Mount-only: this page's own nav owns step/URL sync after first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUrl = (idx: number) => router.replace(`${pathname}?step=${steps[idx]}`, { scroll: false });
  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    setStepIdx(clamped);
    setSaveError(null);
    syncUrl(clamped);
    setMobileStepsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── per-step local state (identical shape to the old modal) ── */
  const sl = talentProfile?.social_links ?? {};
  const [personal, setPersonal] = useState({ full_name: profile?.full_name ?? "", city: profile?.city ?? "" });
  const [bio, setBio] = useState(profile?.bio ?? talentProfile?.bio ?? "");
  const [gender, setGender] = useState<string>(normalizeGender(talentProfile?.social_links?.gender) ?? "");
  const [presence, setPresence] = useState<Record<string, string>>(
    Object.fromEntries(TALENT_SOCIAL_KEYS.map((k) => [k, sl[k] ?? ""])),
  );
  const [avail, setAvail] = useState(fromDbAvailability(talentProfile?.availability));
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(() =>
    parseAvailabilitySchedule(talentProfile?.availability_schedule),
  );
  // No stored timezone yet: fill in the browser's detected zone once we're on
  // the client, instead of guessing on the server (which would hydration-
  // mismatch against whatever zone the build/render machine happens to run in).
  useEffect(() => {
    if (schedule.timezone) return;
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setSchedule((s) => (s.timezone ? s : { ...s, timezone: detected }));
    } catch {}
    // Mount-only default fill — user edits to the select own it after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Calendar: multi-select dates, all currently selected dates share the
  // same "Selected Hours" slots (one shared editor below the grid, not a
  // per-date one) — matches the "define hours for selected dates" spec.
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-11
  const todayISO = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const goPrevMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else { setViewMonth((m) => m - 1); }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else { setViewMonth((m) => m + 1); }
  };

  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun..6=Sat
    const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`);
    return cells;
  }, [viewYear, viewMonth]);

  const selectedDates = useMemo(() => Object.keys(schedule.dates).sort(), [schedule.dates]);
  const sharedSlots: TimeSlot[] = selectedDates.length > 0 ? schedule.dates[selectedDates[0]] : [];

  const toggleDate = (dateStr: string) =>
    setSchedule((s) => {
      const next: DatesMap = { ...s.dates };
      if (next[dateStr]) {
        delete next[dateStr];
      } else {
        const existing = Object.values(next)[0];
        next[dateStr] = existing ? existing.map((sl) => ({ ...sl })) : [{ start: "10:00", end: "18:00" }];
      }
      return { ...s, dates: next };
    });
  const setSharedSlotTime = (slotIdx: number, field: "start" | "end", value: string) =>
    setSchedule((s) => {
      const next: DatesMap = {};
      for (const [d, slots] of Object.entries(s.dates)) {
        next[d] = slots.map((sl, i) => (i === slotIdx ? { ...sl, [field]: value } : sl));
      }
      return { ...s, dates: next };
    });
  const addSharedSlot = () =>
    setSchedule((s) => {
      const next: DatesMap = {};
      for (const [d, slots] of Object.entries(s.dates)) {
        next[d] = slots.length >= 2 ? slots : [...slots, { start: "10:00", end: "18:00" }];
      }
      return { ...s, dates: next };
    });
  const removeSharedSlot = (slotIdx: number) =>
    setSchedule((s) => {
      const next: DatesMap = {};
      for (const [d, slots] of Object.entries(s.dates)) {
        const filtered = slots.filter((_, i) => i !== slotIdx);
        if (filtered.length > 0) next[d] = filtered;
      }
      return { ...s, dates: next };
    });

  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionType, setNewExceptionType] = useState<ExceptionType>("unavailable");
  const [newExceptionStart, setNewExceptionStart] = useState("10:00");
  const [newExceptionEnd, setNewExceptionEnd] = useState("18:00");

  const addException = () => {
    if (!newExceptionDate) return;
    const next: AvailabilityException = newExceptionType === "unavailable"
      ? { date: newExceptionDate, type: "unavailable" }
      : { date: newExceptionDate, type: "custom", slots: [{ start: newExceptionStart, end: newExceptionEnd }] };
    setSchedule((s) => ({
      ...s,
      exceptions: [...s.exceptions.filter((e) => e.date !== newExceptionDate), next].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setNewExceptionDate("");
    setNewExceptionType("unavailable");
  };
  const removeException = (date: string) =>
    setSchedule((s) => ({ ...s, exceptions: s.exceptions.filter((e) => e.date !== date) }));

  // Full IANA list from the runtime itself — deterministic across server/client
  // (unlike the *current* zone, this doesn't depend on the machine's local
  // config), so no hydration-mismatch risk computing it at render time.
  const timezoneOptions = useMemo(() => {
    try {
      const zones = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;
      if (zones?.length) return zones;
    } catch {}
    return ["UTC", "Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "Europe/London", "Europe/Berlin", "America/New_York"];
  }, []);
  const [physical, setPhysical] = useState({
    height: sl.height ?? "", weight: sl.weight ?? "", age: sl.age ?? "",
    hair_color: sl.hair_color ?? "", shoe_size: sl.shoe_size ?? "",
    languages: sl.languages ?? "", dialect: sl.dialect ?? "", eye_color: sl.eye_color ?? "",
  });

  const [portfolioMedia, setPortfolioMedia] = useState<any[]>(portfolioItems ?? []);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioCaption, setPortfolioCaption] = useState("");
  const [portfolioError, setPortfolioError] = useState("");

  type PkgItem = { id: string; name: string; price: string; popular: boolean; features: string[] };
  type AddonItem = { key: string; label: string; price: number };
  const [packages, setPackages] = useState<PkgItem[]>(talentProfile?.packages ?? []);
  const [addons, setAddons] = useState<AddonItem[]>(talentProfile?.social_links?.usage_addons ?? []);

  const addPkg  = () => setPackages(ps => [...ps, { id: crypto.randomUUID(), name: "", price: "", popular: false, features: [] }]);
  const setPkg  = (id: string, key: keyof PkgItem, val: any) => setPackages(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p));
  const delPkg  = (id: string) => setPackages(ps => ps.filter(p => p.id !== id));
  const addFeat = (id: string) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: [...p.features, ""] } : p));
  const setFeat = (id: string, fi: number, val: string) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: p.features.map((f, i) => i === fi ? val : f) } : p));
  const delFeat = (id: string, fi: number) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: p.features.filter((_, i) => i !== fi) } : p));

  const addAddon = () => setAddons(as => [...as, { key: crypto.randomUUID(), label: "", price: 0 }]);
  const setAddon = (key: string, field: keyof AddonItem, val: any) => setAddons(as => as.map(a => a.key === key ? { ...a, [field]: val } : a));
  const delAddon = (key: string) => setAddons(as => as.filter(a => a.key !== key));

  // Previous Projects. `verified` is read from existing entries (admin-set,
  // via the admin talent editor) and carried through untouched — the wizard
  // never exposes a way to set it; the API route re-derives it server-side
  // from the previously-stored value regardless of what this sends, so this
  // is defence in depth, not the only guard.
  type ExpItem = { id: string; name: string; description: string; duration: string; deliveredAt: string; deliverable: string; logoUrl: string | null; verified: boolean };
  const [experience, setExperience] = useState<ExpItem[]>(() =>
    (sl.experience ?? []).map((e: any) => ({
      id: e.id ?? crypto.randomUUID(),
      name: e.name ?? "",
      description: e.description ?? "",
      duration: e.duration ?? "",
      deliveredAt: e.deliveredAt ?? "",
      deliverable: e.deliverable ?? "",
      logoUrl: e.logoUrl ?? null,
      verified: Boolean(e.verified),
    })),
  );
  const addExp = () => setExperience(xs => [...xs, { id: crypto.randomUUID(), name: "", description: "", duration: "", deliveredAt: "", deliverable: "", logoUrl: null, verified: false }]);
  const setExp = (id: string, field: keyof ExpItem, val: any) => setExperience(xs => xs.map(x => x.id === id ? { ...x, [field]: val } : x));
  const delExp = (id: string) => setExperience(xs => xs.filter(x => x.id !== id));

  const [expLogoUploading, setExpLogoUploading] = useState<Record<string, boolean>>({});
  const handleExpLogoFile = async (id: string, file: File) => {
    setExpLogoUploading(u => ({ ...u, [id]: true }));
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
      const folder = (process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents") + "/experience-logos";
      const result = await uploadToCloudinary(file, { cloudName, uploadPreset, folder, resourceType: "image" });
      if (result.ok) setExp(id, "logoUrl", result.url);
      else console.error("[experience logo upload]", result.errorKind, result.errorMessage ?? "");
    } finally {
      setExpLogoUploading(u => ({ ...u, [id]: false }));
    }
  };

  const patchSection = async (section: string, data: Record<string, any>) => {
    const res = await fetch("/api/profile/complete", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, data }),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const handleAvatarFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.avatar_url) await onUpdate();
    } catch {}
    setUploading(false);
  };

  const MAX_PORTFOLIO_VIDEO_BYTES = 200 * 1024 * 1024;

  const handlePortfolioFile = async (file: File, type: "photo" | "video") => {
    if (type === "video" && file.size > MAX_PORTFOLIO_VIDEO_BYTES) {
      setPortfolioError(t.portfolioErrTooBig);
      return;
    }
    setPortfolioUploading(true);
    setPortfolioError("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
    const folder = (process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents") + "/portfolio";

    const result = await uploadToCloudinary(file, { cloudName, uploadPreset, folder, resourceType: type === "video" ? "video" : "image" });
    if (!result.ok) {
      console.error("[portfolio upload]", result.errorKind, result.errorMessage ?? "");
      setPortfolioError(cloudinaryUploadErrorText(result.errorKind!, lang));
      setPortfolioUploading(false);
      return;
    }

    try {
      const saveRes = await fetch("/api/portfolio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url, media_type: type, caption: portfolioCaption || null }),
      });
      const saved = await saveRes.json();
      if (saved.item) {
        setPortfolioMedia(prev => [saved.item, ...prev]);
        setPortfolioCaption("");
        await onUpdate();
      } else {
        setPortfolioError(t.portfolioErrSave);
      }
    } catch (e) {
      console.error("[portfolio upload] saving item failed:", e);
      setPortfolioError(t.portfolioErrSave);
    }
    setPortfolioUploading(false);
  };

  // Lets one file-picker selection carry several photos/videos instead of
  // forcing a repeat click per file — the native <input multiple> picker
  // already supports multi-select on both desktop and mobile browsers.
  // Uploaded sequentially (not Promise.all) so Cloudinary sees one request
  // at a time and portfolioMedia's prepend order matches selection order.
  const handlePortfolioFiles = async (files: FileList | null, type: "photo" | "video") => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await handlePortfolioFile(file, type);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPortfolioMedia(prev => prev.filter(m => m.id !== id));
    await onUpdate();
  };

  /** Returns whether the save actually succeeded — callers must not advance
   * the step or navigate away on a false, or a failed write (e.g. the
   * availability_schedule write) silently reads as success. */
  const saveStep = async (key: WizardStepKey): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      if (key === "basic") {
        if (personal.full_name.trim()) await patchSection("personal", { full_name: personal.full_name.trim(), city: personal.city.trim() });
        if (bio.trim()) await patchSection("bio", { bio: bio.trim() });
        if (gender) await patchSection("physical", { gender });
      } else if (key === "physical") {
        if (Object.values(physical).some((v) => String(v).trim().length > 0)) await patchSection("physical", physical);
      } else if (key === "professional") {
        if (category) await patchSection("categories", { category });
        if (packages.length) await patchSection("packages", { packages });
        if (addons.length) await patchSection("usage_addons", { usage_addons: addons });
      } else if (key === "experience") {
        if (experience.length) await patchSection("experience", { experience });
      } else if (key === "presence") {
        if (Object.values(presence).some((v) => v.trim().length > 2)) await patchSection("social", presence);
      } else if (key === "availability") {
        await patchSection("availability", { availability: avail, availability_schedule: schedule });
      }
      await onUpdate();
      setSaving(false);
      return true;
    } catch {
      setSaving(false);
      setSaveError(t.saveError);
      return false;
    }
  };

  const handleSaveContinue = async () => {
    const ok = await saveStep(steps[stepIdx]);
    if (!ok) return;
    if (stepIdx < steps.length - 1) goToStep(stepIdx + 1);
    else router.push("/profile/me");
  };
  const handleSaveDraft = async () => { const ok = await saveStep(steps[stepIdx]); if (ok) router.push("/profile/me"); };
  const handleBack = () => { if (stepIdx > 0) goToStep(stepIdx - 1); else router.push("/profile/me"); };

  const fallback = calculateCompletion(profile, talentProfile, portfolioItems);
  const score = completion?.score ?? fallback.score;
  const sections = completion?.sections ?? fallback.sections.map((s) => ({ ...s, progress: s.done ? 1 : 0 }));

  const ordered = [...sections].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.weight - a.weight;
  });

  /* ── shared styles ── */
  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", background: INP,
    border: `1px solid ${BORDER}`, borderRadius: "var(--radius-sm)", color: TEXT,
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-sans)",
  };
  const label: React.CSSProperties = { color: MUTED, fontSize: 12, display: "block", marginBottom: 5, fontWeight: 600 };
  const ghostBtn: React.CSSProperties = {
    padding: isMobile ? "12px 14px" : "12px 20px", background: "transparent", border: `1px solid ${BORDER}`,
    borderRadius: "var(--radius-sm)", color: MUTED, fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
  };
  const primaryBtn = (disabled?: boolean): React.CSSProperties => ({
    padding: isMobile ? "12px 16px" : "12px 24px", background: disabled ? "var(--bg-card-muted)" : TEAL,
    border: "none", borderRadius: "var(--radius-sm)", color: disabled ? MUTED : INK,
    fontSize: 14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
  });
  const infoBanner = (text: string) => (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px",
      background: "var(--color-primary-soft)", border: `1px solid var(--color-primary-soft)`,
      borderRadius: "var(--radius-sm)", marginBottom: 18,
    }}>
      <Info size={16} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ color: TEXT, fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  );

  const currentStep = steps[stepIdx];
  const StepIcon = STEP_ICONS[currentStep];

  /* ── sidebar step rows (shared between desktop rail + mobile sheet) ── */
  const stepRows = steps.map((key, i) => {
    const Icon = STEP_ICONS[key];
    const active = i === stepIdx;
    const done = stepDone(key, sections);
    return (
      <button
        key={key}
        onClick={() => goToStep(i)}
        style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: lang === "ar" ? "right" : "left",
          padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
          background: active ? "var(--color-primary-soft)" : "transparent",
          borderInlineStart: active ? `3px solid ${TEAL}` : "3px solid transparent",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: done ? GREEN : active ? TEAL : "var(--bg-card-muted)",
          color: done || active ? INK : MUTED,
        }}>
          {done ? <Check size={15} /> : <Icon size={15} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: active ? TEXT : MUTED }}>
            {t.steps[key].title}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.steps[key].desc}
          </p>
        </div>
      </button>
    );
  });

  return (
    <main dir={dir} style={{ fontFamily: "var(--font-sans)", background: "var(--bg-page)", minHeight: "100vh", paddingBottom: isMobile ? 88 : 0 }}>
      {/* ─── Top bar ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, background: "var(--bg-page)",
        borderBottom: `1px solid ${BORDER}`, padding: isMobile ? "12px 16px" : "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <button onClick={handleBack} style={ghostBtn}>
          {lang === "ar" ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {t.back}
        </button>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{t.stepOf(stepIdx + 1, steps.length)}</span>
        {/* Phones: Save Draft lives in the bottom nav; a third button here didn't fit a 320px bar. */}
        {!isMobile && (
          <button onClick={handleSaveDraft} disabled={saving} style={{ ...ghostBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? t.saving : t.saveDraft}
          </button>
        )}
      </div>

      {saveError && (
        <div style={{
          maxWidth: 1280, margin: "12px auto 0", padding: isMobile ? "0 16px" : "0 28px",
        }}>
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: `1px solid ${RED}`, borderRadius: 10,
            padding: "10px 14px", color: RED, fontSize: 13, fontWeight: 700,
          }}>
            {saveError}
          </div>
        </div>
      )}

      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: isMobile ? "16px" : "28px",
        display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "300px minmax(0,1fr)", gap: isMobile ? 16 : 32,
        alignItems: "start",
      }}>
        {/* ─── Desktop persistent sidebar ─── */}
        {!isMobile && (
          <aside style={{
            position: "sticky", top: 78, background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: "var(--radius-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 4,
          }}>
            {stepRows}
            <div style={{ marginTop: 12, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: MUTED, fontSize: 12, fontWeight: 700 }}>{t.completion}</span>
                <span style={{ color: TEAL, fontSize: 13, fontWeight: 800 }}>{score}%</span>
              </div>
              <div style={{ height: 8, background: "var(--bg-card-muted)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, borderRadius: "var(--radius-pill)", transition: "width 0.5s ease" }} />
              </div>
            </div>
          </aside>
        )}

        {/* ─── Mobile collapsed step header ─── */}
        {isMobile && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "var(--radius-lg)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: TEAL, color: INK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <StepIcon size={15} />
                </div>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.steps[currentStep].title}
                </span>
              </div>
              <button onClick={() => setMobileStepsOpen((v) => !v)} style={{ background: "transparent", border: "none", color: TEAL, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
                {mobileStepsOpen ? t.hideSteps : t.viewAllSteps}
              </button>
            </div>
            <div style={{ height: 6, background: "var(--bg-card-muted)", borderRadius: "var(--radius-pill)", overflow: "hidden", marginBottom: mobileStepsOpen ? 12 : 0 }}>
              <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`, borderRadius: "var(--radius-pill)" }} />
            </div>
            {mobileStepsOpen && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{stepRows}</div>}
          </div>
        )}

        {/* ─── Main content ─── */}
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: "var(--radius-lg)",
          padding: isMobile ? 18 : 28, maxWidth: 680, width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--color-primary-soft)", color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <StepIcon size={19} />
            </div>
            <h1 style={{ color: TEXT, fontSize: isMobile ? 18 : 21, fontWeight: 800, margin: 0 }}>{t.steps[currentStep].title}</h1>
          </div>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: "0 0 20px" }}>{t.steps[currentStep].desc}</p>

          {currentStep === "presence" && infoBanner(t.banners.presence)}
          {currentStep === "physical" && infoBanner(t.banners.physical)}
          {currentStep === "experience" && infoBanner(t.banners.experience)}

          <div>
            {currentStep === "basic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label htmlFor="cp-avatar-input" style={{
                  display: "flex", alignItems: "center", gap: 12, border: `2px dashed ${TEAL}`,
                  borderRadius: "var(--radius-md)", padding: "14px 16px", cursor: "pointer",
                  background: "var(--color-primary-soft)",
                }}>
                  <span style={{ fontSize: 26 }}>📸</span>
                  <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{uploading ? t.uploading : t.uploadPhoto}</span>
                </label>
                <input id="cp-avatar-input" type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ""; }} />
                {profile?.avatar_review_status === "pending" && (
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--color-accent-strong)" }}>
                    {lang === "ar" ? "صورتك الجديدة قيد المراجعة — هتظهر للعامة بعد موافقة الأدمن." : "Your new photo is pending review — it goes public once an admin approves it."}
                  </p>
                )}
                {profile?.avatar_review_status === "rejected" && (
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "#ef4444" }}>
                    {lang === "ar" ? "صورتك الجديدة اترفضت" : "Your new photo was rejected"}{profile?.avatar_rejection_reason ? `: ${profile.avatar_rejection_reason}` : ""} — {lang === "ar" ? "ارفع صورة تانية." : "upload another."}
                  </p>
                )}
                {cropFile && (
                  <AvatarCropModal
                    file={cropFile}
                    onCancel={() => setCropFile(null)}
                    onCropped={(cropped) => { setCropFile(null); handleAvatarFile(cropped); }}
                  />
                )}

                <div>
                  <label style={label}>{t.labels.fullName}</label>
                  <input style={inp} value={personal.full_name} onChange={(e) => setPersonal((f) => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <label style={label}>{t.labels.city}</label>
                  <input style={inp} value={personal.city} onChange={(e) => setPersonal((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label style={label}>{lang === "ar" ? "النوع" : "Gender"}</label>
                  <div role="radiogroup" style={{ display: "flex", gap: 8 }}>
                    {([["male", lang === "ar" ? "ذكر" : "Male"], ["female", lang === "ar" ? "أنثى" : "Female"]] as const).map(([v, l]) => (
                      <button key={v} type="button" role="radio" aria-checked={gender === v} onClick={() => setGender(v)} style={{
                        flex: 1, minHeight: 42, borderRadius: "var(--radius-sm)", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                        fontFamily: "var(--font-sans)", background: gender === v ? TEAL : INP, color: gender === v ? INK : MUTED,
                        border: `1px solid ${gender === v ? TEAL : BORDER}`,
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={label}>{t.labels.bio}</label>
                  <textarea rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} value={bio}
                    placeholder={t.labels.bioHint} onChange={(e) => setBio(e.target.value)} />
                </div>
              </div>
            )}

            {currentStep === "physical" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))", gap: 14 }}>
                {(category === "model" ? MODEL_PHYSICAL_FIELDS : GENERAL_PHYSICAL_FIELDS).map((k) => {
                  const l = k === "age" ? (lang === "ar" ? "السن" : "Age")
                    : k === "languages" ? (lang === "ar" ? "اللغات" : "Languages")
                    : k === "dialect" ? (lang === "ar" ? "اللهجة" : "Dialect")
                    : k === "height" ? (lang === "ar" ? "الطول (سم)" : "Height (cm)")
                    : k === "weight" ? (lang === "ar" ? "الوزن (كجم)" : "Weight (kg)")
                    : k === "shoe_size" ? (lang === "ar" ? "مقاس الحذاء (EU)" : "Shoe Size (EU)")
                    : k === "hair_color" ? (lang === "ar" ? "لون الشعر" : "Hair Color")
                    : k === "chest" ? t.labels.chest
                    : k === "waist" ? t.labels.waist
                    : k === "hip" ? t.labels.hip
                    : t.labels.eyeColor;
                  const isLtr = k === "age" || k === "height" || k === "weight" || k === "shoe_size" || k === "chest" || k === "waist" || k === "hip";
                  return (
                    <div key={k}>
                      <label style={label}>{l}</label>
                      <input value={(physical as any)[k]} onChange={(e) => setPhysical((p) => ({ ...p, [k]: e.target.value }))}
                        style={{ ...inp, direction: isLtr ? "ltr" : "rtl" }} placeholder={l} />
                    </div>
                  );
                })}
              </div>
            )}

            {currentStep === "professional" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <label style={{ ...label, marginBottom: 10 }}>{t.labels.category}</label>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))", gap: 8 }}>
                    {CATEGORIES.map((c) => (
                      <button key={c.value} onClick={() => setCategory(c.value)} style={{
                        padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "center",
                        background: category === c.value ? TEAL : INP,
                        color: category === c.value ? INK : MUTED,
                        border: `1px solid ${category === c.value ? TEAL : BORDER}`,
                      }}>
                        {lang === "ar" ? c.ar : c.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>{t.reviewSections.packages}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {packages.map((pkg) => (
                      <div key={pkg.id} style={{ border: `1px solid ${BORDER}`, borderRadius: "var(--radius-md)", padding: 14, position: "relative", background: SURFACE }}>
                        <button onClick={() => delPkg(pkg.id)} style={{ position: "absolute", top: 10, insetInlineEnd: 10, background: "rgba(223,63,77,0.14)", border: "none", borderRadius: 6, color: RED, cursor: "pointer", padding: "2px 8px", fontSize: 12 }}>✕</button>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 8 }}>
                          <div>
                            <label style={label}>{t.pkgName}</label>
                            <input value={pkg.name} onChange={e => setPkg(pkg.id, "name", e.target.value)} style={inp} />
                          </div>
                          <div>
                            <label style={label}>{t.pkgPrice}</label>
                            <input value={pkg.price} onChange={e => setPkg(pkg.id, "price", e.target.value)} style={{ ...inp, direction: "ltr" }} type="number" min="0" />
                          </div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                          <input type="checkbox" checked={pkg.popular} onChange={e => setPkg(pkg.id, "popular", e.target.checked)} />
                          <span style={{ color: MUTED, fontSize: 12 }}>{t.pkgPopular}</span>
                        </label>
                        <label style={label}>{t.pkgFeatures}</label>
                        {pkg.features.map((f, fi) => (
                          <div key={fi} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                            <input value={f} onChange={e => setFeat(pkg.id, fi, e.target.value)} style={{ ...inp, flex: 1 }} />
                            <button onClick={() => delFeat(pkg.id, fi)} style={{ background: "rgba(223,63,77,0.12)", border: "none", borderRadius: 6, color: RED, cursor: "pointer", padding: "0 10px" }}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => addFeat(pkg.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 7, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", marginTop: 4 }}>
                          + {t.addFeature}
                        </button>
                      </div>
                    ))}
                    <button onClick={addPkg} style={{ padding: "10px 0", background: "transparent", border: `1px dashed ${TEAL}`, borderRadius: "var(--radius-sm)", color: TEAL, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                      + {t.addPackage}
                    </button>
                  </div>
                </div>

                <div>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>{t.reviewSections.usage_addons}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {addons.map((addon) => (
                      <div key={addon.key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 36px", gap: 8, alignItems: "end" }}>
                        <div>
                          <label style={label}>{t.addonName}</label>
                          <input value={addon.label} onChange={e => setAddon(addon.key, "label", e.target.value)} style={inp} />
                        </div>
                        <div>
                          <label style={label}>{t.addonPrice}</label>
                          <input value={addon.price} onChange={e => setAddon(addon.key, "price", Number(e.target.value))} style={{ ...inp, direction: "ltr" }} type="number" min="0" />
                        </div>
                        <button onClick={() => delAddon(addon.key)} style={{ height: 38, background: "rgba(223,63,77,0.12)", border: "none", borderRadius: 8, color: RED, cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={addAddon} style={{ padding: "10px 0", background: "transparent", border: `1px dashed ${GOLD}`, borderRadius: "var(--radius-sm)", color: GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                      + {t.addAddon}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "portfolio" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {portfolioMedia.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
                    {portfolioMedia.map((item: any) => (
                      <div key={item.id} style={{ position: "relative", borderRadius: "var(--radius-sm)", overflow: "hidden", aspectRatio: "1", background: "var(--bg-card-muted)" }}>
                        {item.media_type === "video" ? (
                          <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                        ) : (
                          <img src={cdnImage(item.url, 320)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <MediaReviewBadge item={item} lang={lang === "ar" ? "ar" : "en"} />
                        <button onClick={() => handleDeletePortfolio(item.id)} style={{ position: "absolute", top: 4, insetInlineEnd: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(223,63,77,0.9)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {mediaReviewNotice(portfolioMedia, lang === "ar" ? "ar" : "en") && (
                  <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{mediaReviewNotice(portfolioMedia, lang === "ar" ? "ar" : "en")}</p>
                )}
                <div>
                  <label style={label}>{t.portfolioCaption}</label>
                  <input value={portfolioCaption} onChange={e => setPortfolioCaption(e.target.value)} style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
                  <label htmlFor="cp-portfolio-photo" style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", border: `2px dashed ${TEAL}`, borderRadius: "var(--radius-md)",
                    cursor: portfolioUploading ? "not-allowed" : "pointer", background: "var(--color-primary-soft)",
                    opacity: portfolioUploading ? 0.6 : 1,
                  }}>
                    <ImageIcon size={22} color={TEAL} />
                    <span style={{ color: TEAL, fontSize: 13, fontWeight: 800 }}>{portfolioUploading ? t.uploading : t.addPhoto}</span>
                  </label>
                  <input id="cp-portfolio-photo" type="file" accept="image/*" multiple style={{ display: "none" }} disabled={portfolioUploading}
                    onChange={e => { const files = e.target.files; handlePortfolioFiles(files, "photo"); e.target.value = ""; }} />

                  <label htmlFor="cp-portfolio-video" style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "18px 12px", border: `2px dashed ${GOLD}`, borderRadius: "var(--radius-md)",
                    cursor: portfolioUploading ? "not-allowed" : "pointer", background: "var(--color-accent-soft)",
                    opacity: portfolioUploading ? 0.6 : 1,
                  }}>
                    <Play size={22} color={GOLD} />
                    <span style={{ color: GOLD, fontSize: 13, fontWeight: 800 }}>{portfolioUploading ? t.uploading : t.addVideo}</span>
                  </label>
                  <input id="cp-portfolio-video" type="file" accept="video/*" multiple style={{ display: "none" }} disabled={portfolioUploading}
                    onChange={e => { const files = e.target.files; handlePortfolioFiles(files, "video"); e.target.value = ""; }} />
                </div>
                {portfolioError && (
                  <p style={{ color: "#EF4444", fontSize: 12.5, margin: "10px 0 0" }} role="alert">{portfolioError}</p>
                )}
              </div>
            )}

            {currentStep === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.length === 0 && (
                  <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.expEmpty}</p>
                )}
                {experience.map((exp) => (
                  <div key={exp.id} style={{ border: `1px solid ${BORDER}`, borderRadius: "var(--radius-md)", padding: 14, position: "relative", background: SURFACE }}>
                    <button onClick={() => delExp(exp.id)} style={{ position: "absolute", top: 10, insetInlineEnd: 10, background: "rgba(223,63,77,0.14)", border: "none", borderRadius: 6, color: RED, cursor: "pointer", padding: "2px 8px", fontSize: 12 }}>✕</button>

                    {exp.verified && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10, background: "rgba(30,166,114,0.14)", color: GREEN, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                        <ShieldCheck size={12} />{t.expVerified}
                      </span>
                    )}

                    <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 10, flexShrink: 0, overflow: "hidden",
                        background: INP, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {exp.logoUrl ? (
                          <img src={exp.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <ImageIcon size={18} color={MUTED} />
                        )}
                      </div>
                      <div>
                        <label style={{ ...label, marginBottom: 6 }}>{t.expLogo}</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <label htmlFor={`exp-logo-${exp.id}`} style={{ color: TEAL, fontSize: 12.5, fontWeight: 700, cursor: expLogoUploading[exp.id] ? "not-allowed" : "pointer", opacity: expLogoUploading[exp.id] ? 0.6 : 1 }}>
                            {expLogoUploading[exp.id] ? t.uploading : (exp.logoUrl ? t.expLogoChange : t.expLogoAdd)}
                          </label>
                          <input id={`exp-logo-${exp.id}`} type="file" accept="image/*" style={{ display: "none" }} disabled={expLogoUploading[exp.id]}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleExpLogoFile(exp.id, f); e.target.value = ""; }} />
                          {exp.logoUrl && (
                            <button onClick={() => setExp(exp.id, "logoUrl", null)} style={{ background: "none", border: "none", color: RED, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "var(--font-sans)" }}>
                              {t.expLogoRemove}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 8, maxWidth: "calc(100% - 34px)" }}>
                      <label style={label}>{t.expName}</label>
                      <input value={exp.name} onChange={e => setExp(exp.id, "name", e.target.value)} style={inp} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={label}>{t.expDescription}</label>
                      <textarea rows={3} value={exp.description} onChange={e => setExp(exp.id, "description", e.target.value)}
                        placeholder={t.expDescriptionHint} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={label}>{t.expDuration}</label>
                        <input value={exp.duration} onChange={e => setExp(exp.id, "duration", e.target.value)} placeholder={t.expDurationHint} style={inp} />
                      </div>
                      <div>
                        <label style={label}>{t.expDeliveredAt}</label>
                        <input value={exp.deliveredAt} onChange={e => setExp(exp.id, "deliveredAt", e.target.value)} placeholder={t.expDeliveredAtHint} style={inp} />
                      </div>
                    </div>
                    <div>
                      <label style={label}>{t.expDeliverable}</label>
                      <input value={exp.deliverable} onChange={e => setExp(exp.id, "deliverable", e.target.value)} placeholder={t.expDeliverableHint} style={inp} />
                    </div>
                  </div>
                ))}
                <button onClick={addExp} style={{ padding: "10px 0", background: "transparent", border: `1px dashed ${TEAL}`, borderRadius: "var(--radius-sm)", color: TEAL, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  + {t.addProject}
                </button>
              </div>
            )}

            {currentStep === "presence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PRESENCE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label style={label}>{f.icon} {(t.labels as any)[f.key]}</label>
                    <input style={inp} dir="ltr" value={presence[f.key] ?? ""}
                      placeholder={lang === "ar" ? "رابط الحساب" : "Profile URL"}
                      onChange={(e) => setPresence((s) => ({ ...s, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            )}

            {currentStep === "availability" && (
              <div>
                <label style={{ ...label, fontSize: 13, marginBottom: 12 }}>{t.labels.availability}</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["available", "unavailable"] as const).map((v) => (
                    <button key={v} onClick={() => setAvail(v)} style={{
                      flex: 1, padding: "14px 0", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 800,
                      cursor: "pointer", fontFamily: "var(--font-sans)",
                      background: avail === v ? (v === "available" ? GREEN : "var(--color-warning)") : INP,
                      color: avail === v ? INK : MUTED,
                      border: `1px solid ${avail === v ? (v === "available" ? GREEN : "var(--color-warning)") : BORDER}`,
                    }}>
                      {v === "available" ? t.labels.available : t.labels.unavailable}
                    </button>
                  ))}
                </div>

                {avail === "available" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 24 }}>
                    {/* ── Calendar ── */}
                    <div>
                      <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>{t.avail.weeklyTitle}</p>
                      <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: "0 0 14px" }}>{t.avail.weeklyDesc}</p>

                      <div style={{ border: `1px solid ${BORDER}`, borderRadius: "var(--radius-md)", padding: isMobile ? 10 : 16, background: SURFACE }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <button onClick={goPrevMonth} disabled={isCurrentMonth} aria-label={t.avail.prevMonth} style={{
                            width: 30, height: 30, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "transparent",
                            color: isCurrentMonth ? "var(--border-subtle)" : TEXT, cursor: isCurrentMonth ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {lang === "ar" ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                          </button>
                          <span style={{ color: TEXT, fontSize: 14, fontWeight: 800 }}>
                            {lang === "ar" ? MONTH_LABELS[viewMonth].ar : MONTH_LABELS[viewMonth].en} {viewYear}
                          </span>
                          <button onClick={goNextMonth} aria-label={t.avail.nextMonth} style={{
                            width: 30, height: 30, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "transparent",
                            color: TEXT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {lang === "ar" ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4, marginBottom: 4 }}>
                          {DAY_KEYS.map((day) => (
                            <div key={day} style={{ textAlign: "center", color: MUTED, fontSize: 11, fontWeight: 700, padding: "4px 0" }}>
                              {lang === "ar" ? DAY_LABELS[day].short_ar : DAY_LABELS[day].short_en}
                            </div>
                          ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4 }}>
                          {calendarCells.map((dateStr, i) => {
                            if (!dateStr) return <div key={`empty-${i}`} />;
                            const isPast = dateStr < todayISO;
                            const isSelected = Boolean(schedule.dates[dateStr]);
                            const dayNum = Number(dateStr.slice(-2));
                            return (
                              <button
                                key={dateStr}
                                disabled={isPast}
                                onClick={() => toggleDate(dateStr)}
                                style={{
                                  aspectRatio: "1", borderRadius: "var(--radius-sm)", fontSize: isMobile ? 12 : 13, fontWeight: 700,
                                  cursor: isPast ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)",
                                  background: isSelected ? TEAL : "transparent",
                                  color: isSelected ? INK : isPast ? "var(--border-subtle)" : TEXT,
                                  border: `1px solid ${isSelected ? TEAL : "transparent"}`,
                                }}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Selected Hours ── */}
                      <div style={{ marginTop: 16 }}>
                        <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>{t.avail.selectedHoursTitle}</p>
                        {selectedDates.length === 0 ? (
                          <p style={{ color: MUTED, fontSize: 12.5, margin: 0 }}>{t.avail.selectedHoursEmpty}</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {sharedSlots.map((slot, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <input type="time" value={slot.start} dir="ltr"
                                  onChange={(e) => setSharedSlotTime(i, "start", e.target.value)}
                                  style={{ ...inp, width: "auto" }} />
                                <span style={{ color: MUTED, fontSize: 12 }}>{t.avail.to}</span>
                                <input type="time" value={slot.end} dir="ltr"
                                  onChange={(e) => setSharedSlotTime(i, "end", e.target.value)}
                                  style={{ ...inp, width: "auto" }} />
                                <button onClick={() => removeSharedSlot(i)} aria-label={t.avail.removeSlot} style={{ background: "rgba(223,63,77,0.12)", border: "none", borderRadius: 6, color: RED, cursor: "pointer", padding: "6px 10px", fontSize: 12 }}>✕</button>
                              </div>
                            ))}
                            {sharedSlots.length < 2 && (
                              <button onClick={addSharedSlot} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 7, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                                + {t.avail.addSlot}
                              </button>
                            )}
                            <p style={{ color: MUTED, fontSize: 11.5, margin: "4px 0 0" }}>
                              {t.avail.appliesTo(selectedDates.length)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Date Exceptions ── */}
                    <div>
                      <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>{t.avail.exceptionsTitle}</p>
                      <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: "0 0 14px" }}>{t.avail.exceptionsDesc}</p>

                      {schedule.exceptions.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                          {schedule.exceptions.map((exc) => (
                            <div key={exc.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${BORDER}`, borderRadius: "var(--radius-sm)", padding: "10px 12px", background: SURFACE }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ color: TEXT, fontSize: 13, fontWeight: 700, direction: "ltr" }}>{exc.date}</span>
                                <span style={{ color: MUTED, fontSize: 11.5 }}>
                                  {exc.type === "unavailable"
                                    ? t.avail.exceptionUnavailable
                                    : `${t.avail.exceptionCustom} · ${exc.slots?.[0]?.start}–${exc.slots?.[0]?.end}`}
                                </span>
                              </div>
                              <button onClick={() => removeException(exc.date)} style={{ background: "rgba(223,63,77,0.12)", border: "none", borderRadius: 6, color: RED, cursor: "pointer", padding: "6px 10px", fontSize: 12, fontFamily: "var(--font-sans)" }}>
                                {t.avail.removeException}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 14px" }}>{t.avail.exceptionsEmpty}</p>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
                        <div>
                          <label style={label}>{t.avail.exceptionDate}</label>
                          <input type="date" value={newExceptionDate} dir="ltr"
                            onChange={(e) => setNewExceptionDate(e.target.value)}
                            style={{ ...inp, width: "auto" }} />
                        </div>
                        <div>
                          <label style={label}>{t.avail.exceptionType}</label>
                          <CustomSelect
                            value={newExceptionType}
                            onChange={(v) => setNewExceptionType(v as ExceptionType)}
                            style={{ width: "auto", minWidth: 160 }}
                            options={[
                              { value: "unavailable", label: t.avail.exceptionUnavailable },
                              { value: "custom", label: t.avail.exceptionCustom },
                            ]}
                          />
                        </div>
                        {newExceptionType === "custom" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="time" value={newExceptionStart} dir="ltr" onChange={(e) => setNewExceptionStart(e.target.value)} style={{ ...inp, width: "auto" }} />
                            <span style={{ color: MUTED, fontSize: 12 }}>{t.avail.to}</span>
                            <input type="time" value={newExceptionEnd} dir="ltr" onChange={(e) => setNewExceptionEnd(e.target.value)} style={{ ...inp, width: "auto" }} />
                          </div>
                        )}
                        <button onClick={addException} disabled={!newExceptionDate} style={primaryBtn(!newExceptionDate)}>
                          + {t.avail.addException}
                        </button>
                      </div>
                    </div>

                    {/* ── Timezone ── */}
                    <div>
                      <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>{t.avail.timezoneTitle}</p>
                      <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: "0 0 10px" }}>{t.avail.timezoneDesc}</p>
                      <CustomSelect
                        value={schedule.timezone ?? ""}
                        onChange={(v) => setSchedule((s) => ({ ...s, timezone: v || null }))}
                        placeholder="—"
                        style={{ direction: "ltr" }}
                        options={timezoneOptions.map((tz) => ({ value: tz, label: tz }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === "review" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ordered.map((s) => (
                  <button key={s.key} onClick={() => {
                    const target = (Object.keys(STEP_COMPLETION_KEYS) as WizardStepKey[]).find((k) => STEP_COMPLETION_KEYS[k].includes(s.key));
                    if (target) goToStep(steps.indexOf(target));
                  }} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                    padding: "12px 14px", borderRadius: "var(--radius-sm)", border: `1px solid ${BORDER}`,
                    background: SURFACE, cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: lang === "ar" ? "right" : "left",
                  }}>
                    <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{(t.reviewSections as any)[s.key] ?? s.label[lang]}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: s.done ? GREEN : MUTED }}>
                      {s.key === "payment" ? t.locked : s.done ? `✓ ${t.done}` : t.notStarted}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── bottom nav (mirrors top) ─── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 26, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
            <button onClick={handleBack} style={ghostBtn}>
              {lang === "ar" ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              {t.back}
            </button>
            <button onClick={handleSaveDraft} disabled={saving} style={{ ...ghostBtn, flex: 1, justifyContent: "center" }}>
              {saving ? t.saving : t.saveDraft}
            </button>
            <button onClick={handleSaveContinue} disabled={saving} style={{ ...primaryBtn(saving), flex: isMobile ? "1 1 100%" : 2, justifyContent: "center" }}>
              {saving ? t.saving : stepIdx < steps.length - 1 ? t.saveContinue : t.completeBtn}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
