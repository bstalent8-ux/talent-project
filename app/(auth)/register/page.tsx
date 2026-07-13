"use client";
export const runtime = 'edge';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type TalentType = "ugc" | "influencer" | "model" | "host" | "";
type Role       = "talent" | "brand";
type Step       = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface FormData {
  email: string; password: string; role: Role;
  talentType: TalentType;
  fullName: string; handle: string; city: string; gender: string;
  bio: string; category: string; specialties: string[];
  ageRange: string; height: string; weight: string;
  shoeSize: string; hairColor: string; eyeColor: string; languages: string;
  instagram: string; instagramFollowers: string;
  tiktok: string;   tiktokFollowers: string;
  youtube: string;  youtubeFollowers: string;
  linkedin: string; linkedinFollowers: string;
  avgReplyTime: string; avatarUrl: string;
}

const INIT: FormData = {
  email: "", password: "", role: "talent",
  talentType: "",
  fullName: "", handle: "", city: "", gender: "",
  bio: "", category: "", specialties: [],
  ageRange: "", height: "", weight: "", shoeSize: "",
  hairColor: "", eyeColor: "", languages: "",
  instagram: "", instagramFollowers: "",
  tiktok: "", tiktokFollowers: "",
  youtube: "", youtubeFollowers: "",
  linkedin: "", linkedinFollowers: "",
  avgReplyTime: "", avatarUrl: "",
};

const GOLD = "#FFB800";
const GOLD_BG  = "rgba(255,184,0,0.12)";
const GOLD_GLW = "rgba(255,184,0,0.35)";

const TALENT_TYPES = [
  { id: "ugc",        label: "UGC Creator",  icon: "🎬", desc: "بتعمل محتوى للبراندات" },
  { id: "influencer", label: "Influencer",   icon: "📱", desc: "عندك جمهور على السوشيال ميديا" },
  { id: "model",      label: "Model",        icon: "✨", desc: "تصوير وفاشون وإعلانات" },
  { id: "host",       label: "Host / MC",    icon: "🎙️", desc: "فعاليات وتقديم وبودكاست" },
];

const CATEGORIES = [
  "فاشون وموضة", "جمال وسكين كير", "طعام ومطبخ", "رياضة وفيتنس",
  "تكنولوجيا", "سفر وسياحة", "ترفيه وكوميديا", "لايف ستايل",
  "تعليم", "أطفال وعائلة", "ألعاب فيديو", "موسيقى وفن",
];

const SPECIALTIES_MAP: Record<string, string[]> = {
  ugc:        ["Unboxing", "Review", "Tutorial", "Story", "Reel", "Ad Creative", "Testimonial", "Demo"],
  influencer: ["Stories", "Reels", "Static Post", "TikTok Video", "YouTube Integration", "Live", "Collab"],
  model:      ["Photo Shoot", "E-commerce", "Runway", "Lookbook", "Campaign", "Editorial", "Commercial"],
  host:       ["Event Hosting", "Podcast", "Corporate MC", "Wedding", "Conference", "Virtual Event", "Live Stream"],
};

const AGE_RANGES  = ["18-22", "23-27", "28-32", "33-38", "39-45", "45+"];
const GENDERS     = [{ v: "male", l: "ذكر" }, { v: "female", l: "أنثى" }, { v: "other", l: "أخرى" }];
const HAIR_COLORS = ["أسود", "بني", "بلوند", "أحمر", "رمادي", "أشقر"];
const EYE_COLORS  = ["بني", "أخضر", "أزرق", "رمادي", "أسود", "عسلي"];
const REPLY_TIMES = ["خلال ساعة", "خلال 3 ساعات", "خلال 24 ساعة", "خلال 48 ساعة"];

const STEPS = [
  { n: 1, label: "الأكونت"  },
  { n: 2, label: "نوعك"    },
  { n: 3, label: "بياناتك" },
  { n: 4, label: "تخصصك"   },
  { n: 5, label: "مظهرك"   },
  { n: 6, label: "سوشيال"  },
  { n: 7, label: "صورتك"   },
];

