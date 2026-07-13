"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import BookingTimeline from "./BookingTimeline";
import BriefForm from "./BriefForm";
import BriefView from "./BriefView";
import DeliverablesForm from "./DeliverablesForm";
import ReviewForm from "./ReviewForm";
import { MessageSquare, ArrowLeft, CreditCard, Send } from "lucide-react";

interface Profile { id: string; full_name: string | null; handle: string | null; avatar_url: string | null; is_verified?: boolean }
interface Job     { id: string; title: string; description?: string | null; category?: string | null }
interface Brief   { id: string; title: string; description: string | null; requirements: string | null; attachments: string[] | null; deadline: string | null; status: "pending"|"accepted"|"rejected"; reject_reason: string | null }
interface Deliverable { id: string; files: string[] | null; links: string[] | null; notes: string | null; status: "submitted"|"approved"|"revision_requested"; feedback: string | null; created_at: string }
interface Payment { id: string; amount: number; status: string; paid_at: string | null }
interface Review  { id: string; rating: number; comment: string | null; status: string }

interface BookingData {
  id: string;
  status: string;
  amount: number | null;
  created_at: string;
  service_type: string | null;
  brand_id: string;
  talent_user_id: string | null;
  job_id: string | null;
  paid_at: string | null;
  completed_at: string | null;
  notes: string | null;
  brand: Profile | null;
  talent: Profile | null;
  job: Job | null;
  brief: Brief | null;
  deliverables: Deliverable[];
  payment: Payment | null;
  review: Review | null;
  conversation_id: string | null;
}

interface Props { booking: BookingData; myRole: "brand" | "talent" }

const STATUS_META: Record<string, { ar: string; en: string; color: string }> = {
  contacting:      { ar: "تواصل",          en: "Contacting",      color: "#64748b" },
  brief_sent:      { ar: "تم إرسال الملخص", en: "Brief Sent",      color: "#3b82f6" },
  accepted:        { ar: "تم القبول",       en: "Brief Accepted",  color: "#8b5cf6" },
  in_progress:     { ar: "جاري التنفيذ",   en: "In Progress",     color: "#FFB800" },
  completed:       { ar: "بانتظار الموافقة","en": "Awaiting Approval", color: "#00D26A" },
  paid:            { ar: "مكتمل",          en: "Completed & Paid", color: "#00D26A" },
  cancelled:       { ar: "ملغي",           en: "Cancelled",       color: "#ef4444" },
};

const TX = {
  ar: {
    back:        "العودة للمشاريع",
    project:     "تفاصيل المشروع",
    amount:      "المبلغ المتفق عليه",
    service:     "نوع الخدمة",
    started:     "تاريخ البدء",
    chat:        "فتح المحادثة",
    sendBrief:   "إرسال ملخص المشروع",
    waitBrief:   "انتظار البراند لإرسال الملخص…",
    confirmPay:  "تأكيد الدفع وبدء العمل",
    waitPay:     "في انتظار تأكيد الدفع من البراند…",
    paying:      "جاري معالجة الدفع…",
    brief:       "ملخص المشروع",
    deliverables:"الأعمال المسلّمة",
    review:      "التقييم",
    jobTitle:    "الوظيفة",
    brand:       "البراند",
    talent:      "الموهبة",
  },
  en: {
    back:        "Back to Projects",
    project:     "Project Details",
    amount:      "Agreed Amount",
    service:     "Service Type",
    started:     "Started",
    chat:        "Open Chat",
    sendBrief:   "Send Project Brief",
    waitBrief:   "Waiting for brand to send the brief…",
    confirmPay:  "Confirm Payment & Start Work",
    waitPay:     "Waiting for brand to confirm payment…",
    paying:      "Processing payment…",
    brief:       "Project Brief",
    deliverables:"Deliverables",
    review:      "Review",
    jobTitle:    "Job",
    brand:       "Brand",
    talent:      "Talent",
  },
};

