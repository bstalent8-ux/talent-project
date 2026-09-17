"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { Save, ArrowLeft, Plus, Trash2, Eye } from "lucide-react";
import TalentActionsPanel from "./TalentActionsPanel";
import TalentBrandsPanel from "./TalentBrandsPanel";
import { LeadWhatsAppButton } from "@/app/(admin)/admin/leads/_components/LeadContactActions";
import TalentComplaintButton from "../../_components/TalentComplaintButton";
import type { TalentAction, AdminTalentBrand } from "@/features/admin/types";
import { TALENT_SOCIAL_KEYS } from "@/lib/profile-fields";
import { canonicalTalentPath } from "@/lib/talent-profile-route";

const TX = {
  ar: {
    title: "تعديل بيانات الموهبة",
    fullName: "الاسم الكامل", handle: "اسم المستخدم", city: "المدينة",
    category: "التصنيف", bio: "نبذة", specialties: "التخصصات (مفصولة بفاصلة)",
    availability: "التوفر",
    save: "حفظ التغييرات", saving: "جاري الحفظ...", back: "رجوع", viewProfile: "عرض البروفايل",
    registrationTitle: "بيانات التسجيل", email: "البريد الإلكتروني", phone: "رقم الهاتف",
    registeredAt: "تاريخ التسجيل", notProvided: "غير متوفر",
    saved: "تم الحفظ بنجاح", error: "حدث خطأ",
    availableOpts: { available: "متاح", busy: "مشغول", unavailable: "غير متاح" },
    modelMetricsTitle: "مقاييس الموديل (يديرها الأدمن فقط)",
    modelMetricsHint: "تظهر هذه القيم في صفحة الموديل العامة كما هي. أي حقل فارغ لا يظهر إطلاقاً — لا تُعرض أرقام وهمية.",
    responseTimeLabel: "مدة الرد (نص، مثال: ~1.8 ساعة)",
    responseRate: "معدل الاستجابة (%)",
    repeatClientRate: "نسبة العملاء المتكررين (%)",
    onTimeRate: "نسبة التسليم في الموعد (%)",
    avgProjectValue: "متوسط قيمة المشروع (EGP)",
    noShowRate: "نسبة عدم الحضور (%)",
    tier: "الفئة/الشارة (فارغ = بدون شارة)",
    noAvatar: "بدون صورة",
    packagesTitle: "الباقات", addPackage: "إضافة باقة", removePackage: "حذف الباقة",
    packageName: "اسم الباقة", packagePrice: "السعر (EGP)", packagePopular: "الأكثر طلباً",
    packageFeatures: "المميزات (سطر لكل ميزة)", noPackages: "لا توجد باقات بعد.",
    packageIcon: "أيقونة الباقة",
    packageIconLabels: { "": "بدون (نجمة افتراضية)", sun: "☀️ شمس", diamond: "💎 ألماظة", gem: "💠 جوهرة", crown: "👑 تاج", rocket: "🚀 صاروخ" } as Record<string, string>,
    socialTitle: "روابط التواصل", website: "الموقع الإلكتروني", other: "أخرى",
    addonsTitle: "إضافات الاستخدام (Usage Add-ons)", addAddon: "إضافة",
    addonLabel: "الاسم", addonPrice: "السعر (EGP)", noAddons: "لا توجد إضافات — سيتم عرض القائمة الافتراضية للعميل.",
    advancedTitle: "بيانات متقدمة أخرى (JSON)",
    advancedHint: "حقول نادرة الاستخدام (المقاسات، الخبرات، إحصائيات الحملات...) تُحرَّر هنا كـ JSON خام.",
    invalidJson: "صيغة JSON غير صحيحة",
  },
  en: {
    title: "Edit Talent Profile",
    fullName: "Full Name", handle: "Username", city: "City",
    category: "Category", bio: "Bio", specialties: "Specialties (comma-separated)",
    availability: "Availability",
    save: "Save Changes", saving: "Saving...", back: "Back", viewProfile: "View profile",
    registrationTitle: "Registration Info", email: "Email", phone: "Phone Number",
    registeredAt: "Registered On", notProvided: "Not provided",
    saved: "Saved successfully", error: "An error occurred",
    availableOpts: { available: "Available", busy: "Busy", unavailable: "Unavailable" },
    modelMetricsTitle: "Model Metrics (admin-managed only)",
    modelMetricsHint: "These values render on the public Model profile exactly as entered. Any blank field is hidden entirely — never a fabricated number.",
    responseTimeLabel: "Response time (text, e.g. ~1.8h)",
    responseRate: "Response rate (%)",
    repeatClientRate: "Repeat client rate (%)",
    onTimeRate: "On-time delivery rate (%)",
    avgProjectValue: "Avg. project value (EGP)",
    noShowRate: "No-show rate (%)",
    tier: "Tier / badge (blank = no badge)",
    noAvatar: "No photo",
    packagesTitle: "Packages", addPackage: "Add package", removePackage: "Remove package",
    packageName: "Package name", packagePrice: "Price (EGP)", packagePopular: "Popular",
    packageFeatures: "Features (one per line)", noPackages: "No packages yet.",
    packageIcon: "Package icon",
    packageIconLabels: { "": "None (default star)", sun: "☀️ Sun", diamond: "💎 Diamond", gem: "💠 Gem", crown: "👑 Crown", rocket: "🚀 Rocket" } as Record<string, string>,
    socialTitle: "Social Links", website: "Website", other: "Other",
    addonsTitle: "Usage Add-ons", addAddon: "Add",
    addonLabel: "Label", addonPrice: "Price (EGP)", noAddons: "No add-ons set — the default list will be shown to brands.",
    advancedTitle: "Advanced / Other Data (JSON)",
    advancedHint: "Rarely-edited fields (physical attributes, experience, campaign stats...) live here as raw JSON.",
    invalidJson: "Invalid JSON",
  },
};

