"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Users, Calendar, Banknote, CheckCircle2, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ApplyModal from "./ApplyModal";
import type { JobPost } from "../page";

const CAT_ICONS: Record<string, string> = {
  ugc: "🎬", influencer: "📱", model: "👗", actor: "🎭", host: "🎤", photographer: "📸",
};

const CAT_LABELS: Record<string, { ar: string; en: string }> = {
  ugc:          { ar: "UGC محتوى", en: "UGC Creator" },
  influencer:   { ar: "مؤثر",     en: "Influencer" },
  model:        { ar: "موديل",     en: "Model" },
  actor:        { ar: "ممثل",      en: "Actor" },
  host:         { ar: "مذيع",      en: "Host" },
  photographer: { ar: "مصور",      en: "Photographer" },
};

interface Props { dark: boolean; lang: "ar" | "en"; jobs: JobPost[] }

interface UserInfo { id: string; role: string }

function JobCard({
  job, dark, lang, index, userInfo, onApplySuccess,
}: {
  job: JobPost; dark: boolean; lang: "ar" | "en"; index: number;
  userInfo: UserInfo | null;
  onApplySuccess: (jobId: string) => void;
}) {
  const router = useRouter();
  const ar     = lang === "ar";
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";

  const catIcon  = job.category ? (CAT_ICONS[job.category] ?? "💼") : "💼";
  const catLabel = job.category
    ? (ar ? CAT_LABELS[job.category]?.ar : CAT_LABELS[job.category]?.en) ?? job.category
    : null;

  function fmtDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short" });
  }
  function fmtBudget() {
    if (!job.budget_min && !job.budget_max) return ar ? "يُتفق عليه" : "Negotiable";
    if (job.budget_min && job.budget_max && job.budget_min !== job.budget_max)
      return `${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()} ${job.currency}`;
    return `${(job.budget_max ?? job.budget_min)!.toLocaleString()} ${job.currency}`;
  }

  const daysAgo  = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
  const timeLabel = daysAgo === 0 ? (ar ? "اليوم" : "Today") : daysAgo === 1 ? (ar ? "أمس" : "Yesterday") : ar ? `منذ ${daysAgo} أيام` : `${daysAgo}d ago`;

  const talentRoles = ["talent", "freelancer", "ugc"];
  const canApply    = !!userInfo && talentRoles.includes(userInfo.role);
  const isBrand     = userInfo?.role === "brand";
  const isOwnJob    = isBrand && job.brand_id === userInfo?.id;

  const [applied,     setApplied]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);

  // Check if already applied on mount
  useEffect(() => {
    if (!canApply) return;
    fetch(`/api/jobs/${job.id}/apply`)
      .then((r) => r.json())
      .then((d) => { if (d.applied) setApplied(true); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canApply, job.id]);

  function handleApplyClick() {
    if (!userInfo) { router.push("/login"); return; }
    setShowModal(true);
  }

  return (
    <>
      <motion.div
        suppressHydrationWarning
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        whileHover={{ y: -3, boxShadow: dark ? "0 8px 32px rgba(0,210,106,0.1)" : "0 8px 24px rgba(0,0,0,0.08)" }}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", transition: "box-shadow 0.2s" }}
      >
        {/* Brand bar */}
        <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, backgroundColor: dark ? "#1e293b" : "#e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: MUTED }}>
            {job.brand?.avatar_url
              ? <img src={job.brand.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (job.brand?.full_name ?? "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {job.brand?.full_name ?? "—"}
            </p>
            {job.brand?.city && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={10} color={MUTED} />
                <span style={{ color: MUTED, fontSize: 10 }}>{job.brand.city}</span>
              </div>
            )}
          </div>
          <span style={{ color: MUTED, fontSize: 10, flexShrink: 0 }}>{timeLabel}</span>
        </div>

        {/* Content */}
        <div style={{ padding: "12px 16px 16px" }}>
          {catLabel && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: dark ? "rgba(255,184,0,0.08)" : "rgba(255,184,0,0.06)", color: GOLD, border: "1px solid rgba(255,184,0,0.2)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
              {catIcon} {catLabel}
            </span>
          )}

          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.4 }}>{job.title}</h3>

          {job.description && (
            <p style={{ color: MUTED, fontSize: 12, margin: "0 0 12px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
              {job.description}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Banknote size={13} color={GREEN} />
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{fmtBudget()}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={13} color={GREEN} />
              <span style={{ color: MUTED, fontSize: 12 }}>{job.slots} {ar ? (job.slots === 1 ? "مقعد" : "مقاعد") : (job.slots === 1 ? "slot" : "slots")}</span>
            </div>
            {(job.start_date || job.end_date) && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={13} color={GOLD} />
                <span style={{ color: MUTED, fontSize: 12 }}>
                  {fmtDate(job.start_date)}{job.end_date && job.start_date !== job.end_date ? ` → ${fmtDate(job.end_date)}` : ""}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          {isOwnJob ? (
            // Brand sees "View Applications" for their own jobs
            <button
              onClick={() => router.push(`/jobs/${job.id}/applications`)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(0,210,106,0.08)", color: GREEN, border: `1.5px solid rgba(0,210,106,0.3)`, borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
            >
              <ClipboardList size={14} />
              {ar ? "عرض الطلبات" : "View Applications"}
            </button>
          ) : canApply ? (
            applied ? (
              <button disabled style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(0,210,106,0.1)", color: GREEN, border: `1.5px solid ${GREEN}`, borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "default", fontFamily: "'Cairo',sans-serif" }}>
                <CheckCircle2 size={14} /> {ar ? "تم الإرسال ✓" : "Proposal Sent ✓"}
              </button>
            ) : (
              <button
                onClick={handleApplyClick}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GREEN, color: "#000", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
              >
                {ar ? "قدّم عرضك" : "Submit Proposal"}
              </button>
            )
          ) : (
            <button disabled style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: dark ? "rgba(255,255,255,0.04)" : "#f1f5f9", color: MUTED, border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "not-allowed", fontFamily: "'Cairo',sans-serif" }}>
              {ar ? "للمواهب فقط" : "Talents Only"}
            </button>
          )}
        </div>
      </motion.div>

      {showModal && (
        <ApplyModal
          job={job} dark={dark} lang={lang}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setApplied(true);
            onApplySuccess(job.id);
          }}
        />
      )}
    </>
  );
}

export default function JobsGrid({ dark, lang, jobs }: Props) {
  const ar    = lang === "ar";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const GREEN = "#00D26A";

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await createClient()
        .from("profiles").select("role").eq("id", data.user.id).single();
      if (profile) setUserInfo({ id: data.user.id, role: profile.role });
    });
  }, []);

  function handleApplySuccess(jobId: string) {
    const toastMsg = lang === "ar" ? "تم إرسال عرضك بنجاح ✓" : "Proposal submitted successfully ✓";
    setSuccessToast(toastMsg);
    setTimeout(() => setSuccessToast(null), 4000);
  }

  if (jobs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", gap: 12 }}>
        <span style={{ fontSize: 48 }}>💼</span>
        <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>{ar ? "لا توجد وظائف متاحة حالياً" : "No jobs available right now"}</p>
        <p style={{ color: GREEN, fontSize: 13, margin: 0 }}>{ar ? "تابعنا لاحقاً أو غيّر الفلاتر" : "Check back later or adjust filters"}</p>
      </div>
    );
  }

  return (
    <>
      {/* Success toast */}
      {successToast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 2000, backgroundColor: "#00D26A", color: "#000", padding: "12px 24px", borderRadius: 12, fontWeight: 800, fontSize: 14, fontFamily: "'Cairo',sans-serif", boxShadow: "0 8px 24px rgba(0,210,106,0.4)" }}>
          {successToast}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {jobs.map((job, i) => (
          <JobCard
            key={job.id} job={job} dark={dark} lang={lang} index={i}
            userInfo={userInfo}
            onApplySuccess={handleApplySuccess}
          />
        ))}
      </div>
    </>
  );
}