export default function BookingDetail({ booking: initialBooking, myRole }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const router = useRouter();
  const t = TX[lang];

  const [booking,     setBooking]     = useState(initialBooking);
  const [showBrief,   setShowBrief]   = useState(false);
  const [paying,      setPaying]      = useState(false);
  const [reviewDone,  setReviewDone]  = useState(!!booking.review);

  const BG     = dark ? "#090e1a" : "#f8fafc";
  const CARD   = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GOLD   = "#FFB800";
  const GREEN  = "#00D26A";

  const sm = STATUS_META[booking.status] ?? { ar: booking.status, en: booking.status, color: MUTED };

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/bookings/${booking.id}`);
    if (res.ok) {
      const { booking: b } = await res.json();
      setBooking(b);
    }
  }, [booking.id]);

  function openChat() {
    if (booking.conversation_id) {
      window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { conversationId: booking.conversation_id } }));
    } else {
      const otherId = myRole === "brand" ? booking.talent?.id : booking.brand?.id;
      if (otherId) window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { otherUserId: otherId } }));
    }
  }

  async function handlePayment() {
    setPaying(true);
    const res = await fetch(`/api/bookings/${booking.id}/payment`, { method: "POST" });
    setPaying(false);
    if (res.ok) refresh();
  }

  const other = myRole === "brand" ? booking.talent : booking.brand;
  const otherLabel = myRole === "brand" ? t.talent : t.brand;

  // Action panel logic
  const isBrand  = myRole === "brand";
  const st       = booking.status;

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
      <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 14px" }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr", padding: "24px 16px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Back */}
        <button onClick={() => router.push("/bookings")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 13, fontFamily: "'Cairo',sans-serif", marginBottom: 16, padding: 0 }}>
          <ArrowLeft size={14} /> {t.back}
        </button>

        {/* Header card */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              <p style={{ color: MUTED, fontSize: 12, margin: "0 0 4px" }}>{t.project}</p>
              <h1 style={{ color: TEXT, fontSize: 20, fontWeight: 900, margin: 0 }}>
                {booking.job?.title ?? (ar ? "مشروع مباشر" : "Direct Project")}
              </h1>
              {booking.service_type && (
                <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}33` }}>
                  {booking.service_type}
                </span>
              )}
            </div>
            <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, backgroundColor: `${sm.color}15`, color: sm.color, border: `1px solid ${sm.color}33` }}>
              {ar ? sm.ar : sm.en}
            </span>
          </div>

          {/* Parties */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
            {[{ label: t.brand, user: booking.brand }, { label: t.talent, user: booking.talent }].map(({ label, user }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: dark ? "#1e293b" : "#e2e8f0", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: MUTED }}>
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user?.full_name ?? "?")[0]}
                </div>
                <div>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{label}</p>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{user?.full_name ?? "—"}</p>
                </div>
              </div>
            ))}
            {booking.amount && (
              <div style={{ marginLeft: "auto" }}>
                <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{t.amount}</p>
                <p style={{ color: GOLD, fontSize: 18, fontWeight: 900, margin: 0 }}>{booking.amount.toLocaleString()} EGP</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <BookingTimeline status={booking.status} dark={dark} lang={lang} />

          {/* Chat button */}
          <button onClick={openChat}
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "9px 18px", backgroundColor: dark ? "rgba(255,184,0,0.08)" : "rgba(255,184,0,0.06)", color: GOLD, border: `1px solid ${GOLD}33`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo',sans-serif" }}>
            <MessageSquare size={15} /> {t.chat}
          </button>
        </div>

        {/* ── Action panel ── */}
        {st === "contacting" && isBrand && section(t.sendBrief,
          <button onClick={() => setShowBrief(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", backgroundColor: GREEN, color: "#000", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 900, fontFamily: "'Cairo',sans-serif" }}>
            <Send size={14} /> {t.sendBrief}
          </button>
        )}

        {st === "contacting" && !isBrand && section(t.brief,
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.waitBrief}</p>
        )}

        {st === "accepted" && isBrand && section(t.confirmPay,
          <button onClick={handlePayment} disabled={paying}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", backgroundColor: paying ? "rgba(0,210,106,0.5)" : GREEN, color: "#000", border: "none", borderRadius: 10, cursor: paying ? "default" : "pointer", fontSize: 14, fontWeight: 900, fontFamily: "'Cairo',sans-serif" }}>
            <CreditCard size={14} /> {paying ? t.paying : t.confirmPay}
          </button>
        )}

        {st === "accepted" && !isBrand && section(t.confirmPay,
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.waitPay}</p>
        )}

        {/* Brief section */}
        {booking.brief && (
          <div style={{ marginBottom: 16 }}>
            <BriefView
              brief={booking.brief}
              bookingId={booking.id}
              myRole={myRole}
              dark={dark}
              lang={lang}
              onRespond={refresh}
            />
          </div>
        )}

        {/* Deliverables section */}
        {["in_progress", "completed", "paid"].includes(st) && (
          <div style={{ marginBottom: 16 }}>
            <DeliverablesForm
              bookingId={booking.id}
              deliverables={booking.deliverables}
              myRole={myRole}
              bookingStatus={st}
              dark={dark}
              lang={lang}
              onUpdate={refresh}
            />
          </div>
        )}

        {/* Review section */}
        {st === "paid" && (
          <div style={{ marginBottom: 16 }}>
            <ReviewForm
              bookingId={booking.id}
              existingReview={booking.review ? { rating: booking.review.rating, comment: booking.review.comment } : null}
              myRole={myRole}
              dark={dark}
              lang={lang}
              onSubmit={() => { setReviewDone(true); refresh(); }}
            />
          </div>
        )}

      </div>

      {/* Brief Form Modal */}
      {showBrief && (
        <BriefForm
          bookingId={booking.id}
          dark={dark}
          lang={lang}
          onClose={() => setShowBrief(false)}
          onSuccess={() => { setShowBrief(false); refresh(); }}
        />
      )}
    </div>
  );
}
