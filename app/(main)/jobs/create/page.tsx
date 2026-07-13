"use client";
export const runtime = 'edge';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { Briefcase, DollarSign, Calendar, Users, FileText, Tag, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { key: "ugc",          label_ar: "مبدع محتوى UGC", label_en: "UGC Creator",    icon: "🎬" },
  { key: "influencer",   label_ar: "مؤثر",           label_en: "Influencer",     icon: "📱" },
  { key: "model",        label_ar: "موديل",           label_en: "Model",          icon: "👗" },
  { key: "actor",        label_ar: "ممثل",            label_en: "Actor",          icon: "🎭" },
  { key: "host",         label_ar: "مذيع / مقدم",    label_en: "Host",           icon: "🎤" },
  { key: "photographer", label_ar: "مصور",            label_en: "Photographer",   icon: "📸" },
];

export default function CreateJobPage() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const router = useRouter();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("");
  const [budgetMin,   setBudgetMin]   = useState("");
  const [budgetMax,   setBudgetMax]   = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [slots,       setSlots]       = useState("1");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const INPUT  = dark ? "#060d18" : "#F8FAFC";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const RED    = "#EF4444";

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    backgroundColor: INPUT,
    border: `1px solid ${BORDER}`, borderRadius: 10,
    color: TEXT, fontSize: 14,
    fontFamily: "'Cairo',sans-serif", outline: "none",
    boxSizing: "border-box",
    direction: ar ? "rtl" : "ltr",
  };

  const labelStyle: React.CSSProperties = {
    color: MUTED, fontSize: 12, fontWeight: 700,
    letterSpacing: 0.5, marginBottom: 6, display: "block",
    textTransform: "uppercase",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError(ar ? "العنوان مطلوب" : "Title is required"); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, category: category || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        currency: "EGP",
        start_date: startDate || null,
        end_date: endDate || null,
        slots: Number(slots) || 1,
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Error creating job");
      setLoading(false);
      return;
    }
    router.push("/jobs");
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#F1F5F9",
      fontFamily: "'Cairo',sans-serif",
      direction: ar ? "rtl" : "ltr",
      padding: "40px 24px 80px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: MUTED, fontSize: 13, fontFamily: "'Cairo',sans-serif", marginBottom: 20,
          }}>
            {ar ? "→" : "←"} {ar ? "رجوع" : "Back"}
          </button>
          <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>
            {ar ? "نشر وظيفة جديدة 💼" : "Post a New Job 💼"}
          </h1>
          <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>
            {ar ? "اكتب تفاصيل الوظيفة وسيتواصل معك المواهب المناسبة" : "Fill in the job details and matching talents will reach out"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Title */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Briefcase size={13} color={GREEN} />
                  {ar ? "عنوان الوظيفة *" : "Job Title *"}
                </span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={ar ? "مثال: مؤثر لحملة منتج جديد" : "e.g. Influencer for new product campaign"}
                style={inputStyle}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={13} color={GREEN} />
                  {ar ? "تفاصيل الوظيفة" : "Job Description"}
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={ar ? "اكتب تفاصيل العمل المطلوب، المتطلبات، طريقة التسليم…" : "Describe the work required, requirements, deliverables…"}
                rows={5}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Tag size={13} color={GREEN} />
                  {ar ? "نوع الموهبة المطلوبة" : "Talent Type Needed"}
                </span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(active ? "" : cat.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 20,
                        border: `1px solid ${active ? GOLD : BORDER}`,
                        backgroundColor: active ? (dark ? "rgba(255,184,0,0.12)" : "rgba(255,184,0,0.08)") : SURFACE,
                        color: active ? GOLD : MUTED,
                        fontSize: 13, fontWeight: active ? 700 : 400,
                        cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                      }}
                    >
                      {cat.icon} {ar ? cat.label_ar : cat.label_en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DollarSign size={13} color={GREEN} />
                  {ar ? "الميزانية (EGP)" : "Budget (EGP)"}
                </span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px" }}>{ar ? "الحد الأدنى" : "Min"}</p>
                  <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="500" min={0} style={inputStyle} />
                </div>
                <div>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px" }}>{ar ? "الحد الأقصى" : "Max"}</p>
                  <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="5000" min={0} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Date range */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} color={GREEN} />
                  {ar ? "فترة العمل" : "Work Period"}
                </span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px" }}>{ar ? "من" : "From"}</p>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    style={{ ...inputStyle, colorScheme: dark ? "dark" : "light" }} />
                </div>
                <div>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px" }}>{ar ? "إلى" : "To"}</p>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    style={{ ...inputStyle, colorScheme: dark ? "dark" : "light" }} />
                </div>
              </div>
            </div>

            {/* Slots */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={13} color={GREEN} />
                  {ar ? "عدد المواهب المطلوبة" : "Number of Talents Needed"}
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={() => setSlots(s => String(Math.max(1, Number(s) - 1)))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: SURFACE, color: TEXT, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ color: TEXT, fontSize: 20, fontWeight: 900, minWidth: 32, textAlign: "center" }}>{slots}</span>
                <button type="button" onClick={() => setSlots(s => String(Number(s) + 1))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${GREEN}`, backgroundColor: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)", color: GREEN, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <span style={{ color: MUTED, fontSize: 13 }}>{ar ? (Number(slots) === 1 ? "موهبة" : "مواهب") : (Number(slots) === 1 ? "talent" : "talents")}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ color: RED, fontSize: 13, margin: 0 }}>❌ {error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                backgroundColor: loading ? MUTED : GREEN,
                color: "#000", border: "none", borderRadius: 12,
                padding: "14px 0", fontSize: 15, fontWeight: 900,
                cursor: loading ? "default" : "pointer",
                fontFamily: "'Cairo',sans-serif", transition: "opacity 0.2s",
              }}
            >
              {loading
                ? (ar ? "جارٍ النشر…" : "Publishing…")
                : (<>{ar ? "نشر الوظيفة" : "Publish Job"} <ArrowRight size={16} /></>)}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}