const SOCIAL_LABEL: Record<string, { ar: string; en: string }> = {
  instagram: { ar: "انستجرام", en: "Instagram" },
  tiktok:    { ar: "تيك توك", en: "TikTok" },
  facebook:  { ar: "فيسبوك", en: "Facebook" },
  youtube:   { ar: "يوتيوب", en: "YouTube" },
  linkedin:  { ar: "لينكدإن", en: "LinkedIn" },
  telegram:  { ar: "تيليجرام", en: "Telegram" },
  website:   { ar: "الموقع الإلكتروني", en: "Website" },
  other:     { ar: "أخرى", en: "Other" },
};

interface ModelMetricsForm {
  response_time_label: string;
  response_rate: string;
  repeat_client_rate: string;
  on_time_rate: string;
  avg_project_value: string;
  no_show_rate: string;
  tier: string;
}

interface PackageForm {
  id: string;
  name: string;
  price: string;
  popular: boolean;
  featuresText: string;
  icon: string;
}

// Matches PackagesSection.tsx's model-variant PACKAGE_ICON_MAP keys — "" means
// no icon (falls back to Star, the pre-existing look for every package before
// this feature).
const PACKAGE_ICON_OPTIONS = ["", "sun", "diamond", "gem", "crown", "rocket"] as const;

interface AddonForm {
  key: string;
  label: string;
  price: string;
}

interface InitialData {
  full_name: string; handle: string; city: string;
  category: string; bio: string; specialties: string;
  availability: string;
  packages: unknown[];
  social_links: Record<string, unknown>;
  model_metrics: Record<string, unknown>;
}

interface RegistrationInfo {
  email: string | null;
  phone: string | null;
  createdAt: string | null;
}

interface IdentityInfo {
  avatarUrl: string | null;
  fullName: string | null;
  phone: string | null;
  category: string | null;
}

interface Props {
  talentProfileId: string;
  profileUserId: string;
  initialData: InitialData;
  identity: IdentityInfo;
  registration: RegistrationInfo;
  initialActions: TalentAction[];
  initialBrands: AdminTalentBrand[];
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizePackages(raw: unknown[]): PackageForm[] {
  return raw.map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: typeof row.id === "string" ? row.id : newId(),
      name: row.name != null ? String(row.name) : "",
      price: row.price != null ? String(row.price) : "",
      popular: Boolean(row.popular),
      featuresText: Array.isArray(row.features) ? row.features.map(String).join("\n") : "",
      icon: row.icon != null ? String(row.icon) : "",
    };
  });
}

