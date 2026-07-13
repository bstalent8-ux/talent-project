"use client";
export const runtime = 'edge';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Save, X, Lock, Shield, Star, Eye,
  MapPin, Crown, Zap, Calendar, Heart, Share2,
  MessageCircle, CheckCircle, Plus, Camera, Play,
  Upload, Trash2,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";

/* ─── colour helpers ─── */
const GREEN = "#00D26A";
const GOLD  = "#F4B740";

type MediaItem  = { id: string; url: string; media_type: "photo" | "video"; caption: string | null };
type PkgItem    = { id: string; name: string; price: string; popular: boolean; features: string[] };
type AddonItem  = { key: string; label: string; price: number };

const TX = {
  ar: {
    dashboard:      "لوحة التحكم",
    editProfile:    "تعديل البروفايل",
    saveChanges:    "حفظ التغييرات",
    saving:         "جاري الحفظ...",
    cancel:         "إلغاء",
    saved:          "تم الحفظ ✓",
    loading:        "جاري التحميل...",
    noProfile:      "لا يوجد بروفايل",
    fullName:       "الاسم الكامل",
    handle:         "اسم المستخدم",
    city:           "المدينة",
    bio:            "البيو",
    bioPlaceholder: "اكتب نبذة عنك...",
    changePhoto:    "تغيير الصورة",
    uploading:      "جاري الرفع...",
    memberSince:    "عضو منذ",
    views:          "مشاهدة",
    reviews:        "تقييم",
    availability:   "الحالة",
    available:      "متاح",
    unavailable:    "غير متاح",
    readOnly:       "لا يمكن التعديل",
    instagram:      "إنستقرام",
    tiktok:         "تيك توك",
    youtube:        "يوتيوب",
    linkedin:       "لينكد إن",
    height:         "الطول (سم)",
    weight:         "الوزن (كجم)",
    hairColor:      "لون الشعر",
    eyeColor:       "لون العين",
    languages:      "اللغات",
    ageRange:       "الفئة العمرية",
    portfolio:      "البورتفوليو",
    addPhoto:       "إضافة صورة",
    addVideo:       "إضافة فيديو",
    noMedia:        "لا يوجد محتوى بعد",
    captionPlaceholder: "تعليق (اختياري)...",
    socialLinks:    "السوشيال ميديا",
    physicalInfo:   "البيانات الشخصية",
    verified:       "موثّق",
    fastResponse:   "رد سريع",
    premium:        "بريميوم",
    message:        "رسالة",
    bookNow:        "احجز الآن",
    favorite:       "المفضلة",
    share:          "مشاركة",
    escrowTitle:    "نظام الدفع الآمن (Escrow)",
    escrowSteps:    ["الدفع محجوز","تسليم العمل","الموافقة","الإفراج عن الأموال"],
    viewPublic:     "عرض الصفحة العامة",
    brands:         "العلامات التجارية المتعاونة",
    brandPlaceholder: "اسم البراند...",
    addBrand:       "إضافة",
    noBrands:       "لا توجد علامات تجارية بعد",
    packages:       "الباقات والأسعار",
    addPackage:     "إضافة باقة",
    pkgName:        "اسم الباقة",
    pkgPrice:       "السعر (جنيه)",
    pkgFeatures:    "المميزات",
    pkgPopular:     "الأكثر طلباً",
    addFeature:     "إضافة ميزة",
    usageAddons:    "حقوق الاستخدام الإضافية",
    addAddon:       "إضافة حق",
    addonLabel:     "الاسم",
    addonPrice:     "السعر (جنيه)",
  },
  en: {
    dashboard:      "Dashboard",
    editProfile:    "Edit Profile",
    saveChanges:    "Save Changes",
    saving:         "Saving...",
    cancel:         "Cancel",
    saved:          "Saved ✓",
    loading:        "Loading...",
    noProfile:      "No profile found",
    fullName:       "Full Name",
    handle:         "Username",
    city:           "City",
    bio:            "Bio",
    bioPlaceholder: "Write something about yourself...",
    changePhoto:    "Change Photo",
    uploading:      "Uploading...",
    memberSince:    "Member since",
    views:          "views",
    reviews:        "reviews",
    availability:   "Status",
    available:      "Available",
    unavailable:    "Unavailable",
    readOnly:       "Cannot be edited",
    instagram:      "Instagram",
    tiktok:         "TikTok",
    youtube:        "YouTube",
    linkedin:       "LinkedIn",
    height:         "Height (cm)",
    weight:         "Weight (kg)",
    hairColor:      "Hair Color",
    eyeColor:       "Eye Color",
    languages:      "Languages",
    ageRange:       "Age Range",
    portfolio:      "Portfolio",
    addPhoto:       "Add Photo",
    addVideo:       "Add Video",
    noMedia:        "No media yet",
    captionPlaceholder: "Caption (optional)...",
    socialLinks:    "Social Media",
    physicalInfo:   "Personal Info",
    verified:       "Verified",
    fastResponse:   "Fast Response",
    premium:        "Premium",
    message:        "Message",
    bookNow:        "Book Now",
    favorite:       "Favorite",
    share:          "Share",
    escrowTitle:    "Secure Payment System (Escrow)",
    escrowSteps:    ["Payment Held","Work Delivery","Approval","Fund Release"],
    viewPublic:     "View Public Page",
    brands:         "Collaborated Brands",
    brandPlaceholder: "Brand name...",
    addBrand:       "Add",
    noBrands:       "No brands yet",
    packages:       "Packages & Pricing",
    addPackage:     "Add Package",
    pkgName:        "Package Name",
    pkgPrice:       "Price (EGP)",
    pkgFeatures:    "Features",
    pkgPopular:     "Most Popular",
    addFeature:     "Add Feature",
    usageAddons:    "Usage Rights Add-ons",
    addAddon:       "Add Add-on",
    addonLabel:     "Name",
    addonPrice:     "Price (EGP)",
  },
};

