"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { calculateCompletion } from "@/lib/profile-completion";
import { MODEL_PHYSICAL_FIELDS, TALENT_SOCIAL_KEYS } from "@/lib/profile-fields";
import { getWizardSteps, type WizardStepKey } from "./completion-wizard-steps";
import { cdnImage } from "@/lib/images";
import type { CompletionDTO } from "@/features/profiles/types/dto";

/* ─── translations ───────────────────────────────────────── */
const TX = {
  ar: {
    title:        "أكمل ملفك الشخصي",
    score:        (n: number) => `${n}% مكتمل`,
    ctaComplete:  "أكمل ملفك",
    stepOf:       (i: number, n: number) => `الخطوة ${i} من ${n}`,
    back:         "رجوع",
    continueBtn:  "حفظ واستمرار",
    saveExit:     "حفظ وخروج",
    finish:       "إنهاء",
    reviewHint:   "راجع كل قسم، اضغط أي خطوة أعلاه للتعديل.",
    tapToAdd:     "اضغط للإضافة",
    notStarted:   "لم يبدأ بعد",
    complete:     "مكتمل",
    done:         "تم",
    partial:      (n: number) => `${n}% · تابع الإكمال`,
    pendingReview:"قيد المراجعة",
    locked:       "يفتح قريباً",
    save:         "حفظ",
    saving:       "جاري الحفظ...",
    cancel:       "إلغاء",
    uploading:    "جاري الرفع...",
    uploadPhoto:  "ارفع صورتك",
    uploadHint:   "JPG أو PNG · أقل من 5 ميجا",
    choose:       "اختر صورة",
    lockedFeatures: "ميزات مقفلة",
    unlockAt:     (n: number) => `تفتح عند ${n}%`,
    stepLabels: {
      basic:        "المعلومات الأساسية",
      physical:     "البيانات الجسدية",
      professional: "المعلومات المهنية",
      portfolio:    "معرض الأعمال",
      presence:     "الحضور المهني",
      availability: "حالة الإتاحة",
      review:       "المراجعة النهائية",
    },
    features: {
      applyToJobs:    "التقديم على الفرص",
      appearInSearch: "الظهور في البحث",
      receiveBriefs:  "استقبال العروض",
      becomeVerified: "شارة التحقق",
    },
    sections: {
      avatar:       "صورة الملف",
      personal:     "الاسم والمدينة",
      bio:          "النبذة الشخصية",
      categories:   "التخصص",
      social:       "الحضور المهني",
      portfolio:    "أعمالي",
      physical:     "البيانات الجسدية",
      packages:     "الباقات والأسعار",
      usage_addons: "حقوق الاستخدام",
      availability: "حالة الإتاحة",
      payment:      "بيانات الدفع",
    },
    congrats: {
      title:   "🎉 ملفك مكتمل 100%!",
      body:    "أنت الآن مؤهل للظهور في البحث واستقبال عروض العلامات التجارية مباشرة.",
      cta:     "عرض ملفي العام",
    },
    labels: {
      fullName:     "الاسم الكامل",
      city:         "المدينة",
      bio:          "نبذة عنك",
      bioHint:      "اكتب نبذة مختصرة تعرّف بك أمام الشركات...",
      category:     "التخصص الأساسي",
      instagram:    "إنستقرام",
      tiktok:       "تيك توك",
      facebook:     "فيسبوك",
      youtube:      "يوتيوب",
      linkedin:     "لينكد إن",
      telegram:     "تيليجرام",
      website:      "الموقع الإلكتروني",
      other:        "أخرى",
      available:    "متاح",
      unavailable:  "غير متاح",
      availability: "حالة الإتاحة",
      eyeColor:     "لون العين",
    },
  },
  en: {
    title:        "Complete your profile",
    score:        (n: number) => `${n}% complete`,
    ctaComplete:  "Complete My Profile",
    stepOf:       (i: number, n: number) => `Step ${i} of ${n}`,
    back:         "Back",
    continueBtn:  "Save & Continue",
    saveExit:     "Save & Exit",
    finish:       "Finish",
    reviewHint:   "Check each section — click a step above to edit it.",
    tapToAdd:     "Tap to add",
    notStarted:   "Not started",
    complete:     "Complete",
    done:         "Done",
    partial:      (n: number) => `${n}% · Continue`,
    pendingReview:"Pending review",
    locked:       "Coming soon",
    save:         "Save",
    saving:       "Saving...",
    cancel:       "Cancel",
    uploading:    "Uploading...",
    uploadPhoto:  "Upload your photo",
    uploadHint:   "JPG or PNG · Max 5 MB",
    choose:       "Choose photo",
    lockedFeatures: "Locked features",
    unlockAt:     (n: number) => `Unlocks at ${n}%`,
    stepLabels: {
      basic:        "Basic Info",
      physical:     "Physical Info",
      professional: "Professional Info",
      portfolio:    "Portfolio",
      presence:     "Professional Presence",
      availability: "Availability",
      review:       "Final Review",
    },
    features: {
      applyToJobs:    "Apply to opportunities",
      appearInSearch: "Appear in search",
      receiveBriefs:  "Receive direct briefs",
      becomeVerified: "Verified badge",
    },
    sections: {
      avatar:       "Profile photo",
      personal:     "Name & city",
      bio:          "Bio",
      categories:   "Specialty",
      social:       "Professional Presence",
      portfolio:    "Portfolio",
      physical:     "Physical details",
      packages:     "Packages & Pricing",
      usage_addons: "Usage Rights",
      availability: "Availability",
      payment:      "Payment info",
    },
    congrats: {
      title:   "🎉 Profile 100% complete!",
      body:    "You're now eligible to appear in search and receive brand briefs directly.",
      cta:     "View my public page",
    },
    labels: {
      fullName:     "Full name",
      city:         "City",
      bio:          "About you",
      bioHint:      "Write a short bio that tells brands who you are...",
      category:     "Main specialty",
      instagram:    "Instagram",
      tiktok:       "TikTok",
      facebook:     "Facebook",
      youtube:      "YouTube",
      linkedin:     "LinkedIn",
      telegram:     "Telegram",
      website:      "Website",
      other:        "Other",
      available:    "Available",
      unavailable:  "Unavailable",
      availability: "Availability status",
      eyeColor:     "Eye Color",
    },
  },
};

