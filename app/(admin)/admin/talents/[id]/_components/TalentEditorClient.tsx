"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { Save, ArrowLeft } from "lucide-react";

const TX = {
  ar: {
    title: "تعديل بيانات الموهبة",
    fullName: "الاسم الكامل", handle: "اسم المستخدم", city: "المدينة",
    category: "التصنيف", bio: "نبذة", specialties: "التخصصات (مفصولة بفاصلة)",
    availability: "التوفر", packages: "الباقات (JSON)", socialLinks: "البيانات الإضافية (JSON)",
    save: "حفظ التغييرات", saving: "جاري الحفظ...", back: "رجوع",
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
  },
  en: {
    title: "Edit Talent Profile",
    fullName: "Full Name", handle: "Username", city: "City",
    category: "Category", bio: "Bio", specialties: "Specialties (comma-separated)",
    availability: "Availability", packages: "Packages (JSON)", socialLinks: "Social Links (JSON)",
    save: "Save Changes", saving: "Saving...", back: "Back",
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
  },
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

interface InitialData {
  full_name: string; handle: string; city: string;
  category: string; bio: string; specialties: string;
  availability: string; packages: string; social_links: string;
  model_metrics: Record<string, unknown>;
}

interface Props {
  talentProfileId: string;
  profileUserId: string;
  initialData: InitialData;
}

export default function TalentEditorClient({ talentProfileId, profileUserId, initialData }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [form, setForm]       = useState(initialData);
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

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${BORDER}`, backgroundColor: INPUT,
    color: TEXT, fontSize: 14, outline: "none",
    fontFamily: "'Cairo', sans-serif", boxSizing: "border-box",
  };

  function set(k: keyof InitialData, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setStatus("idle");
    setJsonErr(null);
  }

  function setMetric(k: keyof ModelMetricsForm, v: string) {
    setMetrics(m => ({ ...m, [k]: v }));
    setStatus("idle");
  }

  async function handleSave() {
    // Validate JSON fields
    let parsedPackages: unknown, parsedSocialLinks: unknown;
    try { parsedPackages = JSON.parse(form.packages); } catch { setJsonErr("packages"); return; }
    try { parsedSocialLinks = JSON.parse(form.social_links); } catch { setJsonErr("social_links"); return; }

    // Blank field → null, never a fabricated 0/"" reaching the public page.
    const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
    const strOrNull = (v: string) => (v.trim() === "" ? null : v.trim());

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
        packages:     parsedPackages,
        social_links: parsedSocialLinks,
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

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 20px" }}>{title}</h3>
      {children}
    </div>
  );

  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as React.CSSProperties;

  return (
    <AdminShell title={t.title}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft size={16} />{t.back}
      </button>

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

      {/* Packages JSON */}
      {section(ar ? "الباقات (JSON)" : "Packages (JSON)", (
        <div>
          {label(t.packages, jsonErr === "packages")}
          <textarea
            style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, border: jsonErr === "packages" ? "1px solid #EF4444" : `1px solid ${BORDER}` }}
            rows={10}
            value={form.packages}
            onChange={e => set("packages", e.target.value)}
          />
          {jsonErr === "packages" && (
            <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>Invalid JSON</p>
          )}
        </div>
      ))}

      {/* Social links JSON */}
      {section(ar ? "البيانات الإضافية (JSON)" : "Social & Extra Data (JSON)", (
        <div>
          {label(t.socialLinks, jsonErr === "social_links")}
          <textarea
            style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, border: jsonErr === "social_links" ? "1px solid #EF4444" : `1px solid ${BORDER}` }}
            rows={14}
            value={form.social_links}
            onChange={e => set("social_links", e.target.value)}
          />
          {jsonErr === "social_links" && (
            <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>Invalid JSON</p>
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
            fontFamily: "'Cairo', sans-serif", opacity: status === "saving" ? 0.7 : 1,
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