function normalizeAddons(socialLinks: Record<string, unknown>): AddonForm[] {
  const raw = socialLinks["usage_addons"];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        key: row.key != null ? String(row.key) : newId(),
        label: row.label != null ? String(row.label) : "",
        price: row.price != null ? String(row.price) : "",
      };
    });
}

function extractSocialFields(socialLinks: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of TALENT_SOCIAL_KEYS) {
    const v = socialLinks[key];
    out[key] = v != null ? String(v) : "";
  }
  return out;
}

function extractAdvanced(socialLinks: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...socialLinks };
  for (const key of TALENT_SOCIAL_KEYS) delete rest[key];
  delete rest["usage_addons"];
  return rest;
}

export default function TalentEditorClient({ talentProfileId, profileUserId, initialData, identity, registration, initialActions, initialBrands }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [form, setForm] = useState({
    full_name: initialData.full_name,
    handle: initialData.handle,
    city: initialData.city,
    category: initialData.category,
    bio: initialData.bio,
    specialties: initialData.specialties,
    availability: initialData.availability,
  });
  const [packages, setPackages] = useState<PackageForm[]>(() => normalizePackages(initialData.packages));
  const [socialFields, setSocialFields] = useState<Record<string, string>>(() => extractSocialFields(initialData.social_links));
  const [addons, setAddons] = useState<AddonForm[]>(() => normalizeAddons(initialData.social_links));
  const [advancedJson, setAdvancedJson] = useState(() => JSON.stringify(extractAdvanced(initialData.social_links), null, 2));
  const [status, setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [jsonErr, setJsonErr] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsForm>(() => {
    const m = initialData.model_metrics ?? {};
    const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
    return {
      response_time_label: str(m.response_time_label),
      response_rate:       str(m.response_rate),
      repeat_client_rate:  str(m.repeat_client_rate),
      on_time_rate:        str(m.on_time_rate),
      avg_project_value:   str(m.avg_project_value),
      no_show_rate:        str(m.no_show_rate),
      tier:                str(m.tier),
    };
  });

  const isModel = form.category === "model" || form.category === "fashion";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#0a121c" : "#f8fafc";
  const GREEN  = "#00D26A";

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${BORDER}`, backgroundColor: INPUT,
    color: TEXT, fontSize: 14, outline: "none",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif", boxSizing: "border-box",
  };

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setStatus("idle");
  }

  function setMetric(k: keyof ModelMetricsForm, v: string) {
    setMetrics(m => ({ ...m, [k]: v }));
    setStatus("idle");
  }

  function updatePackage(id: string, patch: Partial<PackageForm>) {
    setPackages(list => list.map(p => (p.id === id ? { ...p, ...patch } : p)));
    setStatus("idle");
  }

  function addPackage() {
    setPackages(list => [...list, { id: newId(), name: "", price: "", popular: false, featuresText: "", icon: "" }]);
  }

  function removePackage(id: string) {
    setPackages(list => list.filter(p => p.id !== id));
    setStatus("idle");
  }

  function updateAddon(key: string, patch: Partial<AddonForm>) {
    setAddons(list => list.map(a => (a.key === key ? { ...a, ...patch } : a)));
    setStatus("idle");
  }

  function addAddon() {
    setAddons(list => [...list, { key: newId(), label: "", price: "" }]);
  }

  function removeAddon(key: string) {
    setAddons(list => list.filter(a => a.key !== key));
    setStatus("idle");
  }

  async function handleSave() {
    let parsedAdvanced: Record<string, unknown>;
    try {
      const p = JSON.parse(advancedJson);
      parsedAdvanced = (p && typeof p === "object" && !Array.isArray(p)) ? p : {};
    } catch {
      setJsonErr("advanced");
      return;
    }
    setJsonErr(null);

    // Blank field → null, never a fabricated 0/"" reaching the public page.
    const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
    const strOrNull = (v: string) => (v.trim() === "" ? null : v.trim());

    const cleanPackages = packages
      .filter(p => p.name.trim() !== "" || p.price.trim() !== "")
      .map(p => ({
        id: p.id,
        name: p.name.trim(),
        price: p.price.trim(),
        popular: p.popular,
        features: p.featuresText.split("\n").map(s => s.trim()).filter(Boolean),
        icon: p.icon || undefined,
      }));

    const cleanAddons = addons
      .filter(a => a.label.trim() !== "")
      .map(a => ({ key: a.key, label: a.label.trim(), price: Number(a.price) || 0 }));

    const socialLinks: Record<string, unknown> = { ...parsedAdvanced };
    for (const key of TALENT_SOCIAL_KEYS) {
      const v = socialFields[key]?.trim();
      if (v) socialLinks[key] = v;
    }
    if (cleanAddons.length > 0) socialLinks["usage_addons"] = cleanAddons;

    setStatus("saving");
    const res = await fetch(`/api/admin/talents/${talentProfileId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // profile fields
        profile_user_id: profileUserId,
        full_name:  form.full_name,
        handle:     form.handle,
        city:       form.city,
        // talent_profile fields
        category:     form.category,
        bio:          form.bio,
        specialties:  form.specialties.split(",").map(s => s.trim()).filter(Boolean),
        availability: form.availability,
        packages:     cleanPackages,
        social_links: socialLinks,
        // Admin-only Model/Fashion trust metrics — omitted entirely unless
        // this talent is currently a Model/Fashion profile.
        ...(isModel ? {
          model_metrics: {
            response_time_label: strOrNull(metrics.response_time_label),
            response_rate:       numOrNull(metrics.response_rate),
            repeat_client_rate:  numOrNull(metrics.repeat_client_rate),
            on_time_rate:        numOrNull(metrics.on_time_rate),
            avg_project_value:   numOrNull(metrics.avg_project_value),
            no_show_rate:        numOrNull(metrics.no_show_rate),
            tier:                strOrNull(metrics.tier),
          },
        } : {}),
      }),
    });

    if (res.ok) {
      setStatus("saved");
    } else {
      setStatus("error");
    }
  }

  const label = (text: string, err?: boolean) => (
    <label style={{ color: err ? "#EF4444" : MUTED, fontSize: 13, display: "block", marginBottom: 6, fontWeight: 500 }}>
      {text}
    </label>
  );

  const section = (title: string, children: React.ReactNode, extra?: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: 0 }}>{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  );

  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as React.CSSProperties;

  const iconBtn = (danger?: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "none", border: `1px solid ${danger ? "#EF4444" : BORDER}`,
    color: danger ? "#EF4444" : TEXT, borderRadius: 8, padding: "6px 12px",
    fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  });

  return (
    <AdminShell title={t.title}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft size={16} />{t.back}
      </button>

      {/* Identity header — who this talent is, at a glance, before any data
          entry field. Photo + name + phone + category so an admin never
          edits a profile without knowing whose it is. */}
      <div style={{
        backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: 24, marginBottom: 16, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          backgroundColor: INPUT, border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {identity.avatarUrl ? (
            <Image src={identity.avatarUrl} alt="" width={72} height={72} style={{ objectFit: "cover" }} />
          ) : (
            <span style={{ color: MUTED, fontSize: 24, fontWeight: 700 }}>
              {(identity.fullName ?? "?")[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
          <span style={{ color: TEXT, fontSize: 19, fontWeight: 800 }}>
            {identity.fullName || t.notProvided}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {identity.category && (
              <span style={{
                backgroundColor: dark ? "rgba(0,210,106,0.12)" : "rgba(0,210,106,0.1)",
                color: GREEN, fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
              }}>
                {identity.category}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 8, direction: "ltr" }}>
              <span style={{ color: MUTED, fontSize: 14 }}>{identity.phone || t.notProvided}</span>
              {identity.phone && <LeadWhatsAppButton phone={identity.phone} size={20} />}
            </span>
          </div>
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {form.handle && (
            <a
              href={canonicalTalentPath(identity.category, form.handle)}
              target="_blank"
              rel="noopener noreferrer"
              title={t.viewProfile}
              aria-label={t.viewProfile}
              style={{ color: MUTED, display: "flex", padding: 4 }}
            >
              <Eye size={20} />
            </a>
          )}
          <TalentComplaintButton
            talentProfileId={talentProfileId}
            fullName={identity.fullName}
            phone={identity.phone}
            email={registration.email}
            size={20}
          />
        </div>
      </div>

      {/* Talent CRM — log calls/messages/notes with an optional follow-up
          reminder. Self-contained: fetches/posts its own data and calls
          router.refresh() after a change, independent of this form's own
          save flow. Placed right under identity so "who is this + what's
          been done" reads as one block. */}
      <TalentActionsPanel talentProfileId={talentProfileId} initialActions={initialActions} />
      <TalentBrandsPanel talentProfileId={talentProfileId} initialBrands={initialBrands} />

      {/* Registration info — read-only, from auth.users (email) and profiles
          (created_at). Never editable here: email/phone changes go through
          the talent's own account settings, not admin override. */}
      {section(t.registrationTitle, (
        <div style={grid2}>
          <div>
            {label(t.email)}
            <p style={{ color: TEXT, fontSize: 14, margin: 0, direction: "ltr", textAlign: ar ? "right" : "left" }}>
              {registration.email ?? t.notProvided}
            </p>
          </div>
          <div>
            {label(t.registeredAt)}
            <p style={{ color: TEXT, fontSize: 14, margin: 0 }}>
              {registration.createdAt
                ? new Date(registration.createdAt).toLocaleString(ar ? "ar-EG" : "en-US")
                : t.notProvided}
            </p>
          </div>
        </div>
      ))}

      {/* Basic info */}
      {section(ar ? "المعلومات الأساسية" : "Basic Information", (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={grid2}>
            <div>
              {label(t.fullName)}
              <input style={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} />
            </div>
            <div>
              {label(t.handle)}
              <input style={{ ...inp, direction: "ltr" }} value={form.handle} onChange={e => set("handle", e.target.value)} />
            </div>
          </div>
          <div style={grid2}>
            <div>
              {label(t.city)}
              <input style={inp} value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div>
              {label(t.category)}
              <input style={inp} value={form.category} onChange={e => set("category", e.target.value)} />
            </div>
          </div>
          <div>
            {label(t.specialties)}
            <input style={inp} value={form.specialties} onChange={e => set("specialties", e.target.value)} />
          </div>
          <div>
            {label(t.bio)}
            <textarea style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} rows={4}
              value={form.bio} onChange={e => set("bio", e.target.value)} />
          </div>
          <div>
            {label(t.availability)}
            <select style={{ ...inp }} value={form.availability} onChange={e => set("availability", e.target.value)}>
              {Object.entries(t.availableOpts).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Model/Fashion trust metrics — admin-only, never self-serve editable */}
      {isModel && section(t.modelMetricsTitle, (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.6, margin: "-6px 0 4px" }}>{t.modelMetricsHint}</p>
          <div style={grid2}>
            <div>
              {label(t.responseTimeLabel)}
              <input style={inp} value={metrics.response_time_label} onChange={e => setMetric("response_time_label", e.target.value)} />
            </div>
            <div>
              {label(t.tier)}
              <input style={inp} value={metrics.tier} onChange={e => setMetric("tier", e.target.value)} />
            </div>
          </div>
          <div style={grid2}>
            <div>
              {label(t.responseRate)}
              <input type="number" min={0} max={100} style={inp} value={metrics.response_rate} onChange={e => setMetric("response_rate", e.target.value)} />
            </div>
            <div>
              {label(t.repeatClientRate)}
              <input type="number" min={0} max={100} style={inp} value={metrics.repeat_client_rate} onChange={e => setMetric("repeat_client_rate", e.target.value)} />
            </div>
          </div>
          <div style={grid2}>
            <div>
              {label(t.onTimeRate)}
              <input type="number" min={0} max={100} style={inp} value={metrics.on_time_rate} onChange={e => setMetric("on_time_rate", e.target.value)} />
            </div>
            <div>
              {label(t.noShowRate)}
              <input type="number" min={0} max={100} style={inp} value={metrics.no_show_rate} onChange={e => setMetric("no_show_rate", e.target.value)} />
            </div>
          </div>
          <div>
            {label(t.avgProjectValue)}
            <input type="number" min={0} style={inp} value={metrics.avg_project_value} onChange={e => setMetric("avg_project_value", e.target.value)} />
          </div>
        </div>
      ))}

      {/* Packages — structured repeatable list, no JSON editing */}
      {section(t.packagesTitle, (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {packages.length === 0 && <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noPackages}</p>}
          {packages.map((pkg) => (
            <div key={pkg.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={grid2}>
                <div>
                  {label(t.packageName)}
                  <input style={inp} value={pkg.name} onChange={e => updatePackage(pkg.id, { name: e.target.value })} />
                </div>
                <div>
                  {label(t.packagePrice)}
                  <input type="number" min={0} style={inp} value={pkg.price} onChange={e => updatePackage(pkg.id, { price: e.target.value })} />
                </div>
              </div>
              <div>
                {label(t.packageIcon)}
                <select style={inp} value={pkg.icon} onChange={e => updatePackage(pkg.id, { icon: e.target.value })}>
                  {PACKAGE_ICON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{t.packageIconLabels[opt]}</option>
                  ))}
                </select>
              </div>
              <div>
                {label(t.packageFeatures)}
                <textarea
                  style={{ ...inp, resize: "vertical" }}
                  rows={3}
                  value={pkg.featuresText}
                  onChange={e => updatePackage(pkg.id, { featuresText: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={pkg.popular} onChange={e => updatePackage(pkg.id, { popular: e.target.checked })} />
                  {t.packagePopular}
                </label>
                <button type="button" onClick={() => removePackage(pkg.id)} style={iconBtn(true)}>
                  <Trash2 size={13} />{t.removePackage}
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addPackage} style={{ ...iconBtn(), alignSelf: "flex-start" }}>
            <Plus size={13} />{t.addPackage}
          </button>
        </div>
      ))}

      {/* Social links — known keys as plain URL inputs */}
      {section(t.socialTitle, (
        <div style={grid2}>
          {TALENT_SOCIAL_KEYS.map((key) => (
            <div key={key}>
              {label(SOCIAL_LABEL[key]?.[lang] ?? key)}
              <input
                style={{ ...inp, direction: "ltr" }}
                value={socialFields[key] ?? ""}
                onChange={e => { setSocialFields(f => ({ ...f, [key]: e.target.value })); setStatus("idle"); }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Usage add-ons — structured repeatable list (key/label/price), the
          same shape lib/booking/addons.ts reads for server-side price checks. */}
      {section(t.addonsTitle, (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {addons.length === 0 && <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.noAddons}</p>}
          {addons.map((addon) => (
            <div key={addon.key} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 160 }}>
                {label(t.addonLabel)}
                <input style={inp} value={addon.label} onChange={e => updateAddon(addon.key, { label: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                {label(t.addonPrice)}
                <input type="number" min={0} style={inp} value={addon.price} onChange={e => updateAddon(addon.key, { price: e.target.value })} />
              </div>
              <button type="button" onClick={() => removeAddon(addon.key)} style={{ ...iconBtn(true), marginBottom: 2 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addAddon} style={{ ...iconBtn(), alignSelf: "flex-start" }}>
            <Plus size={13} />{t.addAddon}
          </button>
        </div>
      ))}

      {/* Advanced/other — everything in social_links that isn't a known
          social key or usage_addons (physical attributes, experience,
          campaign stats, legacy brands, etc.). Rare to touch; stays JSON. */}
      {section(t.advancedTitle, (
        <div>
          <p style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.6, margin: "-4px 0 10px" }}>{t.advancedHint}</p>
          {label("", jsonErr === "advanced")}
          <textarea
            style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, border: jsonErr === "advanced" ? "1px solid #EF4444" : `1px solid ${BORDER}` }}
            rows={8}
            value={advancedJson}
            onChange={e => { setAdvancedJson(e.target.value); setStatus("idle"); setJsonErr(null); }}
          />
          {jsonErr === "advanced" && (
            <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{t.invalidJson}</p>
          )}
        </div>
      ))}

      {/* Save bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            backgroundColor: "#00D26A", color: "#000", border: "none",
            borderRadius: 10, padding: "12px 28px", fontSize: 14,
            fontWeight: 800, cursor: status === "saving" ? "wait" : "pointer",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif", opacity: status === "saving" ? 0.7 : 1,
          }}
        >
          <Save size={16} />
          {status === "saving" ? t.saving : t.save}
        </button>
        {status === "saved" && <span style={{ color: "#00D26A", fontSize: 14 }}>✓ {t.saved}</span>}
        {status === "error" && <span style={{ color: "#EF4444", fontSize: 14 }}>✗ {t.error}</span>}
      </div>
    </AdminShell>
  );
}
