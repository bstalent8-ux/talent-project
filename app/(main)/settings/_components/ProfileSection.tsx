"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import type { SectionProps } from "./SettingsClient";

const TX = {
  ar: {
    title: "الملف الشخصي",
    talentDesc: "بروفايلك العام هو اللي البراندات بتشوفه. عدّل بياناتك، صورك، وباقاتك من صفحة تعديل البروفايل.",
    editProfile: "تعديل البروفايل الكامل",
    viewPublic: "عرض الملف العام",
    handle: "رابط ملفك العام",
    brandTitle: "بيانات الشركة",
    brandDesc: "البيانات دي بتظهر في صفحة شركتك العامة.",
    companyName: "اسم الشركة", city: "المدينة", bio: "نبذة عن الشركة",
    bioPlaceholder: "اكتب نبذة عن نشاط شركتك...",
    save: "حفظ التغييرات", saving: "جاري الحفظ...", saved: "تم الحفظ ✓",
    error: "حدث خطأ، حاول مرة أخرى.",
  },
  en: {
    title: "Profile",
    talentDesc: "Your public profile is what brands see. Edit your details, photos, and packages from the profile editor.",
    editProfile: "Edit Full Profile",
    viewPublic: "View Public Profile",
    handle: "Your public profile link",
    brandTitle: "Company Details",
    brandDesc: "This information appears on your public brand page.",
    companyName: "Company Name", city: "City", bio: "Company Bio",
    bioPlaceholder: "Describe what your company does...",
    save: "Save Changes", saving: "Saving...", saved: "Saved ✓",
    error: "Something went wrong, please try again.",
  },
};

export default function ProfileSection({ profile, talentStatus, talentCategory, lang, dark }: SectionProps) {
  const t = TX[lang];
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const INP    = dark ? "#0d1527" : "#f8fafc";
  const GREEN  = "#00D26A";

  // ─── Brand: minimal real form, wired to the existing /api/profile
  // endpoint (its brandProfileData.company_name + shared profileData fields
  // already persist — no new backend). No dedicated brand editor exists yet,
  // so this is the missing UI, not a duplicate of one. ───
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    city:      profile.city ?? "",
    bio:       profile.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function saveBrand() {
    setSaving(true); setMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        role: "brand",
        profileData: { full_name: form.full_name, city: form.city, bio: form.bio },
        brandProfileData: { company_name: form.full_name },
      }),
    });
    setSaving(false);
    if (!res.ok) { setMsg({ type: "err", text: t.error }); return; }
    setMsg({ type: "ok", text: t.saved });
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", backgroundColor: INP, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'Cairo', sans-serif",
  };

  if (profile.role === "brand") {
    return (
      <div>
        <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{t.brandTitle}</h2>
        <p style={{ color: MUTED, fontSize: 13, margin: "0 0 20px" }}>{t.brandDesc}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
          <div>
            <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.companyName}</label>
            <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.city}</label>
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.bio}</label>
            <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4} placeholder={t.bioPlaceholder} style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
          </div>
          {msg && <p style={{ color: msg.type === "ok" ? GREEN : "#EF4444", fontSize: 12.5, margin: 0 }}>{msg.text}</p>}
          <button
            onClick={saveBrand}
            disabled={saving}
            style={{ alignSelf: "flex-start", padding: "9px 20px", backgroundColor: GREEN, border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    );
  }

  // ─── Talent: link/reuse the existing dedicated editor — never duplicate it. ───
  return (
    <div>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{t.title}</h2>
      <p style={{ color: MUTED, fontSize: 13, margin: "0 0 20px", lineHeight: 1.7 }}>{t.talentDesc}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
        <Link href="/profile/me/complete" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: GREEN, borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
          <Pencil size={16} />{t.editProfile}
        </Link>
        {profile.handle && (
          <a
            href={canonicalTalentPath(talentCategory, profile.handle)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            <Eye size={16} color={GREEN} />{t.viewPublic}
          </a>
        )}
        {profile.handle && (
          <div style={{ padding: "10px 14px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <p style={{ color: MUTED, fontSize: 11, margin: "0 0 4px" }}>{t.handle}</p>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, margin: 0, direction: "ltr", textAlign: lang === "ar" ? "right" : "left" }}>
              {canonicalTalentPath(talentCategory, profile.handle)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
