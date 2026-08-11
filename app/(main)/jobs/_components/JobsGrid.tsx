"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Users, Calendar, Banknote, CheckCircle2, ClipboardList, Briefcase,
  Camera, UsersRound, Mic2, Sparkles, Aperture, Clapperboard, type LucideIcon,
} from "lucide-react";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { canApplyJob, isBrand, isGuestUser, type PermissionUser } from "@/lib/permissions";
import { cdnImage } from "@/lib/images";
import ApplyModal from "./ApplyModal";
import type { JobPost } from "../page";
import styles from "./JobsPage.module.css";

const CAT_ICONS: Record<string, LucideIcon> = {
  ugc: Camera, influencer: UsersRound, model: Sparkles,
  actor: Clapperboard, host: Mic2, photographer: Aperture,
};

const CAT_LABELS: Record<string, { ar: string; en: string }> = {
  ugc:          { ar: "UGC محتوى", en: "UGC Creator" },
  influencer:   { ar: "مؤثر",     en: "Influencer" },
  model:        { ar: "موديل",     en: "Model" },
  actor:        { ar: "ممثل",      en: "Actor" },
  host:         { ar: "مذيع",      en: "Host" },
  photographer: { ar: "مصور",      en: "Photographer" },
};

interface Props { lang: "ar" | "en"; jobs: JobPost[] }

function JobCard({
  job, lang, index, userInfo, onApplySuccess,
}: {
  job: JobPost; lang: "ar" | "en"; index: number;
  userInfo: PermissionUser | null;
  onApplySuccess: (jobId: string) => void;
}) {
  const router = useRouter();
  const { requestAuth } = useGuestGuard();
  const ar = lang === "ar";

  const CatIcon  = job.category ? (CAT_ICONS[job.category] ?? Briefcase) : Briefcase;
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

  const daysAgo   = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
  const timeLabel = daysAgo === 0 ? (ar ? "اليوم" : "Today") : daysAgo === 1 ? (ar ? "أمس" : "Yesterday") : ar ? `منذ ${daysAgo} أيام` : `${daysAgo}d ago`;

  const canApply  = canApplyJob(userInfo).allowed;
  const guest     = isGuestUser(userInfo);
  const brandUser = isBrand(userInfo);
  const isOwnJob  = brandUser && job.brand_id === userInfo?.id;

  const [applied,   setApplied]   = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!canApply) return;
    fetch(`/api/jobs/${job.id}/apply`)
      .then((r) => r.json())
      .then((d) => { if (d.applied) setApplied(true); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canApply, job.id]);

  function handleApplyClick() {
    if (guest) {
      requestAuth("apply_job");
      return;
    }
    setShowModal(true);
  }

  return (
    <>
      <motion.div
        suppressHydrationWarning
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className={styles.jobCard}
      >
        {/* Brand bar */}
        <div className={styles.jobBrandBar}>
          <div className={styles.jobBrandAvatar}>
            {job.brand?.avatar_url
              ? <img src={cdnImage(job.brand.avatar_url, 80)} alt="" />
              : (job.brand?.full_name ?? "?")[0].toUpperCase()}
          </div>
          <div className={styles.jobBrandInfo}>
            <p className={styles.jobBrandName}>{job.brand?.full_name ?? "—"}</p>
            {job.brand?.city && (
              <span className={styles.jobBrandLocation}>
                <MapPin size={10} />
                {job.brand.city}
              </span>
            )}
          </div>
          <span className={styles.jobTime}>{timeLabel}</span>
        </div>

        {/* Body */}
        <div className={styles.jobBody}>
          {catLabel && (
            <span className={styles.jobCategoryBadge}>
              <CatIcon size={11} />
              {catLabel}
            </span>
          )}

          <h3 className={styles.jobTitle}>{job.title}</h3>

          {job.description && <p className={styles.jobDescription}>{job.description}</p>}

          <div className={styles.jobMetaRow}>
            <span className={`${styles.jobMetaItem} ${styles.jobBudget}`}>
              <Banknote size={13} />
              {fmtBudget()}
            </span>
            <span className={styles.jobMetaItem}>
              <Users size={13} />
              {job.slots} {ar ? (job.slots === 1 ? "مقعد" : "مقاعد") : (job.slots === 1 ? "slot" : "slots")}
            </span>
            {(job.start_date || job.end_date) && (
              <span className={`${styles.jobMetaItem} ${styles.jobMetaDate}`}>
                <Calendar size={13} />
                {job.end_date && job.start_date !== job.end_date
                  ? `${fmtDate(job.start_date)} – ${fmtDate(job.end_date)}`
                  : fmtDate(job.start_date)}
              </span>
            )}
          </div>

          <div className={styles.jobFooter}>
            {isOwnJob ? (
              <button
                type="button"
                className={`${styles.ctaBase} ${styles.ctaViewApps}`}
                onClick={() => router.push(`/jobs/${job.id}/applications`)}
              >
                <ClipboardList size={14} />
                {ar ? "عرض الطلبات" : "View applications"}
              </button>
            ) : canApply || guest ? (
              applied ? (
                <button type="button" disabled className={`${styles.ctaBase} ${styles.ctaApplied}`}>
                  <CheckCircle2 size={14} /> {ar ? "تم الإرسال ✓" : "Proposal sent ✓"}
                </button>
              ) : (
                <button type="button" className={`${styles.ctaBase} ${styles.ctaApply}`} onClick={handleApplyClick}>
                  {ar ? "قدّم عرضك" : "Submit proposal"}
                </button>
              )
            ) : (
              <button type="button" disabled className={`${styles.ctaBase} ${styles.ctaDisabled}`}>
                {ar ? "للمواهب فقط" : "Talents only"}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {showModal && (
        <ApplyModal
          job={job} lang={lang}
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

export default function JobsGrid({ lang, jobs }: Props) {
  const ar = lang === "ar";
  const { user: userInfo } = useGuestGuard();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  function handleApplySuccess() {
    const toastMsg = ar ? "تم إرسال عرضك بنجاح ✓" : "Proposal submitted successfully ✓";
    setSuccessToast(toastMsg);
    setTimeout(() => setSuccessToast(null), 4000);
  }

  if (jobs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}><Briefcase size={26} /></span>
        <p className={styles.emptyTitle}>{ar ? "لا توجد وظائف مطابقة" : "No jobs match your filters"}</p>
        <p className={styles.emptyText}>{ar ? "جرّب تغيير الفلاتر أو إعادة الضبط" : "Try adjusting or resetting your filters."}</p>
      </div>
    );
  }

  return (
    <>
      {successToast && <div className={styles.toast}>{successToast}</div>}

      <div className={styles.jobsGrid}>
        {jobs.map((job, i) => (
          <JobCard
            key={job.id} job={job} lang={lang} index={i}
            userInfo={userInfo}
            onApplySuccess={handleApplySuccess}
          />
        ))}
      </div>
    </>
  );
}