export default function DashboardPage() {
  const router   = useRouter();
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const fileRef  = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const t = TX[lang];

  const CARD    = dark ? "#0D1623" : "#FFFFFF";
  const BORDER  = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT    = dark ? "#FFFFFF" : "#0F172A";
  const MUTED   = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const BG      = dark ? "#050B12" : "#F1F5F9";
  const INP     = dark ? "#0d1527" : "#f8fafc";

  const [status,        setStatus]        = useState<"loading"|"ready"|"none">("loading");
  const [edit,          setEdit]          = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveMsg,       setSaveMsg]       = useState("");
  const [saveErr,       setSaveErr]       = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [mediaUploading,setMediaUploading]= useState(false);
  const [caption,       setCaption]       = useState("");
  const [media,         setMedia]         = useState<MediaItem[]>([]);
  const [profile,       setProfile]       = useState<any>(null);
  const [tp,            setTp]            = useState<any>(null);
  const [form,          setForm]          = useState<any>({});
  const [packages,      setPackages]      = useState<PkgItem[]>([]);
  const [addons,        setAddons]        = useState<AddonItem[]>([]);
  const [brands,        setBrands]        = useState<string[]>([]);
  const [newBrand,      setNewBrand]      = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/me");
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) { setStatus("none"); return; }
      const { profile: prof, talentProfile: talentProf, portfolioItems } = await res.json();
      setProfile(prof);
      setTp(talentProf ?? null);
      setMedia(portfolioItems ?? []);
      setPackages(talentProf?.packages ?? []);
      setAddons(talentProf?.social_links?.usage_addons ?? []);
      setBrands(talentProf?.social_links?.brands ?? []);
      const sl = (talentProf?.social_links ?? {}) as Record<string,string>;
      setForm({
        full_name:    prof.full_name    ?? "",
        handle:       prof.handle       ?? "",
        city:         prof.city         ?? "",
        bio:          prof.bio ?? talentProf?.bio ?? "",
        avatar_url:   prof.avatar_url   ?? "",
        instagram:    sl.instagram      ?? "",
        tiktok:       sl.tiktok         ?? "",
        youtube:      sl.youtube        ?? "",
        linkedin:     sl.linkedin       ?? "",
        height:       sl.height         ?? "",
        weight:       sl.weight         ?? "",
        hair_color:   sl.hair_color     ?? "",
        eye_color:    sl.eye_color      ?? "",
        languages:    sl.languages      ?? "",
        age_range:    sl.age_range      ?? "",
        availability: talentProf?.availability ?? "available",
      });
      setStatus("ready");
    })();
  }, []);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      fd.append("folder", process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents");
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) setForm((f: any) => ({ ...f, avatar_url: data.secure_url }));
    } catch {}
    setUploading(false);
  };

  const handleMediaUpload = async (file: File, type: "photo"|"video") => {
    setMediaUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      fd.append("folder", (process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents") + "/portfolio");
      const endpoint = type === "video"
        ? `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`
        : `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
      const res  = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        const saveRes = await fetch("/api/portfolio", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.secure_url, media_type: type, caption: caption || null }),
        });
        const saved = await saveRes.json();
        if (saved.item) { setMedia(prev => [saved.item, ...prev]); setCaption(""); }
      }
    } catch {}
    setMediaUploading(false);
  };

  const handleDeleteMedia = async (id: string) => {
    await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const social_links = {
      ...(tp?.social_links ?? {}),
      instagram: form.instagram, tiktok: form.tiktok,
      youtube: form.youtube, linkedin: form.linkedin,
      height: form.height, weight: form.weight,
      hair_color: form.hair_color, eye_color: form.eye_color,
      languages: form.languages, age_range: form.age_range,
      usage_addons: addons,
      brands,
    };
    setSaveErr("");
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        role: profile.role ?? "talent",
        profileData: { full_name: form.full_name, handle: form.handle, city: form.city, bio: form.bio, avatar_url: form.avatar_url || null },
        ...(tp ? { talentProfileData: { category: tp.category, specialties: tp.specialties ?? [], social_links, bio: form.bio, availability: form.availability, packages, profile_views: tp.profile_views ?? 0 } } : {}),
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setSaveErr(json.error ?? "حدث خطأ أثناء الحفظ");
      setSaving(false);
      return;
    }
    setProfile((p: any) => ({ ...p, full_name: form.full_name, handle: form.handle, city: form.city, bio: form.bio, avatar_url: form.avatar_url }));
    if (tp) setTp((t: any) => ({ ...t, social_links, availability: form.availability, packages }));
    setAddons(addons);
    setBrands(brands);
    setSaving(false);
    setSaveMsg(t.saved);
    setTimeout(() => { setSaveMsg(""); setEdit(false); }, 1500);
  };

  const setF = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  /* ── package helpers ── */
  const addPkg = () => setPackages(ps => [...ps, { id: crypto.randomUUID(), name: "", price: "", popular: false, features: [] }]);
  const setPkg = (id: string, key: keyof PkgItem, val: any) => setPackages(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p));
  const delPkg = (id: string) => setPackages(ps => ps.filter(p => p.id !== id));
  const addFeat = (id: string) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: [...p.features, ""] } : p));
  const setFeat = (id: string, fi: number, val: string) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: p.features.map((f, i) => i === fi ? val : f) } : p));
  const delFeat = (id: string, fi: number) => setPackages(ps => ps.map(p => p.id === id ? { ...p, features: p.features.filter((_, i) => i !== fi) } : p));

  /* ── addon helpers ── */
  const addAddonItem = () => setAddons(as => [...as, { key: crypto.randomUUID(), label: "", price: 0 }]);
  const setAddon = (key: string, field: keyof AddonItem, val: any) => setAddons(as => as.map(a => a.key === key ? { ...a, [field]: val } : a));
  const delAddon = (key: string) => setAddons(as => as.filter(a => a.key !== key));

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    backgroundColor: INP, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT, fontSize: 14,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Cairo', sans-serif",
  };

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: BG }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", borderWidth: 3, borderStyle: "solid", borderColor: `${GREEN} ${BORDER} ${BORDER} ${BORDER}`, animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: MUTED, fontSize: 14, fontFamily: "'Cairo',sans-serif" }}>{t.loading}</p>
      </div>
    </div>
  );

  if (status === "none") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: BG }}>
      <p style={{ color: MUTED, fontFamily: "'Cairo',sans-serif" }}>{t.noProfile}</p>
    </div>
  );

  const displayName = profile.full_name || profile.handle || "";
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })
    : "";
  const tags = tp?.specialties?.slice(0, 3) ?? [];
  const sl   = tp?.social_links ?? {};

  const badges = [
    tp?.verified     && { icon: <Shield size={11} />,  label: t.verified },
    tp?.fast_response && { icon: <Zap size={11} />,    label: t.fastResponse },
    tp?.premium      && { icon: <Crown size={11} />,   label: t.premium },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} style={{ fontFamily: "'Cairo', sans-serif", backgroundColor: BG, minHeight: "100vh", paddingBottom: 110 }}>

      {/* ─── Save bar (edit mode) ─── */}
      <AnimatePresence>
        {edit && (
          <motion.div
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            style={{
              position: "sticky", top: 60, zIndex: 50,
              backgroundColor: dark ? "#0A121C" : "#fff",
              borderBottom: `1px solid ${BORDER}`,
              padding: "10px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}
          >
            <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{t.editProfile}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saveErr && <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>{saveErr}</span>}
              <button onClick={() => { setEdit(false); setSaveErr(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                <X size={14} />{t.cancel}
              </button>
              <button onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", backgroundColor: saveErr ? "#ef4444" : GREEN, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, cursor: saving ? "wait" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                <Save size={14} />{saveMsg || (saving ? t.saving : t.saveChanges)}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px" }}>

        {/* ─── Top action bar ─── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ color: TEXT, fontSize: 20, fontWeight: 900, margin: 0 }}>{t.dashboard}</h1>
          <div style={{ display: "flex", gap: 10 }}>
            {profile.handle && (
              <a href={`/talent/${profile.handle}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <Eye size={14} />{t.viewPublic}
              </a>
            )}
            {!edit && (
              <button onClick={() => setEdit(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", backgroundColor: GREEN, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                <Pencil size={14} />{t.editProfile}
              </button>
            )}
          </div>
        </div>

        {/* ─── Hero card ─── */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? 16 : 24, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr 320px", gap: isMobile ? 20 : 24, alignItems: "start" }}>

            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 200, height: isMobile ? 220 : 260, borderRadius: 14, overflow: "hidden", background: dark ? "linear-gradient(160deg,#1e3a5f,#0d2137,#050B12)" : "linear-gradient(160deg,#dbeafe,#bfdbfe,#93c5fd)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(edit ? form.avatar_url : profile.avatar_url) ? (
                  <img src={edit ? form.avatar_url : profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: "rgba(0,210,106,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: GREEN }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {edit && (
                <>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", backgroundColor: GREEN, border: "none", borderRadius: 20, color: "#000", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Cairo',sans-serif" }}>
                    <Camera size={12} />{uploading ? t.uploading : t.changePhoto}
                  </button>
                </>
              )}
            </div>

            {/* Info / Edit fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              {edit ? (
                <>
                  <div>
                    <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{t.fullName}</label>
                    <input value={form.full_name} onChange={e => setF("full_name", e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{t.handle}</label>
                    <input value={form.handle} onChange={e => setF("handle", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))} style={{ ...inp, direction: "ltr" }} />
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{t.city}</label>
                    <input value={form.city} onChange={e => setF("city", e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{t.bio}</label>
                    <textarea value={form.bio} onChange={e => setF("bio", e.target.value)} rows={3} placeholder={t.bioPlaceholder} style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
                  </div>
                  {tp && (
                    <div>
                      <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{t.availability}</label>
                      <select value={form.availability} onChange={e => setF("availability", e.target.value)} style={inp}>
                        <option value="available">{t.available}</option>
                        <option value="unavailable">{t.unavailable}</option>
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 style={{ color: TEXT, fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: 0 }}>{displayName}</h1>
                  {tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {tags.map((tag: string) => (
                        <span key={tag} style={{ backgroundColor: "rgba(0,210,106,0.08)", color: GREEN, border: "1px solid rgba(0,210,106,0.2)", borderRadius: 20, padding: "3px 12px", fontSize: 12 }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 13, flexWrap: "wrap" }}>
                    <MapPin size={13} color={GREEN} />
                    <span>{profile.city}</span>
                    {memberSince && <><span style={{ opacity: 0.4 }}>•</span><span>{t.memberSince} {memberSince}</span></>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    {/* RATING — locked */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Star size={14} color={GOLD} fill={GOLD} />
                      <span style={{ color: TEXT, fontWeight: 800, fontSize: 14 }}>{tp?.avg_rating ? Number(tp.avg_rating).toFixed(1) : "—"}</span>
                      <span style={{ color: MUTED, fontSize: 12 }}>({tp?.total_reviews ?? 0} {t.reviews})</span>
                      <span title={t.readOnly} style={{ display: "flex", alignItems: "center", marginRight: 2 }}><Lock size={11} color={MUTED} /></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: MUTED, fontSize: 12 }}>
                      <Eye size={13} /><span>{tp?.profile_views ?? 0} {t.views}</span>
                      <span title={t.readOnly}><Lock size={11} color={MUTED} /></span>
                    </div>
                  </div>
                  {badges.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {badges.map(b => (
                        <span key={b.label} style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgba(0,210,106,0.08)", color: GREEN, border: "1px solid rgba(0,210,106,0.2)", borderRadius: 20, padding: "3px 12px", fontSize: 12 }}>
                          {b.icon}{b.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {(profile.bio || tp?.bio) && (
                    <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{profile.bio ?? tp?.bio}</p>
                  )}
                </>
              )}
            </div>

            {/* Right col — same as talent profile view */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  <MessageCircle size={14} color={GREEN} />{t.message}
                </button>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: GREEN, color: "#000", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "'Cairo',sans-serif", border: "none" }}>
                  <Calendar size={14} />{t.bookNow}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 12, padding: "9px 0", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  <Heart size={13} />{t.favorite}
                </button>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 12, padding: "9px 0", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  <Share2 size={13} />{t.share}
                </button>
              </div>
              {/* Escrow */}
              <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                <p style={{ color: MUTED, fontSize: 10, fontWeight: 700, marginBottom: 12, letterSpacing: 0.8, margin: "0 0 12px" }}>{t.escrowTitle}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {t.escrowSteps.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, backgroundColor: i === 0 ? GREEN : "rgba(0,210,106,0.1)", border: i === 0 ? "none" : "1px solid rgba(0,210,106,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "#000" : GREEN }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 12, color: i === 0 ? TEXT : MUTED, fontWeight: i === 0 ? 700 : 400 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main grid ─── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 24 }}>

          {/* Left col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Portfolio */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: 0 }}>{t.portfolio}</h2>
                {edit && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={caption} onChange={e => setCaption(e.target.value)} placeholder={t.captionPlaceholder} style={{ padding: "6px 10px", backgroundColor: INP, border: `1px solid ${BORDER}`, borderRadius: 7, color: TEXT, fontSize: 12, outline: "none", width: 140, fontFamily: "'Cairo',sans-serif" }} />
                    <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { handleMediaUpload(f,"photo"); e.target.value=""; }}} />
                    <button onClick={() => photoRef.current?.click()} disabled={mediaUploading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", backgroundColor: "rgba(0,210,106,0.1)", border: "1px solid rgba(0,210,106,0.25)", borderRadius: 8, color: GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                      <Upload size={12} />{t.addPhoto}
                    </button>
                    <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { handleMediaUpload(f,"video"); e.target.value=""; }}} />
                    <button onClick={() => videoRef.current?.click()} disabled={mediaUploading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", backgroundColor: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 8, color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                      <Play size={12} />{t.addVideo}
                    </button>
                  </div>
                )}
              </div>
              {media.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: MUTED, fontSize: 14 }}>{t.noMedia}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {media.slice(0, 6).map((item, i) => (
                    <div key={item.id} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, background: item.url ? `url(${item.url}) center/cover` : SURFACE }}>
                      {item.media_type === "video" && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                          <Play size={24} color="#fff" />
                        </div>
                      )}
                      {edit && (
                        <button onClick={() => handleDeleteMedia(item.id)} style={{ position: "absolute", top: 6, left: 6, width: 26, height: 26, borderRadius: "50%", backgroundColor: "rgba(220,38,38,0.9)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social links — editable */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{t.socialLinks}</h3>
              {edit ? (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  {([["instagram", t.instagram, "📸"], ["tiktok", t.tiktok, "🎵"], ["youtube", t.youtube, "▶️"], ["linkedin", t.linkedin, "💼"]] as [string,string,string][]).map(([k, label, icon]) => (
                    <div key={k}>
                      <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{icon} {label}</label>
                      <input value={form[k]} onChange={e => setF(k, e.target.value)} style={{ ...inp, direction: "ltr" }} placeholder={`@${k}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {([["instagram","📸"],["tiktok","🎵"],["youtube","▶️"],["linkedin","💼"]] as [string,string][]).filter(([k]) => sl[k]).map(([k, icon]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ color: MUTED, fontSize: 13, textTransform: "capitalize" }}>{k}</span>
                      <span style={{ color: GREEN, fontSize: 13, fontWeight: 700, marginRight: "auto", direction: "ltr" }}>{sl[k]}</span>
                    </div>
                  ))}
                  {!["instagram","tiktok","youtube","linkedin"].some(k => sl[k]) && (
                    <p style={{ color: MUTED, fontSize: 13 }}>—</p>
                  )}
                </div>
              )}
            </div>

            {/* Physical info — editable */}
            {tp && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{t.physicalInfo}</h3>
                {edit ? (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                    {([["height",t.height],["weight",t.weight],["hair_color",t.hairColor],["eye_color",t.eyeColor],["languages",t.languages],["age_range",t.ageRange]] as [string,string][]).map(([k, label]) => (
                      <div key={k}>
                        <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{label}</label>
                        <input value={form[k]} onChange={e => setF(k, e.target.value)} style={inp} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {([["height",t.height],["weight",t.weight],["hair_color",t.hairColor],["eye_color",t.eyeColor],["languages",t.languages],["age_range",t.ageRange]] as [string,string][]).filter(([k]) => sl[k]).map(([k, label]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
                        <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{sl[k]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Packages ─── */}
            {tp && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{t.packages}</h3>
                  {edit && (
                    <button onClick={addPkg} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", backgroundColor: "rgba(0,210,106,0.1)", border: "1px solid rgba(0,210,106,0.25)", borderRadius: 8, color: GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                      <Plus size={13} />{t.addPackage}
                    </button>
                  )}
                </div>
                {packages.length === 0 && !edit && (
                  <p style={{ color: MUTED, fontSize: 13 }}>—</p>
                )}
                {edit ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {packages.map((pkg) => (
                      <div key={pkg.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, position: "relative", backgroundColor: SURFACE }}>
                        <button onClick={() => delPkg(pkg.id)} style={{ position: "absolute", top: 10, left: lang === "ar" ? 10 : undefined, right: lang === "ar" ? undefined : 10, background: "rgba(220,38,38,0.15)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "3px 7px", fontSize: 11 }}>✕</button>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{t.pkgName}</label>
                            <input value={pkg.name} onChange={e => setPkg(pkg.id, "name", e.target.value)} style={inp} />
                          </div>
                          <div>
                            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{t.pkgPrice}</label>
                            <input value={pkg.price} onChange={e => setPkg(pkg.id, "price", e.target.value)} style={{ ...inp, direction: "ltr" }} type="number" min="0" />
                          </div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 10 }}>
                          <input type="checkbox" checked={pkg.popular} onChange={e => setPkg(pkg.id, "popular", e.target.checked)} />
                          <span style={{ color: MUTED, fontSize: 12 }}>{t.pkgPopular}</span>
                        </label>
                        <div>
                          <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 6 }}>{t.pkgFeatures}</label>
                          {pkg.features.map((feat, fi) => (
                            <div key={fi} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <input value={feat} onChange={e => setFeat(pkg.id, fi, e.target.value)} style={{ ...inp, flex: 1 }} />
                              <button onClick={() => delFeat(pkg.id, fi)} style={{ background: "rgba(220,38,38,0.15)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "0 10px", fontSize: 13 }}>✕</button>
                            </div>
                          ))}
                          <button onClick={() => addFeat(pkg.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", backgroundColor: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 7, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                            <Plus size={11} />{t.addFeature}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
                    {packages.map(pkg => (
                      <div key={pkg.id} style={{ border: `1px solid ${pkg.popular ? GREEN : BORDER}`, borderRadius: 12, padding: 16, backgroundColor: SURFACE, position: "relative" }}>
                        {pkg.popular && <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", backgroundColor: GREEN, color: "#000", fontSize: 10, fontWeight: 800, borderRadius: 20, padding: "2px 10px", whiteSpace: "nowrap" }}>{t.pkgPopular}</span>}
                        <p style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 4px" }}>{pkg.name}</p>
                        <p style={{ color: GREEN, fontSize: 20, fontWeight: 900, margin: "0 0 12px", direction: "ltr" }}>{pkg.price} <span style={{ fontSize: 11 }}>EGP</span></p>
                        <ul style={{ paddingInlineStart: 16, margin: 0 }}>
                          {pkg.features.map((f, i) => <li key={i} style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>{f}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Usage Rights Add-ons ─── */}
            {tp && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{t.usageAddons}</h3>
                  {edit && (
                    <button onClick={addAddonItem} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", backgroundColor: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 8, color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                      <Plus size={13} />{t.addAddon}
                    </button>
                  )}
                </div>
                {addons.length === 0 && !edit && (
                  <p style={{ color: MUTED, fontSize: 13 }}>—</p>
                )}
                {edit ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {addons.map(addon => (
                      <div key={addon.key} style={{ display: "grid", gridTemplateColumns: "1fr 140px 36px", gap: 8, alignItems: "end" }}>
                        <div>
                          <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{t.addonLabel}</label>
                          <input value={addon.label} onChange={e => setAddon(addon.key, "label", e.target.value)} style={inp} />
                        </div>
                        <div>
                          <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 3 }}>{t.addonPrice}</label>
                          <input value={addon.price} onChange={e => setAddon(addon.key, "price", Number(e.target.value))} style={{ ...inp, direction: "ltr" }} type="number" min="0" />
                        </div>
                        <button onClick={() => delAddon(addon.key)} style={{ height: 38, background: "rgba(220,38,38,0.15)", border: "none", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {addons.map(addon => (
                      <div key={addon.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: MUTED, fontSize: 13 }}>{addon.label}</span>
                        <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700, direction: "ltr" }}>+{addon.price} EGP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right col — read-only stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stats card — all locked */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Lock size={14} color={MUTED} />
                <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{lang === "ar" ? "إحصائيات الحساب" : "Account Stats"}</h3>
              </div>
              <p style={{ color: MUTED, fontSize: 11, marginBottom: 16 }}>{t.readOnly}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { icon: <Star size={14} color={GOLD} fill={GOLD} />, label: lang === "ar" ? "التقييم" : "Rating", val: tp?.avg_rating ? Number(tp.avg_rating).toFixed(1) : "—" },
                  { icon: <Eye size={14} color={GREEN} />,              label: lang === "ar" ? "مشاهدات" : "Views",  val: tp?.profile_views ?? 0 },
                  { icon: <CheckCircle size={14} color={GREEN} />,       label: lang === "ar" ? "تقييمات" : "Reviews", val: tp?.total_reviews ?? 0 },
                  { icon: <Calendar size={14} color={GOLD} />,           label: lang === "ar" ? "حملات" : "Campaigns", val: tp?.total_bookings ?? 0 },
                ].map((s, i) => (
                  <div key={i} style={{ backgroundColor: SURFACE, borderRadius: 10, padding: "14px 12px", textAlign: "center", border: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{s.icon}</div>
                    <p style={{ color: TEXT, fontSize: 20, fontWeight: 900, margin: 0 }}>{String(s.val)}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialties — read only (managed from admin for now) */}
            {tp?.specialties?.length > 0 && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
                <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 14px" }}>{lang === "ar" ? "التخصصات" : "Specialties"}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tp.specialties.map((s: string, i: number) => (
                    <span key={i} style={{ backgroundColor: "rgba(0,210,106,0.08)", color: GREEN, border: "1px solid rgba(0,210,106,0.2)", borderRadius: 20, padding: "3px 12px", fontSize: 12 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Collaborated Brands */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
              <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{t.brands}</h3>
              {edit && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newBrand.trim()) {
                        setBrands(bs => [...bs, newBrand.trim()]);
                        setNewBrand("");
                      }
                    }}
                    placeholder={t.brandPlaceholder}
                    style={{ ...inp, flex: 1 }}
                  />
                  <button
                    onClick={() => { if (newBrand.trim()) { setBrands(bs => [...bs, newBrand.trim()]); setNewBrand(""); } }}
                    style={{ padding: "0 16px", backgroundColor: GREEN, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif", flexShrink: 0 }}
                  >{t.addBrand}</button>
                </div>
              )}
              {brands.length === 0 ? (
                <p style={{ color: MUTED, fontSize: 13 }}>{t.noBrands}</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {brands.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 12px 4px 6px" }}>
                      <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{b}</span>
                      {edit && (
                        <button onClick={() => setBrands(bs => bs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", padding: 0, fontSize: 14, lineHeight: 1 }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trust */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Shield size={16} color={GREEN} />
                <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{lang === "ar" ? "الأمان والثقة" : "Safety & Trust"}</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(lang === "ar"
                  ? ["مدفوعات آمنة 100%","حماية الضمان المالي (Escrow)","مراجعة يدوية لكل طلب","حل سريع للنزاعات"]
                  : ["100% Secure Payments","Financial Guarantee (Escrow)","Manual Review for Every Order","Fast Dispute Resolution"]
                ).map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(0,210,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span style={{ color: MUTED, fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}