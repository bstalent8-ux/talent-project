"use client";

import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { calculateCompletion, COMPLETION_THRESHOLDS } from "@/lib/profile-completion";

/* ─── translations ───────────────────────────────────────── */
const TX = {
  ar: {
    title:        "أكمل ملفك الشخصي",
    score:        (n: number) => `${n}% مكتمل`,
    tapToAdd:     "اضغط للإضافة",
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
      social:       "السوشيال ميديا",
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
      youtube:      "يوتيوب",
      linkedin:     "لينكد إن",
      available:    "متاح",
      unavailable:  "غير متاح",
      availability: "حالة الإتاحة",
    },
  },
  en: {
    title:        "Complete your profile",
    score:        (n: number) => `${n}% complete`,
    tapToAdd:     "Tap to add",
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
      social:       "Social media",
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
      youtube:      "YouTube",
      linkedin:     "LinkedIn",
      available:    "Available",
      unavailable:  "Unavailable",
      availability: "Availability status",
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
};

/* ─── props ──────────────────────────────────────────────── */
interface Props {
  profile:        any;
  talentProfile:  any;
  portfolioItems: any[];
  onUpdate:       () => void;
}

/* ─── tiny modal wrapper ─────────────────────────────────── */
function Modal({
  children, onClose, dark, title,
}: { children: React.ReactNode; onClose: () => void; dark: boolean; title: string }) {
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
        maxWidth:     460,
        width:        "100%",
        maxHeight:    "90vh",
        overflowY:    "auto",
        fontFamily:   "'Cairo', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ color: dark ? "#f1f5f9" : "#0f172a", fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
            border: "none", borderRadius: 8, width: 32, height: 32,
            cursor: "pointer", fontSize: 16, color: dark ? "#94a3b8" : "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function ProfileCompletionCard({ profile, talentProfile, portfolioItems, onUpdate }: Props) {
  const { lang, dark } = useSite();
  const t    = TX[lang];
  const dir  = lang === "ar" ? "rtl" : "ltr";

  const TEXT   = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED  = dark ? "#64748b"  : "#94a3b8";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const CARD   = dark ? "#0b1622"  : "#ffffff";
  const INP    = dark ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const TEAL   = "#00C9B1";
  const ORANGE = "#FF6B2B";

  const [active,    setActive]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  /* per-modal local state */
  const sl = talentProfile?.social_links ?? {};
  const [personal,     setPersonal]     = useState({ full_name: profile?.full_name ?? "", city: profile?.city ?? "" });
  const [bio,          setBio]          = useState(profile?.bio ?? talentProfile?.bio ?? "");
  const [category,     setCategory]     = useState(talentProfile?.category ?? "");
  const [social,       setSocial]       = useState({
    instagram: sl.instagram ?? "", tiktok: sl.tiktok ?? "",
    youtube:   sl.youtube   ?? "", linkedin: sl.linkedin ?? "",
  });
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

  /* physical state */
  const [physical, setPhysical] = useState({
    height:     sl.height     ?? "",
    weight:     sl.weight     ?? "",
    age:        sl.age        ?? "",
    hair_color: sl.hair_color ?? "",
    shoe_size:  sl.shoe_size  ?? "",
    languages:  sl.languages  ?? "",
    dialect:    sl.dialect    ?? "",
  });

  const { score, sections } = calculateCompletion(profile, talentProfile, portfolioItems);

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

  const incomplete = sections.filter((s) => !s.done);

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
      if (data.avatar_url) {
        onUpdate();
        setActive(null);
      }
    } catch {}
    setUploading(false);
  };

  /* ── save personal ── */
  const savePersonal = async () => {
    if (!personal.full_name.trim()) return;
    setSaving(true);
    try { await patchSection("personal", { full_name: personal.full_name.trim(), city: personal.city.trim() }); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save bio ── */
  const saveBio = async () => {
    if (!bio.trim()) return;
    setSaving(true);
    try { await patchSection("bio", { bio: bio.trim() }); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save category ── */
  const saveCategory = async () => {
    if (!category) return;
    setSaving(true);
    try { await patchSection("categories", { category }); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save social ── */
  const saveSocial = async () => {
    const hasAny = Object.values(social).some((v) => v.trim().length > 2);
    if (!hasAny) return;
    setSaving(true);
    try { await patchSection("social", social); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save availability ── */
  const saveAvailability = async () => {
    setSaving(true);
    try { await patchSection("availability", { availability: avail }); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save physical ── */
  const savePhysical = async () => {
    const hasAny = Object.values(physical).some(v => v.trim().length > 0);
    if (!hasAny) return;
    setSaving(true);
    try { await patchSection("physical", physical); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save packages ── */
  const savePackages = async () => {
    if (!packages.length) return;
    setSaving(true);
    try { await patchSection("packages", { packages }); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── save addons ── */
  const saveAddons = async () => {
    if (!addons.length) return;
    setSaving(true);
    try { await patchSection("usage_addons", { usage_addons: addons }); onUpdate(); } catch {}
    setSaving(false); setActive(null);
  };

  /* ── card click handler ── */
  const handleCardClick = (key: string) => {
    if (key === "payment") { return; }
    setSaving(false);
    setActive(key);
  };

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

  /* ─── render ──────────────────────────────────────────── */
  return (
    <>
      <div style={{ marginBottom: 28, fontFamily: "'Cairo', sans-serif" }} dir={dir}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "0 0 2px" }}>{t.title}</h3>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.score(score)}</p>
          </div>
          {/* Mini progress bar */}
          <div style={{ flex: 1, maxWidth: 200, minWidth: 100 }}>
            <div style={{ height: 6, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
          </div>
          <span style={{ color: scoreColor, fontSize: 20, fontWeight: 800, minWidth: 52, textAlign: "center" }}>{score}%</span>
        </div>

        {/* Incomplete section cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {incomplete.map((s) => {
            const isLocked    = s.key === "payment";
            const isUploading = uploading && s.key === "avatar";

            return (
              <button
                key={s.key}
                onClick={() => !isUploading && handleCardClick(s.key)}
                disabled={isUploading}
                style={{
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "flex-start",
                  gap:            8,
                  padding:        "14px 16px",
                  background:     isLocked
                    ? (dark ? "rgba(255,255,255,0.02)" : "#f8fafc")
                    : CARD,
                  border:         `1px solid ${isLocked ? BORDER : (dark ? "rgba(0,201,177,0.2)" : "rgba(0,201,177,0.25)")}`,
                  borderRadius:   14,
                  cursor:         isLocked ? "not-allowed" : "pointer",
                  textAlign:      lang === "ar" ? "right" : "left",
                  transition:     "transform 0.15s, box-shadow 0.15s",
                  opacity:        isLocked ? 0.5 : 1,
                  position:       "relative",
                  overflow:       "hidden",
                }}
                onMouseEnter={(e) => { if (!isLocked) (e.currentTarget.style.transform = "translateY(-2px)"), (e.currentTarget.style.boxShadow = `0 6px 20px ${dark ? "rgba(0,201,177,0.15)" : "rgba(0,201,177,0.12)"}`); }}
                onMouseLeave={(e) => { (e.currentTarget.style.transform = "none"), (e.currentTarget.style.boxShadow = "none"); }}
              >
                {/* Score badge */}
                <div style={{
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "space-between",
                  width:        "100%",
                }}>
                  <span style={{ fontSize: 22 }}>{ICONS[s.key]}</span>
                  <span style={{
                    background:   isLocked ? "rgba(148,163,184,0.15)" : "rgba(0,201,177,0.12)",
                    color:        isLocked ? MUTED : TEAL,
                    padding:      "2px 8px",
                    borderRadius: 20,
                    fontSize:     12,
                    fontWeight:   700,
                  }}>
                    {isLocked ? "—" : `+${s.weight}%`}
                  </span>
                </div>

                {/* Label */}
                <div>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>
                    {(t.sections as any)[s.key]}
                  </p>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
                    {isUploading ? t.uploading : isLocked ? t.locked : t.tapToAdd}
                  </p>
                </div>

                {/* uploading overlay */}
                {isUploading && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,201,177,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `3px solid ${TEAL}`, borderTopColor: "transparent",
                      animation: "spin 0.7s linear infinite",
                    }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Locked features strip */}
        {(() => {
          const locked = [
            { key: "applyToJobs",    label: t.features.applyToJobs,    n: COMPLETION_THRESHOLDS.applyToJobs },
            { key: "appearInSearch", label: t.features.appearInSearch,  n: COMPLETION_THRESHOLDS.appearInSearch },
            { key: "receiveBriefs",  label: t.features.receiveBriefs,   n: COMPLETION_THRESHOLDS.receiveBriefs },
            { key: "becomeVerified", label: t.features.becomeVerified,  n: COMPLETION_THRESHOLDS.becomeVerified },
          ].filter((f) => score < f.n);
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
          M O D A L S
      ═══════════════════════════════════════════════════ */}

      {/* ── Portfolio modal ── */}
      {active === "portfolio" && (
        <Modal title={`${ICONS.portfolio} ${t.sections.portfolio}`} onClose={() => setActive(null)} dark={dark}>
          <div dir={dir} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* existing items */}
            {portfolioMedia.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {portfolioMedia.map((item: any) => (
                  <div key={item.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", background: dark ? "#1e293b" : "#f1f5f9" }}>
                    {item.media_type === "video" ? (
                      <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                    ) : (
                      <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <button
                      onClick={() => handleDeletePortfolio(item.id)}
                      style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(220,38,38,0.85)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* caption input */}
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

            {/* upload buttons */}
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

            {portfolioMedia.length > 0 && (
              <button onClick={() => setActive(null)} style={{ ...saveBtn(false), background: TEAL }}>
                {lang === "ar" ? "تم ✓" : "Done ✓"}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* ── Avatar modal ── */}
      {active === "avatar" && (
        <Modal title={`${ICONS.avatar} ${t.sections.avatar}`} onClose={() => setActive(null)} dark={dark}>
          <label
            htmlFor="completion-avatar-input"
            style={{
              display: "block", border: `2px dashed ${TEAL}`, borderRadius: 14, padding: "32px 20px",
              textAlign: "center", cursor: "pointer",
              background: dark ? "rgba(0,201,177,0.04)" : "rgba(0,201,177,0.03)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{t.uploadPhoto}</p>
            <p style={{ color: MUTED, fontSize: 12, margin: "0 0 16px" }}>{t.uploadHint}</p>
            <span style={{ display: "inline-block", padding: "9px 20px", background: TEAL, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              {uploading ? t.uploading : t.choose}
            </span>
          </label>
          <input
            id="completion-avatar-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarFile(file);
            }}
          />
        </Modal>
      )}

      {/* ── Personal info modal ── */}
      {active === "personal" && (
        <Modal title={`${ICONS.personal} ${t.sections.personal}`} onClose={() => setActive(null)} dark={dark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }} dir={dir}>
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
            <button onClick={savePersonal} disabled={saving || !personal.full_name.trim()} style={saveBtn(saving || !personal.full_name.trim())}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Bio modal ── */}
      {active === "bio" && (
        <Modal title={`${ICONS.bio} ${t.sections.bio}`} onClose={() => setActive(null)} dark={dark}>
          <div dir={dir}>
            <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.labels.bio}</label>
            <textarea
              rows={5}
              style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
              value={bio}
              placeholder={t.labels.bioHint}
              onChange={(e) => setBio(e.target.value)}
            />
            <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0", textAlign: lang === "ar" ? "left" : "right" }}>
              {bio.length} / 500
            </p>
            <button onClick={saveBio} disabled={saving || !bio.trim()} style={saveBtn(saving || !bio.trim())}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Category modal ── */}
      {active === "categories" && (
        <Modal title={`${ICONS.categories} ${t.sections.categories}`} onClose={() => setActive(null)} dark={dark}>
          <div dir={dir}>
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
            <button onClick={saveCategory} disabled={saving || !category} style={saveBtn(saving || !category)}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Social links modal ── */}
      {active === "social" && (
        <Modal title={`${ICONS.social} ${t.sections.social}`} onClose={() => setActive(null)} dark={dark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }} dir={dir}>
            {[
              { key: "instagram", icon: "📸", placeholder: "@username أو رابط الحساب" },
              { key: "tiktok",    icon: "🎵", placeholder: "@username أو رابط الحساب" },
              { key: "youtube",   icon: "▶️", placeholder: "رابط القناة" },
              { key: "linkedin",  icon: "💼", placeholder: "رابط LinkedIn" },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>
                  {f.icon} {(t.labels as any)[f.key]}
                </label>
                <input
                  style={inp}
                  dir="ltr"
                  value={(social as any)[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => setSocial((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              onClick={saveSocial}
              disabled={saving || !Object.values(social).some((v) => v.trim().length > 2)}
              style={saveBtn(saving || !Object.values(social).some((v) => v.trim().length > 2))}
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Physical details modal ── */}
      {active === "physical" && (
        <Modal title={`${ICONS.physical} ${t.sections.physical}`} onClose={() => setActive(null)} dark={dark}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} dir={dir}>
            {([
              ["height",     lang === "ar" ? "الطول (سم)"     : "Height (cm)",    "ltr"],
              ["weight",     lang === "ar" ? "الوزن (كجم)"    : "Weight (kg)",    "ltr"],
              ["age",        lang === "ar" ? "العمر"           : "Age",            "ltr"],
              ["hair_color", lang === "ar" ? "لون الشعر"      : "Hair Color",     "rtl"],
              ["shoe_size",  lang === "ar" ? "مقاس الجزمة"    : "Shoe Size",      "ltr"],
              ["languages",  lang === "ar" ? "اللغة"          : "Language",       "rtl"],
              ["dialect",    lang === "ar" ? "اللهجة"         : "Dialect",        "rtl"],
            ] as [string,string,string][]).map(([k, label, d]) => (
              <div key={k} style={k === "languages" || k === "dialect" ? { gridColumn: "1/-1" } : {}}>
                <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  value={(physical as any)[k]}
                  onChange={e => setPhysical(p => ({ ...p, [k]: e.target.value }))}
                  style={{ ...inp, direction: d as any }}
                  placeholder={label}
                />
              </div>
            ))}
          </div>
          <button
            onClick={savePhysical}
            disabled={saving || !Object.values(physical).some(v => v.trim().length > 0)}
            style={saveBtn(saving || !Object.values(physical).some(v => v.trim().length > 0))}
          >
            {saving ? t.saving : t.save}
          </button>
        </Modal>
      )}

      {/* ── Packages modal ── */}
      {active === "packages" && (
        <Modal title={`${ICONS.packages} ${t.sections.packages}`} onClose={() => setActive(null)} dark={dark}>
          <div dir={dir} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            <button onClick={savePackages} disabled={saving || !packages.length} style={saveBtn(saving || !packages.length)}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Usage Add-ons modal ── */}
      {active === "usage_addons" && (
        <Modal title={`${ICONS.usage_addons} ${t.sections.usage_addons}`} onClose={() => setActive(null)} dark={dark}>
          <div dir={dir} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            <button onClick={saveAddons} disabled={saving || !addons.length} style={saveBtn(saving || !addons.length)}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Availability modal ── */}
      {active === "availability" && (
        <Modal title={`${ICONS.availability} ${t.sections.availability}`} onClose={() => setActive(null)} dark={dark}>
          <div dir={dir}>
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
            <button onClick={saveAvailability} disabled={saving} style={saveBtn(saving)}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
