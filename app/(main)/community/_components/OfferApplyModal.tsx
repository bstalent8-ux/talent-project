"use client";
import { useState } from "react";
import { X, Banknote, FileText, Send } from "lucide-react";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { canApplyOffer } from "@/lib/permissions";
import styles from "./CommunityPage.module.css";

interface Props {
  postId: string;
  postTitle: string;
  price: number | null;
  lang: "ar" | "en";
  onClose: () => void;
  onSuccess: () => void;
}

const TX = {
  ar: {
    title: "تقدّم على العرض", subtitle: "أرسل طلبك للموهبة",
    price: "سعر مقترح (اختياري، EGP)", pricePh: "لو حابب تفاوض على السعر المعلن",
    message: "رسالتك", messagePh: "اشرح ليه محتاج العرض ده ولإيه…",
    submit: "أرسل الطلب", cancel: "إلغاء", sending: "جاري الإرسال…",
    required: "من فضلك اكتب رسالة", offeredPrice: "السعر المعلن", negotiable: "يُتفق عليه",
  },
  en: {
    title: "Apply to this offer", subtitle: "Send your request to the talent",
    price: "Proposed price (optional, EGP)", pricePh: "If you'd like to negotiate the posted price",
    message: "Your message", messagePh: "Explain why you need this offer and for what…",
    submit: "Send request", cancel: "Cancel", sending: "Sending…",
    required: "Please write a message", offeredPrice: "Posted price", negotiable: "Negotiable",
  },
} as const;

export default function OfferApplyModal({ postId, postTitle, price, lang, onClose, onSuccess }: Props) {
  const t = TX[lang];
  const { user, requestAuth } = useGuestGuard();
  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canApplyOffer(user).allowed) {
      onClose();
      requestAuth("apply_offer");
      return;
    }
    if (!message.trim()) { setError(t.required); return; }

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/posts/${postId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          proposed_price: proposedPrice ? Number(proposedPrice) : null,
        }),
      });
      const data = await res.json();
      if (res.ok || data.already_applied) {
        onSuccess();
      } else {
        setError(data.error ?? "Error");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t.title}</h2>
        <p style={{ margin: "-0.8rem 0 1rem", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{postTitle}</p>

        <div className={styles.postMetaRow} style={{ marginBottom: "1rem" }}>
          <span className={styles.postMetaItem}>
            <Banknote size={13} />
            {t.offeredPrice}: <span className={styles.postPrice}>{price ? `${price.toLocaleString()} EGP` : t.negotiable}</span>
          </span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="offer-price"><Banknote size={12} /> {t.price}</label>
            <input id="offer-price" type="number" min={0} value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} placeholder={t.pricePh} />
          </div>
          <div className={styles.field}>
            <label htmlFor="offer-message"><FileText size={12} /> {t.message}</label>
            <textarea id="offer-message" rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.messagePh} />
          </div>

          {error && <div className={styles.formError}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="submit" className={`${styles.button} ${styles.buttonSubmit}`} disabled={sending}>
              <Send size={14} />
              {sending ? t.sending : t.submit}
            </button>
            <button type="button" className={`${styles.button} ${styles.buttonCancel}`} onClick={onClose}>
              <X size={16} />
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
