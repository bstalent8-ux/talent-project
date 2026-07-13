"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, Star, BadgeCheck, Clock, Banknote,
  MessageCircle, CheckCircle2, XCircle, ExternalLink, Link as LinkIcon,
  Users, ChevronLeft,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

interface TalentProfile { id: string; user_id: string; avg_rating: number | null; total_reviews: number | null; category: string | null }
interface TalentBasic   { id: string; full_name: string | null; handle: string | null; avatar_url: string | null; city: string | null; is_verified: boolean | null }
interface Application {
  id: string; talent_id: string; status: string;
  message: string | null; proposed_price: number | null;
  delivery_days: number | null; portfolio_links: string[] | null;
  reject_reason: string | null; created_at: string;
  talent: TalentBasic | null;
  talent_profile: TalentProfile | null;
}
interface Job {
  id: string; title: string; description: string | null; category: string | null;
  budget_min: number | null; budget_max: number | null; currency: string;
  status: string; slots: number; created_at: string;
}

const TX = {
  ar: {
    back:         "العودة للوظائف",
    applicants:   "المتقدمون",
    noApps:       "لا توجد طلبات حتى الآن",
    noAppsHint:   "شارك الوظيفة لتلقي عروض من المواهب",
    proposed:     "السعر المقترح",
    delivery:     "مدة التسليم",
    days:         "أيام",
    message:      "رسالة العرض",
    portfolio:    "أعمال سابقة",
    accept:       "قبول العرض",
    reject:       "رفض",
    chat:         "فتح المحادثة",
    profile:      "عرض الملف",
    accepted:     "مقبول ✓",
    rejected:     "مرفوض",
    pending:      "قيد المراجعة",
    withdrawn:    "مسحوب",
    accepting:    "جارٍ القبول…",
    rejecting:    "جارٍ الرفض…",
    rejectReason: "سبب الرفض (اختياري)",
    confirmRej:   "تأكيد الرفض",
    cancel:       "إلغاء",
    rating:       "تقييم",
    reviews:      "تقييم",
    verified:     "موثّق",
    budget:       "الميزانية",
    negotiable:   "يُتفق عليه",
    slots:        "مقاعد متاحة",
    total:        "إجمالي الطلبات",
    statsTitle:   "إحصائيات الوظيفة",
  },
  en: {
    back:         "Back to Jobs",
    applicants:   "Applicants",
    noApps:       "No applications yet",
    noAppsHint:   "Share the job to receive proposals from talents",
    proposed:     "Proposed Price",
    delivery:     "Delivery",
    days:         "days",
    message:      "Proposal",
    portfolio:    "Portfolio",
    accept:       "Accept Proposal",
    reject:       "Reject",
    chat:         "Open Chat",
    profile:      "View Profile",
    accepted:     "Accepted ✓",
    rejected:     "Rejected",
    pending:      "Pending",
    withdrawn:    "Withdrawn",
    accepting:    "Accepting…",
    rejecting:    "Rejecting…",
    rejectReason: "Reason for rejection (optional)",
    confirmRej:   "Confirm Reject",
    cancel:       "Cancel",
    rating:       "Rating",
    reviews:      "reviews",
    verified:     "Verified",
    budget:       "Budget",
    negotiable:   "Negotiable",
    slots:        "slots available",
    total:        "Total applications",
    statsTitle:   "Job Stats",
  },
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "#FFB800",
  accepted:  "#00D26A",
  rejected:  "#EF4444",
  withdrawn: "#64748B",
};