// ─── Translations ─────────────────────────────────────────────────────────────
type Lang = "ar" | "en";
type Mode = "dark" | "light";

const TX = {
  ar: {
    haveAccount: "عندك حساب؟", login: "سجل دخول",
    steps: ["الأكونت","نوعك","بياناتك","تخصصك","مظهرك","سوشيال","صورتك"],
    talent: "✦ موهبة / كريتور", brand: "🏢 براند / عميل",
    step1Title: "إنشاء حسابك 🔐", step1Sub: "ابدأ رحلتك على منصة Talents",
    step2Title: "إنت مين؟ 🎯",    step2Sub: "اختار النوع الأقرب لشغلك",
    step3Title: "معلوماتك الأساسية 📝", step3Sub: "دي البيانات اللي هتتعرف بيها على المنصة",
    step4Title: "تخصصك وبيوك ✍️", step4Sub: "قول للبراندات إيه اللي بتعمله",
    step5Title: "بياناتك الشخصية 📋", step5Sub: "بتساعد البراندات يلاقوا التالنت المناسب — كلها اختياري",
    step6Title: "سوشيال ميديا 📱", step6Sub: "حط لينكاتك وعدد الفولورز — اختياري بس بيزود فرصك",
    step7Title: "صورتك الشخصية 📸", step7Sub: "صورة واضحة لوشك بتزود فرصك x3 عند البراندات",
    emailLabel: "البريد الإلكتروني", passLabel: "كلمة المرور (8 أحرف على الأقل)",
    fullName: "الاسم الكامل *", handleLabel: "الـ Handle (اسم المستخدم) *",
    handleHint: "رابطك: talents.com/your-handle", city: "المدينة",
    gender: "النوع *", male: "ذكر", female: "أنثى", other: "أخرى",
    bio: "البيو (عن نفسك)", bioPlaceholder: "عرّف نفسك في جملتين...",
    mainCat: "الكاتيجوري الرئيسية *", workType: "نوع الشغل اللي بتعمله (اختار أكتر من واحد)",
    ageRange: "الفئة العمرية", height: "الطول (سم)", weight: "الوزن (كجم)",
    shoeSize: "مقاس الحذاء", languages: "اللغات",
    hairColor: "لون الشعر", eyeColor: "لون العين",
    replyTime: "وقت الرد المعتاد", followers: "الفولورز",
    summary: "ملخص بياناتك", uploadPhoto: "رفع صورة", changePhoto: "تغيير",
    uploading: "جاري...", clickToUpload: "اضغط", next: "التالي →", back: "← رجوع",
    submit: "🚀 ابدأ رحلتك على Talents", saving: "جاري الحفظ...", loading: "جاري...",
    skip: "تخطي هذه الخطوة →", stepOf: (s: number) => `خطوة ${s} من 7`,
    stepNum: (s: number) => `الخطوة ${s} من 7`, lastStep: "الخطوة الأخيرة 🎉",
    requiredFields: "الرجاء إكمال الحقول المطلوبة *",
    sessionExpired: "انتهت الجلسة، ارجع وسجل مرة أخرى",
    namePH: "مثلاً: مايا خالد", handlePH: "مثلاً: maya-khaled", cityPH: "مثلاً: القاهرة",
    heightPH: "170", weightPH: "60", shoePH: "39", langPH: "عربي، إنجليزي",
    typeLabel: { ugc: "بتعمل محتوى للبراندات", influencer: "عندك جمهور على السوشيال ميديا", model: "تصوير وفاشون وإعلانات", host: "فعاليات وتقديم وبودكاست" },
  },
  en: {
    haveAccount: "Have an account?", login: "Sign in",
    steps: ["Account","Type","Info","Specialty","Appearance","Social","Photo"],
    talent: "✦ Talent / Creator", brand: "🏢 Brand / Client",
    step1Title: "Create your account 🔐", step1Sub: "Start your journey on Talents",
    step2Title: "Who are you? 🎯",         step2Sub: "Choose the type closest to your work",
    step3Title: "Basic information 📝",    step3Sub: "This is how brands will find you",
    step4Title: "Your specialty ✍️",       step4Sub: "Tell brands what you do",
    step5Title: "Personal details 📋",     step5Sub: "Helps brands find the right talent — all optional",
    step6Title: "Social media 📱",         step6Sub: "Add your links and followers — optional but helps",
    step7Title: "Profile photo 📸",        step7Sub: "A clear photo increases your chances x3 with brands",
    emailLabel: "Email", passLabel: "Password (at least 8 characters)",
    fullName: "Full name *", handleLabel: "Handle (username) *",
    handleHint: "Your link: talents.com/your-handle", city: "City",
    gender: "Gender *", male: "Male", female: "Female", other: "Other",
    bio: "Bio (about yourself)", bioPlaceholder: "Describe yourself in two sentences...",
    mainCat: "Main category *", workType: "Type of work you do (select multiple)",
    ageRange: "Age range", height: "Height (cm)", weight: "Weight (kg)",
    shoeSize: "Shoe size", languages: "Languages",
    hairColor: "Hair color", eyeColor: "Eye color",
    replyTime: "Average reply time", followers: "Followers",
    summary: "Your summary", uploadPhoto: "Upload photo", changePhoto: "Change",
    uploading: "Uploading...", clickToUpload: "Click", next: "Next →", back: "← Back",
    submit: "🚀 Start your journey on Talents", saving: "Saving...", loading: "Loading...",
    skip: "Skip this step →", stepOf: (s: number) => `Step ${s} of 7`,
    stepNum: (s: number) => `Step ${s} of 7`, lastStep: "Last step 🎉",
    requiredFields: "Please complete the required fields *",
    sessionExpired: "Session expired, please go back and register again",
    namePH: "e.g. Maya Khaled", handlePH: "e.g. maya-khaled", cityPH: "e.g. Cairo",
    heightPH: "170", weightPH: "60", shoePH: "39", langPH: "Arabic, English",
    typeLabel: { ugc: "Creating content for brands", influencer: "You have a social media audience", model: "Photography, fashion & ads", host: "Events, presenting & podcasts" },
  },
};

