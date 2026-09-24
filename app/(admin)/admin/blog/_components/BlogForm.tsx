"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import CustomSelect from "@/components/ui/CustomSelect";
import { ADMIN_LIGHT } from "@/components/admin/adminLightTheme";
import { slugify } from "@/lib/handle";
import { BLOG_CATEGORIES, type BlogPostRow, type BlogCategory, type BlogLang } from "@/features/blog/types";
import { ImagePlus, Loader2 } from "lucide-react";

const TX = {
  ar: {
    newTitle: "مقال جديد", editTitle: "تعديل مقال",
    titleLabel: "العنوان", slugLabel: "الرابط (Slug)", slugHint: "الرابط النهائي: /blog/",
    langLabel: "اللغة", categoryLabel: "التصنيف",
    excerptLabel: "ملخص قصير", excerptHint: "بيظهر في كارت المقال وفي نتائج البحث — لازم يكون طبيعي ويوصف المقال، مش تكرار كلمات.",
    coverLabel: "صورة الغلاف", coverUpload: "ارفع صورة", uploading: "بيترفع...",
    contentLabel: "المحتوى", contentHint: "افصل بين الفقرات بسطر فاضي.",
    tagsLabel: "الكلمات المرتبطة (اختياري)", tagsHint: "مفصولة بفاصلة — بتظهر كـ tags تحت المقال، مش بتتكرر جوه النص.",
    seoTitleLabel: "عنوان SEO (اختياري)", seoTitleHint: "لو فاضي، هيستخدم العنوان العادي.",
    seoDescLabel: "وصف SEO (اختياري)", seoDescHint: "لو فاضي، هيستخدم الملخص القصير.",
    statusLabel: "الحالة", draft: "مسودة", published: "منشور",
    save: "حفظ", saving: "جاري الحفظ...", cancel: "إلغاء",
    required: "العنوان مطلوب",
    seoNote: "ملاحظة SEO: أفضل ترتيب في جوجل بييجي من محتوى حقيقي ومفيد بيستخدم الكلمات دي بشكل طبيعي (talent, brand, UGC, model, influencer...) — مش من تكرارها. كرر الكلمة أكتر من اللازم وجوجل بيعتبره spam ويقلل ترتيبك بدل ما يحسّنه.",
  },
  en: {
    newTitle: "New Article", editTitle: "Edit Article",
    titleLabel: "Title", slugLabel: "Slug", slugHint: "Final URL: /blog/",
    langLabel: "Language", categoryLabel: "Category",
    excerptLabel: "Short excerpt", excerptHint: "Shown on the article card and in search results — write it naturally, don't repeat keywords.",
    coverLabel: "Cover image", coverUpload: "Upload image", uploading: "Uploading...",
    contentLabel: "Content", contentHint: "Separate paragraphs with a blank line.",
    tagsLabel: "Related tags (optional)", tagsHint: "Comma-separated — shown as tags under the article, not repeated in the text.",
    seoTitleLabel: "SEO title (optional)", seoTitleHint: "Falls back to the title above if left empty.",
    seoDescLabel: "SEO description (optional)", seoDescHint: "Falls back to the excerpt above if left empty.",
    statusLabel: "Status", draft: "Draft", published: "Published",
    save: "Save", saving: "Saving...", cancel: "Cancel",
    required: "Title is required",
    seoNote: "SEO note: real Google ranking comes from genuinely useful content that uses these words naturally (talent, brand, UGC, model, influencer...) — not from repeating them. Over-repeating a keyword reads as spam to Google and hurts ranking instead of helping it.",
  },
};

const CATEGORY_LABEL: Record<BlogCategory, { ar: string; en: string }> = {
  UGC: { ar: "UGC", en: "UGC" },
  Talent: { ar: "المواهب", en: "Talent" },
  Branding: { ar: "البراندات", en: "Branding" },
  Marketing: { ar: "تسويق", en: "Marketing" },
  Tips: { ar: "نصائح", en: "Tips" },
  News: { ar: "أخبار", en: "News" },
};

