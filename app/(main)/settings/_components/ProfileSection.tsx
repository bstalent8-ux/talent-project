"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, ShieldCheck, Clock3, XCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import CustomSelect from "@/components/ui/CustomSelect";
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
    verifyTitle: "توثيق الشركة",
    verifyDesc: "البيانات دي بتظهر للأدمن بس عشان يراجعها ويوافق على ظهور شركتك للعامة.",
    verifyApproved: "شركتك موثّقة",
    verifyPending: "بياناتك قيد المراجعة",
    verifyRejected: "اترفضت",
    verifyRejectedReason: "السبب",
    type: "نوع النشاط", typeSelect: "اختر نوع النشاط", typeOther: "أخرى",
    typeOtherLabel: "اكتب نوع نشاطك", typeOtherPH: "مثلاً: مركز تدريب رياضي",
    document: "مستند تسجيل تجاري / بطاقة ضريبية",
    documentHint: "صورة واضحة للمستند — مطلوبة.",
    photos: "صور إضافية (اختياري)",
    photosHint: "صور المحل، المكتب، أو شغل حقيقي — تزود ثقة الأدمن في طلبك.",
    addPhoto: "إضافة صورة",
    submit: "إرسال للمراجعة", submitting: "جاري الإرسال...", submitted: "تم الإرسال! هنراجعها قريب.",
    submitError: "حصل خطأ، حاول تاني.",
    documentRequired: "المستند مطلوب.",
    typeRequired: "اختر نوع النشاط.",
    otherRequired: "اكتب نوع نشاطك.",
    resubmit: "إعادة الإرسال",
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
    verifyTitle: "Business Verification",
    verifyDesc: "This is shown to an admin only, to review before your company appears publicly.",
    verifyApproved: "Your business is verified",
    verifyPending: "Your submission is under review",
    verifyRejected: "Rejected",
    verifyRejectedReason: "Reason",
    type: "Business type", typeSelect: "Select business type", typeOther: "Other",
    typeOtherLabel: "Describe your business type", typeOtherPH: "e.g. Sports training center",
    document: "Commercial registration / tax card",
    documentHint: "A clear photo of the document — required.",
    photos: "Additional photos (optional)",
    photosHint: "Storefront, office, or real work photos — strengthens your submission.",
    addPhoto: "Add photo",
    submit: "Submit for review", submitting: "Submitting...", submitted: "Sent! We'll review it soon.",
    submitError: "Something went wrong, try again.",
    documentRequired: "The document is required.",
    typeRequired: "Select a business type.",
    otherRequired: "Describe your business type.",
    resubmit: "Resubmit",
  },
};

