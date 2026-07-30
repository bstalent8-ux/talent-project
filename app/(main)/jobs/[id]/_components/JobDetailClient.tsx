"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Banknote, Calendar, Send, Users } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { canApplyJob, isGuestUser } from "@/lib/permissions";
import { useGuestGuard } from "@/contexts/GuestGuard";
import ApplyModal from "../../_components/ApplyModal";
import type { JobPost } from "../../page";

export default function JobDetailClient({ job }: { job: JobPost }) {
  const { lang, dark } = useSite();
  const { user, requestAuth } = useGuestGuard();
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);

  const ar = lang === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#F8FAFC" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const GREEN = "#00D26A";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const Arrow = ar ? ArrowRight : ArrowLeft;

  const budget = job.budget_min || job.budget_max
    ? `${(job.budget_min ?? job.budget_max)?.toLocaleString()}${job.budget_max && job.budget_max !== job.budget_min ? ` - ${job.budget_max.toLocaleString()}` : ""} ${job.currency}`
    : ar ? "يتفق عليه" : "Negotiable";

  function apply() {
    if (isGuestUser(user)) {
      requestAuth("apply_job");
      return;
    }
    if (!canApplyJob(user).allowed) return;
    setShowApply(true);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: dark ? "#050B12" : "#F1F5F9", padding: "40px 24px 80px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <main style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: GREEN, fontWeight: 800, textDecoration: "none", marginBottom: 20 }}>
          <Arrow size={16} />
          {ar ? "العودة للوظائف" : "Back to jobs"}
        </Link>

        <article style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 }}>
          <p style={{ color: GREEN, fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>
            {job.brand?.full_name ?? (ar ? "براند" : "Brand")}
          </p>
          <h1 style={{ color: TEXT, fontSize: 28, lineHeight: 1.35, fontWeight: 900, margin: "0 0 14px" }}>
            {job.title}
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: TEXT, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700 }}>
              <Banknote size={15} color={GREEN} />
              {budget}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", fontSize: 13 }}>
              <Users size={15} color={GREEN} />
              {job.slots} {ar ? "مقاعد" : "slots"}
            </span>
            {(job.start_date || job.end_date) && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", fontSize: 13 }}>
                <Calendar size={15} color={GREEN} />
                {job.start_date ?? ""}{job.end_date ? ` - ${job.end_date}` : ""}
              </span>
            )}
          </div>

          {job.description && (
            <p style={{ color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 15, margin: "0 0 28px" }}>
              {job.description}
            </p>
          )}

          <button
            type="button"
            data-e2e="apply-job"
            onClick={apply}
            disabled={!isGuestUser(user) && !canApplyJob(user).allowed}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: GREEN,
              color: "#050B12",
              border: "none",
              borderRadius: 10,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 900,
              cursor: !isGuestUser(user) && !canApplyJob(user).allowed ? "not-allowed" : "pointer",
              opacity: !isGuestUser(user) && !canApplyJob(user).allowed ? 0.45 : 1,
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            <Send size={16} />
            {applied ? (ar ? "تم التقديم" : "Applied") : (ar ? "قدم على الوظيفة" : "Apply for this job")}
          </button>
        </article>
      </main>

      {showApply && (
        <ApplyModal
          job={job}
          dark={dark}
          lang={lang}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setShowApply(false);
            setApplied(true);
          }}
        />
      )}
    </div>
  );
}