export default function BlogForm({ initialPost }: { initialPost?: BlogPostRow }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";
  const isEdit = !!initialPost;

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [postLang, setPostLang] = useState<BlogLang>(initialPost?.lang ?? "ar");
  const [category, setCategory] = useState<BlogCategory>(initialPost?.category ?? "Tips");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialPost?.coverImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState(initialPost?.tags.join(", ") ?? "");
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription ?? "");
  const [status, setStatus] = useState<"draft" | "published">(initialPost?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CARD = dark ? "#2B211D" : ADMIN_LIGHT.card;
  const BORDER = dark ? "#3A2E28" : ADMIN_LIGHT.border;
  const TEXT = dark ? "#F5EEDB" : ADMIN_LIGHT.text;
  const MUTED = dark ? "#A99B8E" : ADMIN_LIGHT.muted;
  const INPUT_BG = dark ? "#261C18" : ADMIN_LIGHT.inputBg;
  const PRIMARY = dark ? "var(--color-primary)" : ADMIN_LIGHT.primary;

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10,
    border: `1px solid ${BORDER}`, backgroundColor: INPUT_BG, color: TEXT, fontSize: 14, outline: "none",
  };
  const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: TEXT };
  const hintStyle: React.CSSProperties = { margin: "6px 0 0", fontSize: 11.5, color: MUTED, lineHeight: 1.6 };
  const fieldWrap: React.CSSProperties = { marginBottom: 20 };

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/blog/upload-cover", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) setCoverImageUrl(data.url);
      else setError(data.error ?? "upload failed");
    } catch {
      setError("upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) { setError(t.required); return; }
    setSaving(true);
    setError(null);
    const body = {
      title, slug, lang: postLang, category, excerpt, content, coverImageUrl,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      seoTitle: seoTitle || null, seoDescription: seoDescription || null,
      status,
    };
    try {
      const res = await fetch(isEdit ? `/api/admin/blog/${initialPost!.id}` : "/api/admin/blog", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? `HTTP ${res.status}`); return; }
      router.push("/admin/blog");
      router.refresh();
    } catch {
      setError("network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title={isEdit ? t.editTitle : t.newTitle}>
      <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>{t.titleLabel}</label>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>{t.categoryLabel}</label>
            <CustomSelect
              value={category}
              onChange={(v) => setCategory(v as BlogCategory)}
              colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
              options={BLOG_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c][lang] }))}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>{t.slugLabel}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: MUTED, fontSize: 12.5, whiteSpace: "nowrap", direction: "ltr" }}>{t.slugHint}</span>
              <input
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
              />
            </div>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>{t.langLabel}</label>
            <CustomSelect
              value={postLang}
              onChange={(v) => setPostLang(v as BlogLang)}
              colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
              options={[{ value: "ar", label: "العربية" }, { value: "en", label: "English" }]}
            />
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.excerptLabel}</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          <p style={hintStyle}>{t.excerptHint}</p>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.coverLabel}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 140, height: 90, borderRadius: 10, overflow: "hidden", flexShrink: 0,
              backgroundColor: INPUT_BG, border: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImagePlus size={22} color={MUTED} />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, cursor: "pointer",
              }}
            >
              {uploading ? <Loader2 size={14} className="admin-spin" /> : <ImagePlus size={14} />}
              {uploading ? t.uploading : t.coverUpload}
            </button>
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.contentLabel}</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8, fontFamily: "inherit" }} />
          <p style={hintStyle}>{t.contentHint}</p>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.tagsLabel}</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} placeholder="UGC, talent, brand deal" />
          <p style={hintStyle}>{t.tagsHint}</p>
        </div>

        <div style={{ ...fieldWrap, padding: 14, borderRadius: 10, backgroundColor: dark ? "rgba(231,165,138,0.08)" : "rgba(231,165,138,0.1)", border: "1px solid rgba(231,165,138,0.3)" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: dark ? "#E7A58A" : "#9A4E34", lineHeight: 1.7 }}>{t.seoNote}</p>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.seoTitleLabel}</label>
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} style={inputStyle} placeholder={title} />
          <p style={hintStyle}>{t.seoTitleHint} ({seoTitle.length}/70)</p>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.seoDescLabel}</label>
          <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} maxLength={200} style={{ ...inputStyle, resize: "vertical" }} placeholder={excerpt} />
          <p style={hintStyle}>{t.seoDescHint} ({seoDescription.length}/200)</p>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{t.statusLabel}</label>
          <CustomSelect
            value={status}
            onChange={(v) => setStatus(v as "draft" | "published")}
            style={{ maxWidth: 200 }}
            colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#087F83", hover: dark ? "#322722" : "#F1E8D2" }}
            options={[{ value: "draft", label: t.draft }, { value: "published", label: t.published }]}
          />
        </div>

        {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              backgroundColor: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? t.saving : t.save}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 14, cursor: "pointer" }}
          >
            {t.cancel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes admin-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .admin-spin { animation: admin-spin 1s linear infinite; }
      `}</style>
    </AdminShell>
  );
}
