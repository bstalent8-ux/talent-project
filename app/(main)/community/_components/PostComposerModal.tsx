"use client";
import { useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import { uploadToCloudinary, cloudinaryUploadErrorText } from "@/lib/cloudinary-client-upload";
import styles from "./CommunityPage.module.css";
import type { PostType } from "./PostTypeMenu";

const TALENT_CATEGORIES = [
  { key: "ugc",          label_ar: "مبدع محتوى UGC", label_en: "UGC Creator" },
  { key: "influencer",   label_ar: "مؤثر",           label_en: "Influencer" },
  { key: "model",        label_ar: "موديل",          label_en: "Model" },
  { key: "actor",        label_ar: "ممثل",           label_en: "Actor" },
  { key: "host",         label_ar: "مذيع / مقدم",    label_en: "Host" },
  { key: "photographer", label_ar: "مصور",           label_en: "Photographer" },
];

interface Props {
  type: Exclude<PostType, "question">;
  lang: "ar" | "en";
  onClose: () => void;
  onSuccess: () => void;
}

const TX = {
  ar: {
    jobTitle: "نشر وظيفة", offerTitle: "نشر عرض", storyTitle: "إضافة Story",
    title: "العنوان", titlePh: "مثال: مؤثر لحملة منتج جديد",
    description: "التفاصيل", descriptionPhJob: "اكتب تفاصيل العمل المطلوب، المتطلبات، طريقة التسليم…",
    descriptionPhOffer: "اشرح ما يقدمه العرض بالتفصيل…",
    category: "نوع الموهبة", budget: "الميزانية (EGP)", budgetMin: "الحد الأدنى", budgetMax: "الحد الأقصى",
    price: "السعر (EGP)", pricePh: "مثال: 3000",
    expiresAt: "متاح للتقديم حتى (اختياري)",
    storyText: "نص الـ story (اختياري لو رافع صورة)", storyTextPh: "اكتب حاجة سريعة…",
    storyImage: "صورة (اختياري)", uploading: "جاري الرفع…", removeImage: "إزالة الصورة",
    submit: "نشر", submitting: "جاري النشر…", cancel: "إلغاء",
    errRequired: "من فضلك أكمل الحقول المطلوبة", errGeneric: "حصل خطأ، حاول تاني",
  },
  en: {
    jobTitle: "Post a job", offerTitle: "Post an offer", storyTitle: "Add a story",
    title: "Title", titlePh: "e.g. Influencer for a new product campaign",
    description: "Details", descriptionPhJob: "Describe the work, requirements, deliverables…",
    descriptionPhOffer: "Describe what the offer includes…",
    category: "Talent type", budget: "Budget (EGP)", budgetMin: "Min", budgetMax: "Max",
    price: "Price (EGP)", pricePh: "e.g. 3000",
    expiresAt: "Open for applications until (optional)",
    storyText: "Story text (optional if you add an image)", storyTextPh: "Write something quick…",
    storyImage: "Image (optional)", uploading: "Uploading…", removeImage: "Remove image",
    submit: "Post", submitting: "Posting…", cancel: "Cancel",
    errRequired: "Please fill in the required fields", errGeneric: "Something went wrong, try again",
  },
} as const;

export default function PostComposerModal({ type, lang, onClose, onSuccess }: Props) {
  const t = TX[lang];
  const ar = lang === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [price, setPrice] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const result = await uploadToCloudinary(file, {
      cloudName:    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      folder:       `${process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents"}/stories`,
      resourceType: "image",
    });
    setUploading(false);
    if (result.ok && result.url) {
      setMediaUrl(result.url);
    } else {
      setError(result.errorKind ? cloudinaryUploadErrorText(result.errorKind, lang) : t.errGeneric);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (type === "job") {
      if (!title.trim()) { setError(t.errRequired); return; }
      setSubmitting(true);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description: content.trim() || null, category: category || null,
          budget_min: budgetMin ? Number(budgetMin) : null, budget_max: budgetMax ? Number(budgetMax) : null,
          currency: "EGP", slots: 1,
        }),
      });
      setSubmitting(false);
      if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? t.errGeneric); return; }
      onSuccess();
      return;
    }

    if (type === "offer") {
      if (!title.trim()) { setError(t.errRequired); return; }
      setSubmitting(true);
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: "offer", title: title.trim(), content: content.trim() || null,
          category: category || null, price: price ? Number(price) : null,
          media_url: mediaUrl, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      setSubmitting(false);
      if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? t.errGeneric); return; }
      onSuccess();
      return;
    }

    // story
    if (!content.trim() && !mediaUrl) { setError(t.errRequired); return; }
    setSubmitting(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_type: "story", content: content.trim() || null, media_url: mediaUrl }),
    });
    setSubmitting(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? t.errGeneric); return; }
    onSuccess();
  }

  const modalTitle = type === "job" ? t.jobTitle : type === "offer" ? t.offerTitle : t.storyTitle;

  return (
    <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{modalTitle}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          {(type === "job" || type === "offer") && (
            <>
              <div className={styles.field}>
                <label htmlFor="post-title">{t.title}</label>
                <input id="post-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePh} />
              </div>
              <div className={styles.field}>
                <label htmlFor="post-content">{t.description}</label>
                <textarea
                  id="post-content" rows={4} value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder={type === "job" ? t.descriptionPhJob : t.descriptionPhOffer}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="post-category">{t.category}</label>
                <CustomSelect
                  id="post-category"
                  value={category}
                  onChange={setCategory}
                  placeholder="—"
                  options={TALENT_CATEGORIES.map((c) => ({ value: c.key, label: ar ? c.label_ar : c.label_en }))}
                />
              </div>
            </>
          )}

          {type === "job" && (
            <div className={styles.field}>
              <label>{t.budget}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <input type="number" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder={t.budgetMin} />
                <input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder={t.budgetMax} />
              </div>
            </div>
          )}

          {type === "offer" && (
            <>
              <div className={styles.field}>
                <label htmlFor="post-price">{t.price}</label>
                <input id="post-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.pricePh} />
              </div>
              <div className={styles.field}>
                <label htmlFor="post-expires">{t.expiresAt}</label>
                <input id="post-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={{ direction: "ltr" }} />
              </div>
            </>
          )}

          {type === "story" && (
            <>
              <div className={styles.field}>
                <label htmlFor="story-content">{t.storyText}</label>
                <textarea id="story-content" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t.storyTextPh} maxLength={500} />
              </div>
              <div className={styles.field}>
                <label>{t.storyImage}</label>
                {mediaUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <img src={mediaUrl} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover" }} />
                    <button type="button" className={styles.postActionBtn} onClick={() => setMediaUrl(null)}>{t.removeImage}</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.postActionBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {uploading ? t.uploading : t.storyImage}
                  </button>
                )}
                <input
                  ref={fileInputRef} type="file" accept="image/*" hidden
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            </>
          )}

          {error && <div className={styles.formError}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="submit" className={`${styles.button} ${styles.buttonSubmit}`} disabled={submitting || uploading}>
              {submitting ? t.submitting : t.submit}
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
