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
interface Brief   { id: string; title: string; description: string | null; requirements: string | null; attachments: string[] | null; deadline: string | null; status: "pending"|"accepted"|"rejected"|"changes_requested"; reject_reason: string | null }
interface Deliverable { id: string; files: string[] | null; links: string[] | null; notes: string | null; status: "submitted"|"approved"|"revision_requested"; feedback: string | null; created_at: string }
interface Payment { id: string; amount: number; status: string; paid_at: string | null }
interface Review  { id: string; rating: number; comment: string | null; status: string }

interface BookingData {
  id: string;
  status: string;
  amount: number | null;
  budget_type: string | null;
  budget_amount: number | null;
  start_date: string | null;
  duration: number | null;
  deadline: string | null;
  negotiation_message: string | null;
  negotiation_requested_at: string | null;
  created_at: string;
  updated_at: string | null;
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
  pending:         { ar: "قيد المراجعة",      en: "Pending Review",   color: "#FFB800" },
  contacting:      { ar: "تواصل",          en: "Contacting",      color: "#64748b" },
  brief_sent:      { ar: "تم إرسال الملخص", en: "Brief Sent",      color: "#60A5FA" },
  changes_requested:{ ar: "تعديلات مطلوبة",  en: "Changes Requested", color: "#FFB800" },
  accepted:        { ar: "تم القبول",       en: "Brief Accepted",  color: "#A78BFA" },
  rejected:        { ar: "مرفوض",           en: "Rejected",        color: "#ef4444" },
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
    budget:      "الميزانية",
    service:     "نوع الخدمة",
    started:     "تاريخ البدء",
    deadline:    "الموعد النهائي",
    duration:    "المدة",
    hours:       "ساعة",
    days:        "يوم",
    requestInfo: "تفاصيل طلب الحجز",
    chat:        "فتح المحادثة",
    sendBrief:   "إرسال ملخص المشروع",
    waitBrief:   "انتظار البراند لإرسال الملخص…",
    waitRequest: "طلب الحجز قيد مراجعة الموهبة.",
    waitTalent:  "راجع الطلب واختر قبول أو رفض أو طلب تعديلات.",
    rejectedInfo:"تم رفض طلب الحجز.",
    proposal:    "آخر اقتراح من الموهبة",
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
    budget:      "Budget",
    service:     "Service Type",
    started:     "Started",
    deadline:    "Deadline",
    duration:    "Duration",
    hours:       "hours",
    days:        "days",
    requestInfo: "Booking Request Details",
    chat:        "Open Chat",
    sendBrief:   "Send Project Brief",
    waitBrief:   "Waiting for brand to send the brief…",
    waitRequest: "The booking request is waiting for the talent's response.",
    waitTalent:  "Review the request and accept, reject, or request changes.",
    rejectedInfo:"This booking request was rejected.",
    proposal:    "Latest talent proposal",
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

  // Action panel logic
  const isBrand  = myRole === "brand";
  const st       = booking.status;
  const budgetAmount = booking.budget_amount ?? booking.amount;
  const serviceLabel =
    booking.service_type === "hourly" ? (ar ? "بالساعة" : "Hourly") :
    booking.service_type === "daily" ? (ar ? "باليوم" : "Daily") :
    booking.service_type === "fixed_project" ? (ar ? "مشروع ثابت" : "Fixed Project") :
    (ar ? "طلب مباشر" : "Direct");
  const durationLabel = booking.duration
    ? `${booking.duration} ${booking.service_type === "hourly" ? t.hours : t.days}`
    : booking.deadline
      ? new Date(booking.deadline).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "—";

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

        {section(t.requestInfo,
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {[
              { label: t.service, value: serviceLabel },
              { label: t.budget, value: budgetAmount ? `${budgetAmount.toLocaleString()} EGP` : "—" },
              { label: t.started, value: booking.start_date ? new Date(booking.start_date).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              { label: booking.service_type === "fixed_project" ? t.deadline : t.duration, value: durationLabel },
            ].map((item) => (
              <div key={item.label} style={{ backgroundColor: dark ? "#0A121C" : "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>{item.label}</p>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 800, margin: 0 }}>{item.value}</p>
              </div>
            ))}
            {booking.negotiation_message && (
              <div style={{ gridColumn: "1 / -1", backgroundColor: "rgba(255,184,0,0.08)", border: `1px solid ${GOLD}33`, borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ color: GOLD, fontSize: 11, fontWeight: 800, margin: "0 0 4px" }}>{t.proposal}</p>
                <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{booking.negotiation_message}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Action panel ── */}
        {["pending", "changes_requested", "brief_sent"].includes(st) && isBrand && section(t.brief,
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.waitRequest}</p>
        )}

        {["pending", "changes_requested", "brief_sent"].includes(st) && !isBrand && section(t.brief,
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.waitTalent}</p>
        )}

        {st === "rejected" && section(t.brief,
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.rejectedInfo}</p>
        )}

        {st === "contacting" && isBrand && section(t.sendBrief,
          <button onClick={() => setShowBrief(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", backgroundColor: GREEN, color: "#050B12", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 900, fontFamily: "'Cairo',sans-serif" }}>
            <Send size={14} /> {t.sendBrief}
          </button>
        )}

        {st === "contacting" && !isBrand && section(t.brief,
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{t.waitBrief}</p>
        )}

        {st === "accepted" && isBrand && section(t.confirmPay,
          <button onClick={handlePayment} disabled={paying}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", backgroundColor: paying ? "rgba(0,210,106,0.5)" : GREEN, color: "#050B12", border: "none", borderRadius: 10, cursor: paying ? "default" : "pointer", fontSize: 14, fontWeight: 900, fontFamily: "'Cairo',sans-serif" }}>
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
              bookingStatus={booking.status}
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