export default function ApplicationsClient({
  job, applications, brandId,
}: { job: Job; applications: Application[]; brandId: string }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t  = TX[lang];
  const ar = lang === "ar";

  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const BG     = dark ? "#050B12" : "#F1F5F9";
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.12)" : "#E2E8F0";
  const TEXT   = dark ? "#F1F5F9" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";

  const [apps, setApps]               = useState<Application[]>(applications);
  const [loadingId, setLoadingId]     = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function fmtBudget() {
    if (!job.budget_min && !job.budget_max) return t.negotiable;
    if (job.budget_min && job.budget_max && job.budget_min !== job.budget_max)
      return `${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()} ${job.currency}`;
    return `${(job.budget_max ?? job.budget_min)!.toLocaleString()} ${job.currency}`;
  }

  async function handleAccept(appId: string) {
    setLoadingId(appId + ":accept");
    try {
      const res = await fetch(`/api/jobs/${job.id}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (res.ok) {
        setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: "accepted" } : a));
        if (data.booking_id) {
          router.push(`/bookings/${data.booking_id}`);
        } else if (data.conversation_id) {
          window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { conversationId: data.conversation_id } }));
        }
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(appId: string) {
    setLoadingId(appId + ":reject");
    try {
      const res = await fetch(`/api/jobs/${job.id}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reject_reason: rejectReason }),
      });
      if (res.ok) {
        setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: "rejected", reject_reason: rejectReason } : a));
        setRejectModal(null);
        setRejectReason("");
      }
    } finally {
      setLoadingId(null);
    }
  }

  function openChat(talentId: string) {
    window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { otherUserId: talentId } }));
  }

  const pending   = apps.filter((a) => a.status === "pending").length;
  const accepted  = apps.filter((a) => a.status === "accepted").length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr", paddingBottom: 60 }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 0" }}>
        <button onClick={() => router.push("/jobs")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 13, fontWeight: 700, padding: 0, fontFamily: "'Cairo',sans-serif" }}>
          {ar ? <ArrowRight size={14} /> : <ChevronLeft size={14} />} {t.back}
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px" }}>
        {/* Job header */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>{job.title}</h1>
              {job.description && <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.6, maxWidth: 560 }}>{job.description}</p>}
            </div>
            {/* Stats */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: t.total,  value: apps.length,  color: TEXT },
                { label: t.pending ?? "Pending", value: pending,    color: GOLD },
                { label: t.accepted ?? "Accepted", value: accepted,   color: GREEN },
                { label: t.budget, value: fmtBudget(), color: MUTED },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", minWidth: 70 }}>
                  <p style={{ color: s.color, fontSize: 18, fontWeight: 900, margin: 0 }}>{s.value}</p>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Applications list */}
        {apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <span style={{ fontSize: 48 }}>📭</span>
            <p style={{ color: TEXT, fontSize: 16, fontWeight: 700, marginTop: 16 }}>{t.noApps}</p>
            <p style={{ color: MUTED, fontSize: 13 }}>{t.noAppsHint}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {apps.map((app, idx) => {
              const talent = app.talent;
              const tp     = app.talent_profile;
              const rating = tp?.avg_rating ?? 0;
              const isAccepting = loadingId === app.id + ":accept";
              const isRejecting = loadingId === app.id + ":reject";
              const isPending   = app.status === "pending";
              const statusColor = STATUS_COLORS[app.status] ?? MUTED;

              return (
                <motion.div key={app.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}
                >
                  {/* Status bar */}
                  <div style={{ height: 3, backgroundColor: statusColor, opacity: 0.7 }} />

                  <div style={{ padding: "18px 20px" }}>
                    {/* Talent row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      {/* Avatar */}
                      <div style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0, overflow: "hidden", backgroundColor: dark ? "#1e293b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: MUTED }}>
                        {talent?.avatar_url
                          ? <img src={talent.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : (talent?.full_name ?? "?")[0].toUpperCase()}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ color: TEXT, fontSize: 15, fontWeight: 800 }}>
                            {talent?.full_name ?? "—"}
                          </span>
                          {talent?.is_verified && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, backgroundColor: "rgba(0,210,106,0.1)", color: GREEN, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, border: "1px solid rgba(0,210,106,0.2)" }}>
                              <BadgeCheck size={10} /> {t.verified}
                            </span>
                          )}
                          <span style={{ backgroundColor: statusColor + "22", color: statusColor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, border: `1px solid ${statusColor}44` }}>
                            {t[app.status as keyof typeof t] ?? app.status}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3 }}>
                          {rating > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Star size={11} color={GOLD} fill={GOLD} />
                              <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{rating.toFixed(1)}</span>
                              {tp?.total_reviews ? <span style={{ color: MUTED, fontSize: 11 }}>({tp.total_reviews})</span> : null}
                            </div>
                          )}
                          {talent?.city && <span style={{ color: MUTED, fontSize: 11 }}>📍 {talent.city}</span>}
                          <span style={{ color: MUTED, fontSize: 11 }}>
                            {new Date(app.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>

                      {/* Proposed price */}
                      {app.proposed_price && (
                        <div style={{ textAlign: ar ? "left" : "right" }}>
                          <p style={{ color: GREEN, fontSize: 22, fontWeight: 900, margin: 0, direction: "ltr" }}>
                            {app.proposed_price.toLocaleString()} <span style={{ fontSize: 12 }}>{job.currency}</span>
                          </p>
                          {app.delivery_days && (
                            <p style={{ color: MUTED, fontSize: 11, margin: 0, display: "flex", alignItems: "center", gap: 3, justifyContent: ar ? "flex-start" : "flex-end" }}>
                              <Clock size={10} /> {app.delivery_days} {t.days}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Proposal message */}
                    {app.message && (
                      <div style={{ backgroundColor: dark ? "#060d18" : "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                        <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 4 }}>
                          <Users size={10} /> {t.message}
                        </p>
                        <p style={{ color: TEXT, fontSize: 13, margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{app.message}</p>
                      </div>
                    )}

                    {/* Portfolio links */}
                    {app.portfolio_links && app.portfolio_links.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
                          <LinkIcon size={10} /> {t.portfolio}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {app.portfolio_links.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 4, color: GREEN, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(0,210,106,0.07)", border: "1px solid rgba(0,210,106,0.2)", textDecoration: "none" }}>
                              <ExternalLink size={11} /> {t.portfolio} {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                      {/* Accept */}
                      {isPending && (
                        <button onClick={() => handleAccept(app.id)} disabled={!!loadingId}
                          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: isAccepting ? "rgba(0,210,106,0.5)" : GREEN, color: "#000", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 800, cursor: loadingId ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                          <CheckCircle2 size={14} /> {isAccepting ? t.accepting : t.accept}
                        </button>
                      )}

                      {/* Reject */}
                      {isPending && (
                        <button onClick={() => setRejectModal(app.id)} disabled={!!loadingId}
                          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "transparent", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: loadingId ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                          <XCircle size={14} /> {t.reject}
                        </button>
                      )}

                      {/* Chat */}
                      <button onClick={() => openChat(app.talent_id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                        <MessageCircle size={14} /> {t.chat}
                      </button>

                      {/* View profile */}
                      {talent?.handle && (
                        <button onClick={() => router.push(`/talent/${talent.handle}`)}
                          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                          <ExternalLink size={14} /> {t.profile}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 420 }}>
            <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{t.reject}</h3>
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.rejectReason} rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#060d18" : "#F8FAFC", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none", resize: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => handleReject(rejectModal)} disabled={!!loadingId}
                style={{ flex: 1, backgroundColor: "#EF4444", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                {loadingId ? t.rejecting : t.confirmRej}
              </button>
              <button onClick={() => setRejectModal(null)}
                style={{ flex: 1, backgroundColor: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
