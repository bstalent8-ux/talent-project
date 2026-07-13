"use client";
import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  bookingId: string;
  existingReview: { rating: number; comment: string | null } | null;
  myRole: "brand" | "talent";
  dark: boolean;
  lang: "ar" | "en";
  onSubmit: () => void;
}

const TX = {
  ar: {
    title:    "تقييم التجربة",
    submitted: "شكراً على تقييمك!",
    rating:   "التقييم",
    comment:  "تعليق (اختياري)",
    comPh:    "كيف كانت تجربتك مع هذه الموهبة؟",
    send:     "إرسال التقييم",
    sending:  "جاري الإرسال…",
    talentOnly: "التقييم متاح فقط للبراند في هذه المرحلة",
  },
  en: {
    title:    "Rate the Experience",
    submitted: "Thank you for your review!",
    rating:   "Rating",
    comment:  "Comment (optional)",
    comPh:    "How was your experience with this talent?",
    send:     "Submit Review",
    sending:  "Sending…",
    talentOnly: "Reviews are submitted by the brand after completion",
  },
};

export default function ReviewForm({ bookingId, existingReview, myRole, dark, lang, onSubmit }: Props) {
  const t  = TX[lang];
  const ar = lang === "ar";
  const BG     = dark ? "#0d1623" : "#ffffff";
  const BORDER = dark ? "#1e293b" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GOLD   = "#FFB800";
  const GREEN  = "#00D26A";

  const [rating,  setRating]  = useState(existingReview?.rating ?? 0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [sending, setSending] = useState(false);

  if (myRole !== "brand") {
    return (
      <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "16px 20px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
        <p style={{ color: MUTED, fontSize: 13, margin: 0, textAlign: "center" }}>{t.talentOnly}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setSending(true);
    await fetch(`/api/bookings/${bookingId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment.trim() || null }),
    });
    setSending(false);
    onSubmit();
  }

  if (existingReview) {
    return (
      <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
        <p style={{ color: GREEN, fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>{t.submitted}</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={20} fill={s <= existingReview.rating ? GOLD : "none"} stroke={s <= existingReview.rating ? GOLD : MUTED} />
          ))}
        </div>
        {existingReview.comment && <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{existingReview.comment}</p>}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 24px", fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 14px" }}>{t.title}</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 8, display: "block" }}>{t.rating}</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map((s) => (
              <button key={s} type="button"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Star size={28} fill={(hover || rating) >= s ? GOLD : "none"} stroke={(hover || rating) >= s ? GOLD : MUTED} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ color: MUTED, fontSize: 12, fontWeight: 700, marginBottom: 6, display: "block" }}>{t.comment}</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.comPh} rows={3}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: dark ? "#060d18" : "#f8fafc", border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
        </div>

        <button type="submit" disabled={sending || !rating}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: !rating ? MUTED : GREEN, color: "#000", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: sending || !rating ? "default" : "pointer", opacity: !rating ? 0.5 : 1, fontFamily: "'Cairo',sans-serif" }}>
          {sending ? t.sending : t.send}
        </button>
      </form>
    </div>
  );
}
