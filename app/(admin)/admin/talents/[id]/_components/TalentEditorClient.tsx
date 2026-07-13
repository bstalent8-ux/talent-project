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
  },
  en: {
    title: "Edit Talent Profile",
    fullName: "Full Name", handle: "Username", city: "City",
    category: "Category", bio: "Bio", specialties: "Specialties (comma-separated)",
    availability: "Availability", packages: "Packages (JSON)", socialLinks: "Social Links (JSON)",
    save: "Save Changes", saving: "Saving...", back: "Back",
    saved: "Saved successfully", error: "An error occurred",
    availableOpts: { available: "Available", busy: "Busy", unavailable: "Unavailable" },
  },
};

interface InitialData {
  full_name: string; handle: string; city: string;
  category: string; bio: string; specialties: string;
  availability: string; packages: string; social_links: string;
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

  async function handleSave() {
    // Validate JSON fields
    let parsedPackages: unknown, parsedSocialLinks: unknown;
    try { parsedPackages = JSON.parse(form.packages); } catch { setJsonErr("packages"); return; }
    try { parsedSocialLinks = JSON.parse(form.social_links); } catch { setJsonErr("social_links"); return; }

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
