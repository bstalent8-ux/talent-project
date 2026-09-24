"use client";
import { useEffect, useState } from "react";
import { X, Check, XCircle, Clock } from "lucide-react";
import styles from "./CommunityPage.module.css";

interface ApplicantProfile {
  id: string;
  full_name: string | null;
  handle: string | null;
  avatar_url: string | null;
}

interface NormalizedApplication {
  id: string;
  applicant: ApplicantProfile | null;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  proposedPrice: number | null;
  deliveryDays: number | null;
  createdAt: string;
}

interface Props {
  kind: "job" | "offer";
  postId: string;
  postTitle: string;
  lang: "ar" | "en";
  onClose: () => void;
  /** Fires once after any accept/reject so the parent can refresh the feed
   *  (an accepted job/offer flips status and a booking now exists). */
  onChanged: () => void;
}

const TX = {
  ar: {
    title: "المتقدمون", loading: "جاري التحميل…", empty: "لسه محدش قدّم.",
    pending: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض",
    accept: "قبول", reject: "رفض", close: "إغلاق",
    proposedPrice: "السعر المقترح", delivery: "مدة التسليم", days: "يوم",
  },
  en: {
    title: "Applicants", loading: "Loading…", empty: "No applications yet.",
    pending: "Pending", accepted: "Accepted", rejected: "Rejected",
    accept: "Accept", reject: "Reject", close: "Close",
    proposedPrice: "Proposed price", delivery: "Delivery time", days: "days",
  },
} as const;

export default function ApplicantsModal({ kind, postId, postTitle, lang, onClose, onChanged }: Props) {
  const t = TX[lang];
  const [apps, setApps] = useState<NormalizedApplication[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const baseUrl = kind === "job" ? `/api/jobs/${postId}/applications` : `/api/community/posts/${postId}/applications`;

  useEffect(() => {
    let cancelled = false;
    fetch(baseUrl).then((r) => r.json()).then((data) => {
      if (cancelled) return;
      const raw = data.applications ?? [];
      const normalized: NormalizedApplication[] = raw.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        applicant: (kind === "job" ? a.talent : a.brand) as ApplicantProfile | null,
        status: a.status as "pending" | "accepted" | "rejected",
        message: a.message as string | null,
        proposedPrice: a.proposed_price as number | null,
        deliveryDays: (a.delivery_days as number | null) ?? null,
        createdAt: a.created_at as string,
      }));
      setApps(normalized);
    }).catch(() => setApps([]));
    return () => { cancelled = true; };
  }, [baseUrl, kind]);

  async function act(appId: string, action: "accept" | "reject") {
    setBusyId(appId);
    const res = await fetch(`${baseUrl}/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (res.ok) {
      setApps((prev) => prev?.map((a) => (a.id === appId ? { ...a, status: action === "accept" ? "accepted" : "rejected" } : a)) ?? null);
      onChanged();
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t.title}</h2>
        <p style={{ margin: "-0.8rem 0 1rem", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{postTitle}</p>

        {apps === null ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>{t.loading}</p>
        ) : apps.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>{t.empty}</p>
        ) : (
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {apps.map((a) => (
              <div key={a.id} className={styles.applicantRow}>
                <img
                  className={styles.applicantAvatar}
                  src={a.applicant?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.applicant?.full_name ?? a.id}`}
                  alt=""
                />
                <div className={styles.applicantBody}>
                  <div className={styles.applicantName}>
                    {a.applicant?.full_name ?? "—"}
                    <span className={`${styles.statusPill} ${
                      a.status === "accepted" ? styles.statusPillAccepted
                      : a.status === "rejected" ? styles.statusPillRejected
                      : styles.statusPillPending
                    }`}>
                      {a.status === "accepted" ? <Check size={10} /> : a.status === "rejected" ? <XCircle size={10} /> : <Clock size={10} />}
                      {a.status === "accepted" ? t.accepted : a.status === "rejected" ? t.rejected : t.pending}
                    </span>
                  </div>
                  {a.message && <p className={styles.applicantMessage}>{a.message}</p>}
                  <div className={styles.postMetaRow} style={{ margin: "0.5rem 0 0" }}>
                    {a.proposedPrice != null && (
                      <span className={styles.postMetaItem}>{t.proposedPrice}: <span className={styles.postPrice}>{a.proposedPrice.toLocaleString()} EGP</span></span>
                    )}
                    {a.deliveryDays != null && (
                      <span className={styles.postMetaItem}>{t.delivery}: {a.deliveryDays} {t.days}</span>
                    )}
                  </div>
                  {a.status === "pending" && (
                    <div className={styles.applicantActions}>
                      <button type="button" className={`${styles.postActionBtn} ${styles.postActionBtnPrimary}`} disabled={busyId === a.id} onClick={() => act(a.id, "accept")}>
                        <Check size={13} />{t.accept}
                      </button>
                      <button type="button" className={styles.postActionBtn} disabled={busyId === a.id} onClick={() => act(a.id, "reject")}>
                        <XCircle size={13} />{t.reject}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalActions} style={{ marginTop: "1.2rem" }}>
          <button type="button" className={`${styles.button} ${styles.buttonCancel}`} onClick={onClose}>
            <X size={16} />
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