const CATEGORIES = [
  { value: "ugc",             ar: "صانع محتوى UGC",        en: "UGC Creator" },
  { value: "model",           ar: "موديل",                  en: "Model" },
  { value: "actor",           ar: "ممثل / ممثلة",           en: "Actor" },
  { value: "photographer",    ar: "مصور",                   en: "Photographer" },
  { value: "influencer",      ar: "مؤثر / مؤثرة",           en: "Influencer" },
  { value: "videographer",    ar: "مصور فيديو",             en: "Videographer" },
  { value: "graphic_designer",ar: "مصمم جرافيك",           en: "Graphic Designer" },
  { value: "voice_artist",    ar: "فنان مؤثرات صوتية",      en: "Voice Artist" },
  { value: "comedian",        ar: "كوميديان",               en: "Comedian" },
  { value: "animator",        ar: "موشن جرافيك",            en: "Animator" },
];

/** Professional Presence fields — URL-only links, no OAuth. */
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

/* ─── section icon map ───────────────────────────────────── */
const ICONS: Record<string, string> = {
  avatar:       "📸",
  personal:     "👤",
  bio:          "✍️",
  categories:   "🎯",
  social:       "🔗",
  portfolio:    "🖼️",
  physical:     "📏",
  packages:     "📦",
  usage_addons: "🎬",
  availability: "📅",
  payment:      "💳",
  // Brand keys.
  company_info: "🏢",
  industry:     "💼",
  logo:         "🖼️",
  verification: "🛡️",
};

/* ─── props ──────────────────────────────────────────────── */
interface Props {
  profile:        any;
  talentProfile:  any;
  portfolioItems: any[];
  onUpdate:       () => void;
  /**
   * Completion computed by THIS profile's provider (GET /api/profile/completion).
   *
   * Null means "not loaded yet", not "no completion" — the card falls back to the
   * local talent calculation for that first paint so the score does not flash in.
   * The fallback is talent-shaped, which is exactly the bug this prop fixes for
   * brands, so it is deliberately only a loading state.
   */
  completion?:    CompletionDTO | null;
}