export default function ProfileSection({ profile, talentStatus, talentCategory, brandCategories, lang, dark }: SectionProps) {
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

  // ─── Brand verification: business type + document + optional photos ───
  const [vCategory, setVCategory]   = useState(profile.brand_category ?? "");
  const [vOtherText, setVOtherText] = useState("");
  const [vDocument, setVDocument]   = useState<File | null>(null);
  const [vPhotos, setVPhotos]       = useState<File[]>([]);
  const [vSaving, setVSaving]       = useState(false);
  const [vMsg, setVMsg]             = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submitVerification() {
    setVMsg(null);
    if (!vCategory) { setVMsg({ type: "err", text: t.typeRequired }); return; }
    if (vCategory === "other" && !vOtherText.trim()) { setVMsg({ type: "err", text: t.otherRequired }); return; }
    if (!vDocument) { setVMsg({ type: "err", text: t.documentRequired }); return; }

    setVSaving(true);
    const fd = new FormData();
    fd.append("category", vCategory);
    if (vCategory === "other") fd.append("other_type_text", vOtherText.trim());
    fd.append("document", vDocument);
    for (const photo of vPhotos) fd.append("photos", photo);

    try {
      const res = await fetch("/api/profile/brand-verification", { method: "POST", body: fd });
      if (!res.ok) throw new Error("failed");
      setVMsg({ type: "ok", text: t.submitted });
      setVDocument(null);
      setVPhotos([]);
    } catch {
      setVMsg({ type: "err", text: t.submitError });
    }
    setVSaving(false);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", backgroundColor: INP, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
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

        {/* ─── Verification ─── */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
          <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{t.verifyTitle}</h2>
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>{t.verifyDesc}</p>

          {profile.brand_status === "approved" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", backgroundColor: "rgba(0,210,106,0.1)", border: "1px solid rgba(0,210,106,0.3)", borderRadius: 10, color: GREEN, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              <ShieldCheck size={16} />{t.verifyApproved}
            </div>
          ) : profile.brand_status === "pending" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", backgroundColor: "rgba(244,183,64,0.1)", border: "1px solid rgba(244,183,64,0.3)", borderRadius: 10, color: "#F4B740", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              <Clock3 size={16} />{t.verifyPending}
            </div>
          ) : profile.brand_status === "rejected" ? (
            <div style={{ padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EF4444", fontSize: 13, fontWeight: 700 }}>
                <XCircle size={16} />{t.verifyRejected}
              </div>
              {profile.brand_rejection_reason && (
                <p style={{ color: MUTED, fontSize: 12.5, margin: "6px 0 0" }}>{t.verifyRejectedReason}: {profile.brand_rejection_reason}</p>
              )}
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
            <div>
              <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.type}</label>
              <CustomSelect
                value={vCategory}
                onChange={setVCategory}
                placeholder={t.typeSelect}
                colors={{ border: BORDER, card: INP, text: TEXT, muted: MUTED, primary: GREEN, hover: SURFACE }}
                options={[
                  ...brandCategories.map((c) => ({ value: c.id, label: lang === "ar" ? c.label_ar : c.label_en })),
                  { value: "other", label: t.typeOther },
                ]}
              />
            </div>

            {vCategory === "other" && (
              <div>
                <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.typeOtherLabel}</label>
                <input value={vOtherText} onChange={(e) => setVOtherText(e.target.value)} placeholder={t.typeOtherPH} style={inp} />
              </div>
            )}

            <div>
              <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.document}</label>
              <p style={{ color: MUTED, fontSize: 11.5, margin: "0 0 6px" }}>{t.documentHint}</p>
              {vDocument ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                  <span style={{ color: TEXT, fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vDocument.name}</span>
                  <button type="button" onClick={() => setVDocument(null)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 0, display: "flex" }}><X size={15} /></button>
                </div>
              ) : (
                <input type="file" accept="image/*,.pdf" onChange={(e) => setVDocument(e.target.files?.[0] ?? null)} style={inp} />
              )}
            </div>

            <div>
              <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 5 }}>{t.photos}</label>
              <p style={{ color: MUTED, fontSize: 11.5, margin: "0 0 6px" }}>{t.photosHint}</p>
              {vPhotos.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {vPhotos.map((photo, i) => (
                    <div key={i} style={{ position: "relative", width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                      <img src={URL.createObjectURL(photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => setVPhotos((ps) => ps.filter((_, pi) => pi !== i))}
                        style={{ position: "absolute", top: 2, insetInlineEnd: 2, width: 18, height: 18, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {vPhotos.length < 5 && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", backgroundColor: SURFACE, border: `1px dashed ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  {t.addPhoto}
                  <input type="file" accept="image/*" multiple style={{ display: "none" }}
                    onChange={(e) => { const files = Array.from(e.target.files ?? []); setVPhotos((ps) => [...ps, ...files].slice(0, 5)); e.target.value = ""; }} />
                </label>
              )}
            </div>

            {vMsg && <p style={{ color: vMsg.type === "ok" ? GREEN : "#EF4444", fontSize: 12.5, margin: 0 }}>{vMsg.text}</p>}
            <button
              onClick={submitVerification}
              disabled={vSaving}
              style={{ alignSelf: "flex-start", padding: "9px 20px", backgroundColor: "#d7a84f", border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, cursor: vSaving ? "wait" : "pointer" }}
            >
              {vSaving ? t.submitting : (profile.brand_status ? t.resubmit : t.submit)}
            </button>
          </div>
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