const CATEGORIES_AR = ["فاشون وموضة","جمال وسكين كير","طعام ومطبخ","رياضة وفيتنس","تكنولوجيا","سفر وسياحة","ترفيه وكوميديا","لايف ستايل","تعليم","أطفال وعائلة","ألعاب فيديو","موسيقى وفن"];
const CATEGORIES_EN = ["Fashion","Beauty & Skincare","Food & Kitchen","Sports & Fitness","Technology","Travel","Entertainment","Lifestyle","Education","Kids & Family","Gaming","Music & Art"];
const HAIR_AR = ["أسود","بني","بلوند","أحمر","رمادي","أشقر"];
const HAIR_EN = ["Black","Brown","Blonde","Red","Grey","Light Blonde"];
const EYE_AR  = ["بني","أخضر","أزرق","رمادي","أسود","عسلي"];
const EYE_EN  = ["Brown","Green","Blue","Grey","Black","Hazel"];
const REPLY_AR = ["خلال ساعة","خلال 3 ساعات","خلال 24 ساعة","خلال 48 ساعة"];
const REPLY_EN = ["Within 1 hour","Within 3 hours","Within 24 hours","Within 48 hours"];
const AGE_RANGES_ALL = ["18-22","23-27","28-32","33-38","39-45","45+"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step,      setStep]      = useState<Step>(1);
  const [form,      setForm]      = useState<FormData>(INIT);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState("");
  const [userId,    setUserId]    = useState<string | null>(null);
  const [lang,      setLang]      = useState<Lang>("ar");
  const [mode,      setMode]      = useState<Mode>("dark");
  const fileRef = useRef<HTMLInputElement>(null);

  const tx   = TX[lang];
  const dark = mode === "dark";
  const dir  = lang === "ar" ? "rtl" : "ltr";

  // Theme colors
  const BG      = dark ? "#0a0a0a"  : "#f5f5f0";
  const CARD    = dark ? "#111111"  : "#ffffff";
  const BORDER  = dark ? "#2a2a2a"  : "#e2e8f0";
  const INP     = dark ? "#1a1a1a"  : "#f8fafc";
  const TEXT    = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED   = dark ? "#6b7280"  : "#64748b";
  const SUBMUTED= dark ? "#475569"  : "#94a3b8";
  const CHIPBG  = dark ? "#1a1a1a"  : "#f1f5f9";

  const CATS     = lang === "ar" ? CATEGORIES_AR : CATEGORIES_EN;
  const HAIRS    = lang === "ar" ? HAIR_AR : HAIR_EN;
  const EYES     = lang === "ar" ? EYE_AR  : EYE_EN;
  const REPLIES  = lang === "ar" ? REPLY_AR : REPLY_EN;
  const GENDERS_T = [
    { v: "male",   l: tx.male },
    { v: "female", l: tx.female },
    { v: "other",  l: tx.other },
  ];
  const TALENT_TYPES_T = TALENT_TYPES.map(t => ({ ...t, desc: tx.typeLabel[t.id as keyof typeof tx.typeLabel] }));

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleSpecialty = (s: string) =>
    set("specialties", form.specialties.includes(s)
      ? form.specialties.filter(x => x !== s)
      : [...form.specialties, s]);

  const canProceed = (): boolean => {
    if (step === 1) return form.email.includes("@") && form.password.length >= 8;
    if (step === 2) return form.role === "brand" || !!form.talentType;
    if (step === 3) return form.fullName.trim().length > 1 && form.handle.trim().length > 2 && !!form.gender;
    if (step === 4) return !!form.category;
    return true;
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      fd.append("folder", process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER!);
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      set("avatarUrl", data.secure_url);
    } catch { setError("فشل رفع الصورة، حاول مرة أخرى"); }
    setUploading(false);
  };

  const handleNext = () => {
    if (!canProceed()) { setError(tx.requiredFields); return; }
    setError("");
    setStep((step + 1) as Step);
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const supabase = createClient();

      // Create auth user now (all data collected)
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { role: form.role } },
      });
      if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }
      const id = data.user?.id;
      if (!id) { setError(tx.sessionExpired); setLoading(false); return; }

      // Client: save minimal profile and go
      if (form.role === "brand") {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: id, role: "brand",
            profileData: {
              handle:    form.email.split("@")[0].toLowerCase(),
              full_name: form.email.split("@")[0],
            },
          }),
        });
        router.push("/explore");
        return;
      }

      const social_links: Record<string, string> = {};
      if (form.height)             social_links.height              = form.height;
      if (form.weight)             social_links.weight              = form.weight;
      if (form.shoeSize)           social_links.shoe_size           = form.shoeSize;
      if (form.hairColor)          social_links.hair_color          = form.hairColor;
      if (form.eyeColor)           social_links.eye_color           = form.eyeColor;
      if (form.languages)          social_links.languages           = form.languages;
      if (form.ageRange)           social_links.age_range           = form.ageRange;
      if (form.instagram)          social_links.instagram           = form.instagram;
      if (form.instagramFollowers) social_links.instagram_followers = form.instagramFollowers;
      if (form.tiktok)             social_links.tiktok              = form.tiktok;
      if (form.tiktokFollowers)    social_links.tiktok_followers    = form.tiktokFollowers;
      if (form.youtube)            social_links.youtube             = form.youtube;
      if (form.youtubeFollowers)   social_links.youtube_followers   = form.youtubeFollowers;
      if (form.linkedin)           social_links.linkedin            = form.linkedin;
      if (form.linkedinFollowers)  social_links.linkedin_followers  = form.linkedinFollowers;
      if (form.avgReplyTime)       social_links.avg_reply_time      = form.avgReplyTime;

      // gender + Arabic category label stored in social_links for display
      if (form.gender)   social_links.gender        = form.gender;
      if (form.category) social_links.category_ar   = form.category;

      // talent_category enum only has: "ugc" | "fashion"
      const categoryEn = form.talentType === "model" ? "fashion" : "ugc";

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          role: "talent",
          // profiles table: id, handle, full_name, avatar_url, city, bio, role
          profileData: {
            handle:     form.handle.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            full_name:  form.fullName,
            avatar_url: form.avatarUrl || null,
            city:       form.city || null,
            bio:        form.bio  || null,
          },
          // talent_profiles table: category, specialties, social_links, bio, packages, availability, profile_views
          talentProfileData: {
            category:     categoryEn,
            specialties:  form.specialties,
            social_links,
            bio:          form.bio        || null,
            packages:     [],
            availability: "available",
            profile_views: 0,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) { setError(result.error ?? "حدث خطأ"); setLoading(false); return; }

      router.push("/explore");
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ، حاول مرة أخرى");
    }
    setLoading(false);
  };

  const progressPct = ((step - 1) / 6) * 100;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: BG,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 16px 48px",
      fontFamily: "'Cairo', sans-serif",
      direction: dir,
    }}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: "640px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <Image src="/assets/logo.png" alt="Talents" width={110} height={32} style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Lang + Mode toggles */}
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{
            background: INP, border: `1px solid ${BORDER}`, borderRadius: "6px",
            padding: "4px 10px", cursor: "pointer", color: MUTED,
            fontSize: "12px", fontWeight: 600, fontFamily: "'Cairo', sans-serif",
          }}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={() => setMode(dark ? "light" : "dark")} style={{
            background: INP, border: `1px solid ${BORDER}`, borderRadius: "6px",
            padding: "4px 10px", cursor: "pointer", fontSize: "13px",
          }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link href="/login" style={{ color: MUTED, fontSize: "13px", textDecoration: "none" }}>
            {tx.haveAccount}{" "}<span style={{ color: GOLD, fontWeight: 700 }}>{tx.login}</span>
          </Link>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ width: "100%", maxWidth: "640px", marginBottom: "28px" }}>
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <div style={{ position: "absolute", top: "15px", left: 0, right: 0, height: "3px", backgroundColor: BORDER, borderRadius: "2px", zIndex: 0 }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              backgroundColor: GOLD,
              width: `${progressPct}%`,
              transition: "width 0.4s ease",
              boxShadow: `0 0 8px ${GOLD_GLW}`,
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{
                width: "30px", height: "30px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700, transition: "all 0.3s",
                backgroundColor: step >= s.n ? GOLD : (dark ? "#1e293b" : "#e2e8f0"),
                color:           step >= s.n ? "#000" : SUBMUTED,
                border:          step === s.n ? `2px solid ${GOLD}` : "2px solid transparent",
                boxShadow:       step === s.n ? `0 0 10px ${GOLD_GLW}` : "none",
              }}>
                {step > s.n ? "✓" : s.n}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {tx.steps.map((label, i) => (
            <span key={i} style={{
              width: "30px", textAlign: "center",
              fontSize: "10px", fontWeight: 700,
              color: step >= i + 1 ? GOLD : SUBMUTED,
              display: "block",
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "640px",
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: "20px",
        padding: "40px",
      }}>
        {error && (
          <div style={{
            backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px", padding: "10px 14px",
            color: "#ef4444", fontSize: "13px", marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.stepNum(1)}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step1Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step1Sub}</p>

            <div style={{ display: "flex", borderRadius: "10px", overflow: "hidden", border: `1px solid ${BORDER}`, marginBottom: "24px" }}>
              {([["talent", tx.talent], ["brand", tx.brand]] as [Role, string][]).map(([r, l]) => (
                <button key={r} onClick={() => set("role", r)} style={{
                  flex: 1, padding: "11px",
                  backgroundColor: form.role === r ? GOLD : "transparent",
                  color: form.role === r ? "#000" : MUTED,
                  border: "none", cursor: "pointer",
                  fontSize: "14px", fontWeight: 700,
                  fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
                }}>{l}</button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <TInput label={tx.emailLabel} placeholder="example@email.com" type="email"
                value={form.email} dir="ltr" onChange={v => set("email", v)}
                inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "6px" }}>{tx.passLabel}</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} placeholder="••••••••"
                    value={form.password} onChange={e => set("password", e.target.value)} dir="ltr"
                    style={{ width: "100%", padding: "10px 14px 10px 40px", backgroundColor: INP, border: `1px solid ${BORDER}`, borderRadius: "8px", color: TEXT, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Cairo', sans-serif" }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "14px" }}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", transition: "background-color 0.2s", backgroundColor: form.password.length >= i * 2 ? (i <= 1 ? "#ef4444" : i === 2 ? "#f59e0b" : GOLD) : BORDER }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.stepNum(2)}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step2Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step2Sub}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {TALENT_TYPES_T.map(t => (
                <button key={t.id} onClick={() => set("talentType", t.id as TalentType)} style={{
                  backgroundColor: form.talentType === t.id ? GOLD_BG : INP,
                  border: `2px solid ${form.talentType === t.id ? GOLD : BORDER}`,
                  borderRadius: "14px", padding: "20px 16px",
                  cursor: "pointer", textAlign: dir === "rtl" ? "right" : "left", transition: "all 0.2s",
                  boxShadow: form.talentType === t.id ? `0 0 16px ${GOLD_BG}` : "none",
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{t.icon}</div>
                  <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: "0 0 4px" }}>{t.label}</p>
                  <p style={{ color: MUTED, fontSize: "12px", margin: 0 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.stepNum(3)}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step3Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step3Sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <TInput label={tx.fullName} placeholder={tx.namePH} value={form.fullName} onChange={v => set("fullName", v)} inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
              <TInput label={tx.handleLabel} placeholder={tx.handlePH} value={form.handle} dir="ltr"
                onChange={v => set("handle", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                hint={tx.handleHint} inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
              <TInput label={tx.city} placeholder={tx.cityPH} value={form.city} onChange={v => set("city", v)} inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.gender}</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {GENDERS_T.map(g => (
                    <button key={g.v} onClick={() => set("gender", g.v)} style={{
                      flex: 1, padding: "10px",
                      backgroundColor: form.gender === g.v ? GOLD : INP,
                      color: form.gender === g.v ? "#000" : MUTED,
                      border: `1px solid ${form.gender === g.v ? GOLD : BORDER}`,
                      borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700,
                      fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
                    }}>{g.l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.stepNum(4)}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step4Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step4Sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "6px" }}>{tx.bio}</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3}
                  placeholder={tx.bioPlaceholder}
                  style={{ width: "100%", padding: "10px 14px", backgroundColor: INP, border: `1px solid ${BORDER}`, borderRadius: "8px", color: TEXT, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Cairo', sans-serif", resize: "vertical", lineHeight: "1.7" }} />
              </div>
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.mainCat}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {CATS.map((c, i) => (
                    <TChip key={c} label={c} active={form.category === CATEGORIES_AR[i]}
                      onClick={() => set("category", CATEGORIES_AR[i])} inp={INP} border={BORDER} muted={MUTED} />
                  ))}
                </div>
              </div>
              {form.talentType && (
                <div>
                  <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.workType}</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {(SPECIALTIES_MAP[form.talentType] ?? []).map(s => (
                      <TChip key={s} label={s} active={form.specialties.includes(s)}
                        onClick={() => toggleSpecialty(s)} outline inp={INP} border={BORDER} muted={MUTED} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 5 ── */}
        {step === 5 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.stepNum(5)}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step5Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step5Sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.ageRange}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {AGE_RANGES_ALL.map(a => (
                    <TChip key={a} label={a} active={form.ageRange === a} onClick={() => set("ageRange", a)} inp={INP} border={BORDER} muted={MUTED} />
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <TInput label={tx.height} placeholder={tx.heightPH} value={form.height} onChange={v => set("height", v)} dir="ltr" inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
                <TInput label={tx.weight} placeholder={tx.weightPH} value={form.weight} onChange={v => set("weight", v)} dir="ltr" inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
                <TInput label={tx.shoeSize} placeholder={tx.shoePH} value={form.shoeSize} onChange={v => set("shoeSize", v)} dir="ltr" inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
                <TInput label={tx.languages} placeholder={tx.langPH} value={form.languages} onChange={v => set("languages", v)} inp={INP} border={BORDER} text={TEXT} muted={MUTED} />
              </div>
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.hairColor}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {HAIRS.map((c, i) => (
                    <TChip key={c} label={c} active={form.hairColor === HAIR_AR[i]}
                      onClick={() => set("hairColor", HAIR_AR[i])} outline inp={INP} border={BORDER} muted={MUTED} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.eyeColor}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {EYES.map((c, i) => (
                    <TChip key={c} label={c} active={form.eyeColor === EYE_AR[i]}
                      onClick={() => set("eyeColor", EYE_AR[i])} outline inp={INP} border={BORDER} muted={MUTED} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 6 ── */}
        {step === 6 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.stepNum(6)}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step6Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step6Sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {([
                { platform: "Instagram", icon: "📸", uk: "instagram"  as keyof FormData, fk: "instagramFollowers" as keyof FormData, ph: "instagram.com/username" },
                { platform: "TikTok",    icon: "🎵", uk: "tiktok"     as keyof FormData, fk: "tiktokFollowers"    as keyof FormData, ph: "tiktok.com/@username" },
                { platform: "YouTube",   icon: "▶️", uk: "youtube"    as keyof FormData, fk: "youtubeFollowers"   as keyof FormData, ph: "youtube.com/@channel" },
                { platform: "LinkedIn",  icon: "💼", uk: "linkedin"   as keyof FormData, fk: "linkedinFollowers"  as keyof FormData, ph: "linkedin.com/in/name" },
              ]).map(s => (
                <div key={s.platform} style={{ backgroundColor: INP, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "18px" }}>{s.icon}</span>
                    <span style={{ color: TEXT, fontSize: "14px", fontWeight: 700 }}>{s.platform}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "8px" }}>
                    <input placeholder={s.ph} value={form[s.uk] as string}
                      onChange={e => set(s.uk, e.target.value)} dir="ltr"
                      style={{ width: "100%", padding: "10px 14px", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "8px", color: TEXT, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Cairo', sans-serif" }} />
                    <input placeholder={tx.followers} value={form[s.fk] as string}
                      onChange={e => set(s.fk, e.target.value)} dir="ltr"
                      style={{ width: "100%", padding: "10px 14px", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "8px", color: TEXT, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Cairo', sans-serif" }} />
                  </div>
                </div>
              ))}
              <div>
                <label style={{ color: MUTED, fontSize: "13px", display: "block", marginBottom: "8px" }}>{tx.replyTime}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {REPLIES.map((r, i) => (
                    <TChip key={r} label={r} active={form.avgReplyTime === REPLY_AR[i]}
                      onClick={() => set("avgReplyTime", REPLY_AR[i])} outline inp={INP} border={BORDER} muted={MUTED} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 7 ── */}
        {step === 7 && (
          <div>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "6px" }}>{tx.lastStep}</p>
            <h2 style={{ color: TEXT, fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>{tx.step7Title}</h2>
            <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>{tx.step7Sub}</p>
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <div onClick={() => fileRef.current?.click()} style={{
                  width: "130px", height: "130px", borderRadius: "50%",
                  border: `2px dashed ${form.avatarUrl ? GOLD : BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", backgroundColor: INP,
                  boxShadow: form.avatarUrl ? `0 0 20px ${GOLD_BG}` : "none", transition: "all 0.3s",
                }}>
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : uploading ? (
                    <span style={{ color: GOLD, fontSize: "12px" }}>{tx.uploading}</span>
                  ) : (
                    <div style={{ textAlign: "center", color: MUTED }}>
                      <div style={{ fontSize: "28px" }}>📷</div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px" }}>{tx.clickToUpload}</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                  padding: "7px 16px", backgroundColor: INP, border: `1px solid ${BORDER}`,
                  borderRadius: "8px", cursor: "pointer", color: MUTED, fontSize: "12px",
                  fontFamily: "'Cairo', sans-serif",
                }}>
                  {uploading ? tx.uploading : form.avatarUrl ? tx.changePhoto : tx.uploadPhoto}
                </button>
              </div>
              <div style={{ flex: 1, backgroundColor: INP, border: `1px solid ${GOLD}`, borderRadius: "14px", padding: "16px" }}>
                <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "2px", marginBottom: "10px" }}>{tx.summary}</p>
                {[
                  { l: lang === "ar" ? "النوع"      : "Type",     v: TALENT_TYPES.find(t => t.id === form.talentType)?.label ?? "" },
                  { l: lang === "ar" ? "الاسم"      : "Name",     v: form.fullName },
                  { l: "Handle",                                   v: form.handle ? `@${form.handle}` : "" },
                  { l: lang === "ar" ? "المدينة"    : "City",     v: form.city },
                  { l: lang === "ar" ? "الكاتيجوري": "Category",  v: form.category },
                  { l: "Instagram",                                v: form.instagram },
                  { l: "TikTok",                                   v: form.tiktok },
                ].filter(r => r.v).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: MUTED, fontSize: "12px" }}>{r.l}</span>
                    <span style={{ color: TEXT, fontSize: "12px", fontWeight: 600, direction: "ltr" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Buttons ── */}
        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          {step > 1 && (
            <button onClick={() => setStep((step - 1) as Step)} style={{
              flex: 1, padding: "12px", backgroundColor: INP, border: `1px solid ${BORDER}`,
              borderRadius: "10px", cursor: "pointer", color: MUTED,
              fontSize: "14px", fontWeight: 600, fontFamily: "'Cairo', sans-serif",
            }}>{tx.back}</button>
          )}
          {step < 7 ? (
            <button onClick={handleNext} disabled={loading} style={{
              flex: 2, padding: "13px",
              backgroundColor: canProceed() ? GOLD : (dark ? "#1e293b" : "#e2e8f0"),
              border: "none", borderRadius: "10px",
              cursor: loading ? "wait" : canProceed() ? "pointer" : "not-allowed",
              color: canProceed() ? "#000" : SUBMUTED,
              fontSize: "15px", fontWeight: 800,
              fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
              boxShadow: canProceed() ? `0 4px 15px ${GOLD_GLW}` : "none",
            }}>{loading ? tx.loading : tx.next}</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} style={{
              flex: 2, padding: "14px", backgroundColor: GOLD, border: "none",
              borderRadius: "10px", cursor: loading ? "wait" : "pointer",
              color: "#000", fontSize: "15px", fontWeight: 800,
              fontFamily: "'Cairo', sans-serif", boxShadow: `0 4px 20px ${GOLD_GLW}`,
            }}>{loading ? tx.saving : tx.submit}</button>
          )}
        </div>

        {step >= 5 && step < 7 && (
          <button onClick={() => setStep((step + 1) as Step)} style={{
            width: "100%", marginTop: "12px", padding: "8px",
            background: "none", border: "none", color: SUBMUTED,
            fontSize: "12px", cursor: "pointer", fontFamily: "'Cairo', sans-serif",
          }}>{tx.skip}</button>
        )}
      </div>

      <p style={{ color: SUBMUTED, fontSize: "12px", marginTop: "16px" }}>{tx.stepOf(step)}</p>
    </div>
  );
}

// ─── Sub-components (theme-aware) ─────────────────────────────────────────────
function TInput({ label, placeholder, value, onChange, hint, dir, type, inp, border, text, muted }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; hint?: string; dir?: string; type?: string;
  inp: string; border: string; text: string; muted: string;
}) {
  return (
    <div>
      <label style={{ color: muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>{label}</label>
      <input type={type ?? "text"} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} dir={dir ?? "rtl"}
        style={{ width: "100%", padding: "10px 14px", backgroundColor: inp, border: `1px solid ${border}`, borderRadius: "8px", color: text, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Cairo', sans-serif" }} />
      {hint && <p style={{ color: muted, fontSize: "11px", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

function TChip({ label, active, onClick, outline, inp, border, muted }: {
  label: string; active: boolean; onClick: () => void; outline?: boolean;
  inp: string; border: string; muted: string;
}) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px",
      backgroundColor: active ? (outline ? "rgba(255,184,0,0.12)" : "#FFB800") : inp,
      color:           active ? (outline ? "#FFB800" : "#000") : muted,
      border: `1px solid ${active ? "#FFB800" : border}`,
      borderRadius: "20px", cursor: "pointer",
      fontSize: "12px", fontWeight: 600,
      fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
    }}>
      {active && outline ? "✓ " : ""}{label}
    </button>
  );
}