/** Labels for gate keys. Talent and brand gates are different features. */
const GATE_TX: Record<string, { ar: string; en: string }> = {
  applyToJobs:    { ar: "التقديم على الفرص",  en: "Apply to opportunities" },
  appearInSearch: { ar: "الظهور في البحث",    en: "Appear in search" },
  receiveBriefs:  { ar: "استقبال العروض",     en: "Receive direct briefs" },
  becomeVerified: { ar: "شارة التحقق",        en: "Verified badge" },
  postJobs:       { ar: "نشر الفرص",          en: "Post opportunities" },
  contactTalents: { ar: "التواصل مع المواهب", en: "Contact talents" },
};

/* ─── modal wrapper (also used as the wizard shell) ───────── */
function Modal({
  children, onClose, dark, title, wide,
}: { children: React.ReactNode; onClose: () => void; dark: boolean; title: ReactNode; wide?: boolean }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "rgba(0,0,0,0.75)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        16,
      }}
    >
      <div style={{
        background:   dark ? "#0d1a2e" : "#ffffff",
        border:       `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
        borderRadius: 18,
        padding:      "28px 28px 24px",
        maxWidth:     wide ? 640 : 460,
        width:        "100%",
        maxHeight:    "90vh",
        overflowY:    "auto",
        fontFamily:   "'Cairo', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>{title}</div>
          <button onClick={onClose} style={{
            background: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
            border: "none", borderRadius: 8, width: 32, height: 32,
            cursor: "pointer", fontSize: 16, color: dark ? "#94a3b8" : "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function ProfileCompletionCard({ profile, talentProfile, portfolioItems, onUpdate, completion }: Props) {
  const { lang, dark } = useSite();
  const t    = TX[lang];
  const dir  = lang === "ar" ? "rtl" : "ltr";
  const router     = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const TEXT   = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED  = dark ? "#64748b"  : "#94a3b8";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const CARD   = dark ? "#0b1622"  : "#ffffff";
  const INP    = dark ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const TEAL   = "#00C9B1";
  const ORANGE = "#FF6B2B";
  // Same green the rest of the profile uses for "confirmed" (TrustCard, hero
  // verified badge), so a done section reads as done everywhere.
  const GREEN_DONE = "#00D26A";
  const GOLD   = "#F4B740";

  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ── guided wizard state ── */
  const steps = useMemo(() => getWizardSteps(talentProfile?.category), [talentProfile?.category]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [stepIdx,    setStepIdx]    = useState(0);

  // Resumable: a step deep-linked via ?complete=1&step=<key> reopens the
  // wizard at that step on mount (e.g. after a refresh mid-flow).
  useEffect(() => {
    if (searchParams.get("complete") === "1") {
      const key = searchParams.get("step");
      const idx = key ? steps.indexOf(key as WizardStepKey) : 0;
      setWizardOpen(true);
      setStepIdx(idx >= 0 ? idx : 0);
    }
    // Intentionally mount-only: the wizard's own nav owns step/URL sync after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUrl = (idx: number, open: boolean) => {
    if (!open) { router.replace(pathname, { scroll: false }); return; }
    router.replace(`${pathname}?complete=1&step=${steps[idx]}`, { scroll: false });
  };

  const openWizard = (startIdx = 0) => {
    setWizardOpen(true);
    setStepIdx(startIdx);
    syncUrl(startIdx, true);
  };
  const closeWizard = () => {
    setWizardOpen(false);
    syncUrl(0, false);
  };
  const goToStep = (idx: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    setStepIdx(clamped);
    syncUrl(clamped, true);
  };

  /* per-step local state */
  const sl = talentProfile?.social_links ?? {};
  const [personal,     setPersonal]     = useState({ full_name: profile?.full_name ?? "", city: profile?.city ?? "" });
  const [bio,          setBio]          = useState(profile?.bio ?? talentProfile?.bio ?? "");
  const [category,     setCategory]     = useState(talentProfile?.category ?? "");
  const [presence,     setPresence]     = useState<Record<string, string>>(
    Object.fromEntries(TALENT_SOCIAL_KEYS.map((k) => [k, sl[k] ?? ""])),
  );
  const [avail, setAvail] = useState(talentProfile?.availability ?? "available");

  /* portfolio state */
  const [portfolioMedia,     setPortfolioMedia]     = useState<any[]>(portfolioItems ?? []);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolioCaption,   setPortfolioCaption]   = useState("");

  const handlePortfolioFile = async (file: File, type: "photo" | "video") => {
    setPortfolioUploading(true);
    try {
      const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const folder       = (process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents") + "/portfolio";
      const endpoint     = type === "video"
        ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
        : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset!);
      fd.append("folder", folder);
      const res  = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        const saveRes = await fetch("/api/portfolio", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.secure_url, media_type: type, caption: portfolioCaption || null }),
        });
        const saved = await saveRes.json();
        if (saved.item) {
          setPortfolioMedia(prev => [saved.item, ...prev]);
          setPortfolioCaption("");
          onUpdate();
        }
      }
    } catch {}
    setPortfolioUploading(false);
  };

  const handleDeletePortfolio = async (id: string) => {
    await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPortfolioMedia(prev => prev.filter(m => m.id !== id));
    onUpdate();
  };

  type PkgItem   = { id: string; name: string; price: string; popular: boolean; features: string[] };
  type AddonItem = { key: string; label: string; price: number };
  const [packages,  setPackages]  = useState<PkgItem[]>(talentProfile?.packages ?? []);
  const [addons,    setAddons]    = useState<AddonItem[]>(talentProfile?.social_links?.usage_addons ?? []);

  const addPkg  = () => setPackages(ps => [...ps, { id: crypto.randomUUID(), name: "", price: "", popular: false, features: [] }]);
  const setPkg  = (id: string, key: keyof PkgItem, val: any) => setPackages(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p));
  const delPkg  = (id: string) => setPackages(ps => ps.filter(p => p.id !== id));
  const addFeat = (id: string) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: [...p.features, ""] } : p));
  const setFeat = (id: string, fi: number, val: string) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: p.features.map((f, i) => i === fi ? val : f) } : p));
  const delFeat = (id: string, fi: number) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: p.features.filter((_, i) => i !== fi) } : p));

  const addAddon = () => setAddons(as => [...as, { key: crypto.randomUUID(), label: "", price: 0 }]);
  const setAddon = (key: string, field: keyof AddonItem, val: any) => setAddons(as => as.map(a => a.key === key ? { ...a, [field]: val } : a));
  const delAddon = (key: string) => setAddons(as => as.filter(a => a.key !== key));

  /* physical state — Model wizard step exposes only MODEL_PHYSICAL_FIELDS,
     but age/languages/dialect (set by any category through legacy editing)
     are kept in state so a save never clobbers them. */
  const [physical, setPhysical] = useState({
    height:     sl.height     ?? "",
    weight:     sl.weight     ?? "",
    age:        sl.age        ?? "",
    hair_color: sl.hair_color ?? "",
    shoe_size:  sl.shoe_size  ?? "",
    languages:  sl.languages  ?? "",
    dialect:    sl.dialect    ?? "",
    eye_color:  sl.eye_color  ?? "",
  });

  // Provider-computed when loaded; the local talent calculation only covers the
  // first paint. `progress` is display-only — see CompletionSectionDTO.
  const fallback = calculateCompletion(profile, talentProfile, portfolioItems);
  const score    = completion?.score ?? fallback.score;
  const sections = completion?.sections
    ?? fallback.sections.map((s) => ({ ...s, progress: s.done ? 1 : 0 }));
  const gates    = completion?.gates ?? [];

  if (score >= 100) {
    return (
      <div style={{
        marginBottom: 28, fontFamily: "'Cairo', sans-serif",
        background: dark ? "linear-gradient(135deg,#0a2a1e,#0d1f2d)" : "linear-gradient(135deg,#ecfdf5,#eff6ff)",
        border: `1px solid ${dark ? "rgba(0,210,106,0.25)" : "rgba(0,210,106,0.3)"}`,
        borderRadius: 18, padding: "28px 24px", textAlign: "center",
      }} dir={dir}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <h3 style={{ color: dark ? "#f1f5f9" : "#0f172a", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          {(t as any).congrats.title}
        </h3>
        <p style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 14, margin: "0 0 20px", lineHeight: 1.7 }}>
          {(t as any).congrats.body}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {["🔍 ظاهر في البحث","📨 يستقبل عروض","⭐ مؤهل للتوثيق"].map(badge => (
            <span key={badge} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: "rgba(0,210,106,0.12)", color: "#00D26A",
              border: "1px solid rgba(0,210,106,0.25)",
            }}>{badge}</span>
          ))}
        </div>
        <a href={`/talent/${profile?.handle}`} style={{
          display: "inline-block", marginTop: 20, padding: "11px 28px",
          background: "#00C9B1", color: "#fff", borderRadius: 10,
          fontSize: 14, fontWeight: 700, textDecoration: "none",
          fontFamily: "'Cairo', sans-serif",
        }}>
          {(t as any).congrats.cta}
        </a>
      </div>
    );
  }

  // Unfinished-first ordering is still used inside the Review step, so the
  // guided flow's last screen reads the same way the old grid did.
  const ordered = [...sections].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.weight - a.weight;
  });

  /* score bar color */
  const scoreColor = score >= 80 ? "#00D26A" : score >= 50 ? TEAL : score >= 25 ? "#FFB800" : ORANGE;

  /* ── shared API helper ── */
  const patchSection = async (section: string, data: Record<string, any>) => {
    const res = await fetch("/api/profile/complete", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ section, data }),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  /* ── avatar upload ── */
  const handleAvatarFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.avatar_url) onUpdate();
    } catch {}
    setUploading(false);
  };

  /**
   * Saves whatever the current step's fields hold, skipping empty ones —
   * a guided step never blocks "Continue" just because an optional field is
   * blank; the completion score already reflects what's missing.
   */
  const saveStep = async (key: WizardStepKey) => {
    setSaving(true);
    try {
      if (key === "basic") {
        if (personal.full_name.trim()) {
          await patchSection("personal", { full_name: personal.full_name.trim(), city: personal.city.trim() });
        }
        if (bio.trim()) await patchSection("bio", { bio: bio.trim() });
      } else if (key === "physical") {
        if (Object.values(physical).some((v) => String(v).trim().length > 0)) {
          await patchSection("physical", physical);
        }
      } else if (key === "professional") {
        if (category) await patchSection("categories", { category });
        if (packages.length) await patchSection("packages", { packages });
        if (addons.length) await patchSection("usage_addons", { usage_addons: addons });
      } else if (key === "presence") {
        if (Object.values(presence).some((v) => v.trim().length > 2)) {
          await patchSection("social", presence);
        }
      } else if (key === "availability") {
        await patchSection("availability", { availability: avail });
      }
      // "portfolio" writes immediately per upload; "review" has nothing to save.
      onUpdate();
    } catch {}
    setSaving(false);
  };

  const handleContinue = async () => {
    await saveStep(steps[stepIdx]);
    if (stepIdx < steps.length - 1) goToStep(stepIdx + 1);
  };
  const handleBack = () => goToStep(stepIdx - 1);
  const handleSaveExit = async () => { await saveStep(steps[stepIdx]); closeWizard(); };

  /* ── shared input / button styles ── */
  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", background: INP,
    border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'Cairo', sans-serif",
  };
  const saveBtn = (disabled?: boolean): React.CSSProperties => ({
    width: "100%", padding: "12px 0", background: disabled ? (dark ? "rgba(255,255,255,0.06)" : "#e2e8f0") : TEAL,
    border: "none", borderRadius: 10, color: disabled ? MUTED : "#fff",
    fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'Cairo', sans-serif", marginTop: 16,
  });
  const ghostBtn: React.CSSProperties = {
    padding: "12px 20px", background: "transparent",
    border: `1px solid ${BORDER}`, borderRadius: 10, color: MUTED,
    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif",
  };

  /* ─── render ──────────────────────────────────────────── */
  return (
    <>
      <div style={{ marginBottom: 28, fontFamily: "'Cairo', sans-serif" }} dir={dir}>

        {/* Compact header + CTA (the old per-section card grid is gone —
            all editing now happens inside the guided wizard). */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 14, padding: "16px 18px", borderRadius: 16,
          background: CARD, border: `1px solid ${BORDER}`,
        }}>
          <div style={{ flex: "1 1 220px", minWidth: 180 }}>
            <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{t.title}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, maxWidth: 220 }}>
                <div style={{ height: 8, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 4, transition: "width 0.5s ease" }} />
                </div>
              </div>
              <span style={{ color: scoreColor, fontSize: 15, fontWeight: 800 }}>{t.score(score)}</span>
            </div>
          </div>
          <button
            onClick={() => openWizard(0)}
            style={{
              padding: "12px 24px", background: TEAL, border: "none", borderRadius: 12,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap",
            }}
          >
            {t.ctaComplete}
          </button>
        </div>

        {/* Locked features strip */}
        {(() => {
          const locked = gates
            .filter((gate) => !gate.passed)
            .map((gate) => ({
              key:   gate.key,
              label: GATE_TX[gate.key]?.[lang] ?? gate.key,
              n:     gate.minScore,
            }));
          if (!locked.length) return null;
          return (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>{t.lockedFeatures}:</span>
              {locked.map((f) => (
                <span key={f.key} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", fontSize: 11,
                  background: dark ? "rgba(255,107,43,0.08)" : "rgba(255,107,43,0.06)",
                  border: "1px solid rgba(255,107,43,0.2)", borderRadius: 20, color: ORANGE,
                }}>
                  🔒 {f.label} · {t.unlockAt(f.n)}
                </span>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ─── CSS keyframe for spinner ─── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ═══════════════════════════════════════════════════
          G U I D E D   C O M P L E T I O N   W I Z A R D
      ═══════════════════════════════════════════════════ */}
      {wizardOpen && (
        <Modal
          wide
          dark={dark}
          onClose={closeWizard}
          title={
            <div>
              <p style={{ color: MUTED, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>
                {t.stepOf(stepIdx + 1, steps.length)}
              </p>
              <h3 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>
                {t.stepLabels[steps[stepIdx]]}
              </h3>
              {/* clickable step dots — freely revisit any step, nothing is lost
                  by jumping since nothing auto-saves except Continue/Save & Exit */}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {steps.map((key, i) => (
                  <button
                    key={key}
                    onClick={() => goToStep(i)}
                    title={t.stepLabels[key]}
                    style={{
                      width: 22, height: 6, borderRadius: 3, border: "none", cursor: "pointer", padding: 0,
                      background: i === stepIdx ? TEAL : i < stepIdx ? GREEN_DONE : (dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"),
                    }}
                  />
                ))}
              </div>
            </div>
          }
        >
          <div dir={dir}>
            {steps[stepIdx] === "basic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label
                  htmlFor="completion-avatar-input"
                  style={{
                    display: "flex", alignItems: "center", gap: 12, border: `2px dashed ${TEAL}`, borderRadius: 14, padding: "14px 16px",
                    cursor: "pointer", background: dark ? "rgba(0,201,177,0.04)" : "rgba(0,201,177,0.03)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>📸</span>
                  <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>
                    {uploading ? t.uploading : t.uploadPhoto}
                  </span>
                </label>
                <input
                  id="completion-avatar-input" type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarFile(file); }}
                />

                <div>
                  <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.labels.fullName}</label>
                  <input
                    style={inp}
                    value={personal.full_name}
                    placeholder={lang === "ar" ? "مثلاً: أحمد محمد" : "e.g. Ahmed Mohamed"}
                    onChange={(e) => setPersonal((f) => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.labels.city}</label>
                  <input
                    style={inp}
                    value={personal.city}
                    placeholder={lang === "ar" ? "مثلاً: الرياض" : "e.g. Riyadh"}
                    onChange={(e) => setPersonal((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.labels.bio}</label>
                  <textarea
                    rows={4}
                    style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                    value={bio}
                    placeholder={t.labels.bioHint}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            )}

            {steps[stepIdx] === "physical" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {MODEL_PHYSICAL_FIELDS.map((k) => {
                  const label = k === "height" ? (lang === "ar" ? "الطول (سم)" : "Height (cm)")
                    : k === "weight" ? (lang === "ar" ? "الوزن (كجم)" : "Weight (kg)")
                    : k === "shoe_size" ? (lang === "ar" ? "مقاس الجزمة (EU)" : "Shoe Size (EU)")
                    : k === "hair_color" ? (lang === "ar" ? "لون الشعر" : "Hair Color")
                    : t.labels.eyeColor;
                  const isLtr = k === "height" || k === "weight" || k === "shoe_size";
                  return (
                    <div key={k}>
                      <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{label}</label>
                      <input
                        value={(physical as any)[k]}
                        onChange={(e) => setPhysical((p) => ({ ...p, [k]: e.target.value }))}
                        style={{ ...inp, direction: isLtr ? "ltr" : "rtl" }}
                        placeholder={label}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {steps[stepIdx] === "professional" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 8 }}>{t.labels.category}</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        style={{
                          padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'Cairo', sans-serif", textAlign: "center", transition: "all 0.15s",
                          background:  category === c.value ? TEAL : INP,
                          color:       category === c.value ? "#fff" : MUTED,
                          border:      `1px solid ${category === c.value ? TEAL : BORDER}`,
                        }}
                      >
                        {lang === "ar" ? c.ar : c.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>{t.sections.packages}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {packages.map((pkg) => (
                      <div key={pkg.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, position: "relative" }}>
                        <button onClick={() => delPkg(pkg.id)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(220,38,38,0.15)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "2px 8px", fontSize: 12 }}>✕</button>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div>
                            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{lang === "ar" ? "اسم الباقة" : "Package name"}</label>
                            <input value={pkg.name} onChange={e => setPkg(pkg.id, "name", e.target.value)} style={inp} placeholder={lang === "ar" ? "مثلاً: أساسي" : "e.g. Basic"} />
                          </div>
                          <div>
                            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{lang === "ar" ? "السعر (جنيه)" : "Price (EGP)"}</label>
                            <input value={pkg.price} onChange={e => setPkg(pkg.id, "price", e.target.value)} style={{ ...inp, direction: "ltr" }} type="number" min="0" />
                          </div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                          <input type="checkbox" checked={pkg.popular} onChange={e => setPkg(pkg.id, "popular", e.target.checked)} />
                          <span style={{ color: MUTED, fontSize: 12 }}>{lang === "ar" ? "الأكثر طلباً" : "Most Popular"}</span>
                        </label>
                        <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{lang === "ar" ? "المميزات" : "Features"}</label>
                        {pkg.features.map((f, fi) => (
                          <div key={fi} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                            <input value={f} onChange={e => setFeat(pkg.id, fi, e.target.value)} style={{ ...inp, flex: 1 }} />
                            <button onClick={() => delFeat(pkg.id, fi)} style={{ background: "rgba(220,38,38,0.12)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "0 10px" }}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => addFeat(pkg.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 7, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif", marginTop: 4 }}>
                          + {lang === "ar" ? "إضافة ميزة" : "Add feature"}
                        </button>
                      </div>
                    ))}
                    <button onClick={addPkg} style={{ padding: "10px 0", background: "transparent", border: `1px dashed ${TEAL}`, borderRadius: 10, color: TEAL, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                      + {lang === "ar" ? "إضافة باقة" : "Add package"}
                    </button>
                  </div>
                </div>

                <div>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>{t.sections.usage_addons}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {addons.map((addon) => (
                      <div key={addon.key} style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 8, alignItems: "end" }}>
                        <div>
                          <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{lang === "ar" ? "الاسم" : "Name"}</label>
                          <input value={addon.label} onChange={e => setAddon(addon.key, "label", e.target.value)} style={inp} placeholder={lang === "ar" ? "مثلاً: حق تجاري" : "e.g. Commercial use"} />
                        </div>
                        <div>
                          <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{lang === "ar" ? "السعر (جنيه)" : "Price (EGP)"}</label>
                          <input value={addon.price} onChange={e => setAddon(addon.key, "price", Number(e.target.value))} style={{ ...inp, direction: "ltr" }} type="number" min="0" />
                        </div>
                        <button onClick={() => delAddon(addon.key)} style={{ height: 38, background: "rgba(220,38,38,0.12)", border: "none", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={addAddon} style={{ padding: "10px 0", background: "transparent", border: `1px dashed #a78bfa`, borderRadius: 10, color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                      + {lang === "ar" ? "إضافة حق استخدام" : "Add usage right"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {steps[stepIdx] === "portfolio" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {portfolioMedia.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {portfolioMedia.map((item: any) => (
                      <div key={item.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", background: dark ? "#1e293b" : "#f1f5f9" }}>
                        {item.media_type === "video" ? (
                          <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                        ) : (
                          <img src={cdnImage(item.url, 320)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <button
                          onClick={() => handleDeletePortfolio(item.id)}
                          style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(220,38,38,0.85)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>
                    {lang === "ar" ? "تعليق (اختياري)" : "Caption (optional)"}
                  </label>
                  <input
                    value={portfolioCaption}
                    onChange={e => setPortfolioCaption(e.target.value)}
                    style={inp}
                    placeholder={lang === "ar" ? "اكتب تعليقاً..." : "Write a caption..."}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label htmlFor="portfolio-photo-input" style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "18px 12px", border: `2px dashed ${TEAL}`, borderRadius: 12,
                    cursor: portfolioUploading ? "not-allowed" : "pointer",
                    background: dark ? "rgba(0,201,177,0.04)" : "rgba(0,201,177,0.03)",
                    opacity: portfolioUploading ? 0.6 : 1,
                  }}>
                    <span style={{ fontSize: 24 }}>🖼️</span>
                    <span style={{ color: TEAL, fontSize: 13, fontWeight: 700 }}>
                      {portfolioUploading ? (lang === "ar" ? "جاري الرفع..." : "Uploading...") : (lang === "ar" ? "إضافة صورة" : "Add Photo")}
                    </span>
                  </label>
                  <input id="portfolio-photo-input" type="file" accept="image/*" style={{ display: "none" }} disabled={portfolioUploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePortfolioFile(f, "photo"); e.target.value = ""; }} />

                  <label htmlFor="portfolio-video-input" style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "18px 12px", border: `2px dashed #a78bfa`, borderRadius: 12,
                    cursor: portfolioUploading ? "not-allowed" : "pointer",
                    background: dark ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.03)",
                    opacity: portfolioUploading ? 0.6 : 1,
                  }}>
                    <span style={{ fontSize: 24 }}>🎬</span>
                    <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>
                      {portfolioUploading ? (lang === "ar" ? "جاري الرفع..." : "Uploading...") : (lang === "ar" ? "إضافة فيديو" : "Add Video")}
                    </span>
                  </label>
                  <input id="portfolio-video-input" type="file" accept="video/*" style={{ display: "none" }} disabled={portfolioUploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePortfolioFile(f, "video"); e.target.value = ""; }} />
                </div>
              </div>
            )}

            {steps[stepIdx] === "presence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PRESENCE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>
                      {f.icon} {(t.labels as any)[f.key]}
                    </label>
                    <input
                      style={inp}
                      dir="ltr"
                      value={presence[f.key] ?? ""}
                      placeholder={lang === "ar" ? "رابط الحساب" : "Profile URL"}
                      onChange={(e) => setPresence((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {steps[stepIdx] === "availability" && (
              <div>
                <label style={{ color: MUTED, fontSize: 13, display: "block", marginBottom: 12 }}>{t.labels.availability}</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["available", "unavailable"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setAvail(v)}
                      style={{
                        flex: 1, padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 700,
                        cursor: "pointer", fontFamily: "'Cairo', sans-serif", transition: "all 0.15s",
                        background:  avail === v ? (v === "available" ? "#00D26A" : ORANGE) : INP,
                        color:       avail === v ? "#fff" : MUTED,
                        border:      `1px solid ${avail === v ? (v === "available" ? "#00D26A" : ORANGE) : BORDER}`,
                      }}
                    >
                      {v === "available" ? `✅ ${t.labels.available}` : `⏸️ ${t.labels.unavailable}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {steps[stepIdx] === "review" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: MUTED, fontSize: 13, margin: "0 0 4px" }}>{t.reviewHint}</p>
                {ordered.map((s) => (
                  <div key={s.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`,
                  }}>
                    <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>
                      {ICONS[s.key] ?? "•"} {(t.sections as any)[s.key] ?? s.label[lang]}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: s.done ? GREEN_DONE : MUTED,
                    }}>
                      {s.key === "payment" ? t.locked : s.done ? `✓ ${t.done}` : t.notStarted}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* nav footer */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {stepIdx > 0 && (
                <button onClick={handleBack} style={ghostBtn}>{t.back}</button>
              )}
              <button onClick={handleSaveExit} disabled={saving} style={{ ...ghostBtn, flex: 1 }}>
                {saving ? t.saving : t.saveExit}
              </button>
              <button
                onClick={stepIdx < steps.length - 1 ? handleContinue : closeWizard}
                disabled={saving}
                style={{ ...saveBtn(saving), marginTop: 0, flex: 2 }}
              >
                {saving ? t.saving : stepIdx < steps.length - 1 ? t.continueBtn : t.finish}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
