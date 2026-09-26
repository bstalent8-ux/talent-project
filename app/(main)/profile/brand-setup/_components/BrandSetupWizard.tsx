"use client";

// ─── BrandSetupWizard ─────────────────────────────────────────────────────────
// Five steps that fill the public brand page (/brand/[id]):
//   1. Identity — logo (/api/profile/avatar, square crop) + cover (/api/profile/brand-cover)
//   2. Basics   — name, tagline, category, industry, city
//   3. About    — bio, company size, founded year, tags
//   4. Links    — website + social handles
//   5. Done     — what's filled, where to go next
// Each "Save & continue" PATCHes only that step's fields to
// /api/profile/brand-setup, so leaving halfway keeps what was saved.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera, ImagePlus, Trash2, Check, ChevronLeft, ChevronRight, Loader2, X,
  BadgeCheck, MapPin, Globe, ExternalLink, ShieldCheck, LayoutDashboard,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import s from "./brandSetup.module.css";

export interface BrandSetupInitial {
  userId: string; handle: string | null; name: string; avatarUrl: string | null;
  city: string; bio: string; categoryId: string; industry: string; website: string;
  social: Record<"instagram" | "tiktok" | "youtube" | "facebook" | "linkedin" | "x", string>;
  coverUrl: string | null; tagline: string; companySize: string; foundedYear: string; tags: string[];
  extrasReady: boolean;
}

type Category = { id: string; ar: string; en: string };

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
const SOCIALS = [
  { key: "instagram", label: "Instagram", ph: "@yourbrand" },
  { key: "tiktok",    label: "TikTok",    ph: "@yourbrand" },
  { key: "youtube",   label: "YouTube",   ph: "@yourbrand" },
  { key: "facebook",  label: "Facebook",  ph: "facebook.com/yourbrand" },
  { key: "linkedin",  label: "LinkedIn",  ph: "linkedin.com/company/yourbrand" },
  { key: "x",         label: "X",         ph: "@yourbrand" },
] as const;

const TX = {
  ar: {
    title: "جهّز صفحة البراند", stepOf: (n: number, t: number) => `الخطوة ${n} من ${t}`,
    steps: ["الهوية", "الأساسيات", "عن البراند", "الروابط", "تم"],
    s1: { h: "اللوجو والغلاف", sub: "أول حاجة المواهب بتشوفها في صفحتك." },
    s2: { h: "أساسيات البراند", sub: "الاسم ونوع النشاط ومكانك." },
    s3: { h: "احكي عن البراند", sub: "نبذة ومعلومات الشركة بتزوّد ثقة المواهب." },
    s4: { h: "الموقع ومواقع التواصل", sub: "خلي المواهب تعرف تشوف شغلك فين." },
    s5: { h: "صفحتك جاهزة 🎉", sub: "تقدر ترجع تعدّل أي حاجة في أي وقت." },
    logo: "اللوجو", cover: "صورة الغلاف", upload: "رفع صورة", change: "تغيير", remove: "حذف",
    coverHint: "مقاس مقترح 1600×500، حتى 8 ميجا.", uploading: "جاري الرفع…",
    name: "اسم البراند", tagline: "وصف قصير", taglinePh: "مثال: براند عناية بالبشرة",
    category: "التصنيف", choose: "اختر…", industry: "المجال", industryPh: "مثال: Beauty & Personal Care",
    city: "المدينة", cityPh: "مثال: القاهرة",
    bio: "النبذة", bioPh: "مين إنتوا، بتعملوا إيه، ومين جمهوركم؟", size: "حجم الشركة", employees: "موظف",
    founded: "سنة التأسيس", tags: "تاجز", tagsPh: "اكتب واضغط Enter", tagsHint: "حتى 8 تاجز، زي Skincare أو UGC.",
    website: "الموقع الإلكتروني",
    back: "رجوع", next: "حفظ ومتابعة", skip: "تخطي", finish: "حفظ وإنهاء",
    viewPage: "شوف صفحتك", dashboard: "لوحة التحكم", verify: "وثّق نشاطك التجاري",
    filled: "المكتمل", required: "الاسم مطلوب",
    errSave: "حصلت مشكلة في الحفظ. حاول تاني.", errUpload: "فشل رفع الصورة.",
    migration: "حقول الغلاف والوصف والحجم والتأسيس والتاجز لسه مش متفعلة على السيرفر — الباقي اتحفظ.",
    migrationInit: "الغلاف والوصف القصير وحجم الشركة وسنة التأسيس والتاجز محتاجين تحديث في قاعدة البيانات قبل ما يتحفظوا. باقي الحقول شغالة.",
    checks: ["اللوجو", "الغلاف", "الاسم والتصنيف", "النبذة", "معلومات الشركة", "الروابط"],
    preview: "معاينة",
  },
  en: {
    title: "Set up your brand page", stepOf: (n: number, t: number) => `Step ${n} of ${t}`,
    steps: ["Identity", "Basics", "About", "Links", "Done"],
    s1: { h: "Logo & cover", sub: "The first thing talents see on your page." },
    s2: { h: "Brand basics", sub: "Your name, what you do, and where you are." },
    s3: { h: "Tell your story", sub: "An intro and company facts build trust with talents." },
    s4: { h: "Website & socials", sub: "Let talents see your work." },
    s5: { h: "Your page is ready 🎉", sub: "You can come back and edit anything, any time." },
    logo: "Logo", cover: "Cover photo", upload: "Upload image", change: "Change", remove: "Remove",
    coverHint: "Suggested 1600×500, up to 8 MB.", uploading: "Uploading…",
    name: "Brand name", tagline: "Short description", taglinePh: "e.g. Beauty & Personal Care Brand",
    category: "Category", choose: "Choose…", industry: "Industry", industryPh: "e.g. Beauty & Personal Care",
    city: "City", cityPh: "e.g. Cairo, Egypt",
    bio: "About", bioPh: "Who you are, what you make, and who you make it for.", size: "Company size", employees: "employees",
    founded: "Founded", tags: "Tags", tagsPh: "Type and press Enter", tagsHint: "Up to 8 tags, like Skincare or UGC.",
    website: "Website",
    back: "Back", next: "Save & continue", skip: "Skip", finish: "Save & finish",
    viewPage: "View your page", dashboard: "Dashboard", verify: "Verify your business",
    filled: "Completed", required: "Brand name is required",
    errSave: "Couldn't save. Please try again.", errUpload: "Image upload failed.",
    migration: "Cover, tagline, size, founding year and tags aren't enabled on the server yet — everything else was saved.",
    migrationInit: "Cover, tagline, company size, founding year and tags need a database update before they can be saved. Everything else works.",
    checks: ["Logo", "Cover", "Name & category", "About", "Company facts", "Links"],
    preview: "Preview",
  },
};

export default function BrandSetupWizard({ initial, categories }: { initial: BrandSetupInitial; categories: Category[] }) {
  const { lang } = useSite();
  const ar = lang === "ar";
  const t = TX[ar ? "ar" : "en"];
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initial.extrasReady ? null : t.migrationInit);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof BrandSetupInitial>(k: K, v: BrandSetupInitial[K]) => setF((p) => ({ ...p, [k]: v }));
  const Back = ar ? ChevronRight : ChevronLeft;
  const Fwd = ar ? ChevronLeft : ChevronRight;
  const total = t.steps.length;
  const categoryLabel = categories.find((c) => c.id === f.categoryId)?.[ar ? "ar" : "en"] ?? "";

  const checks = useMemo(() => [
    !!f.avatarUrl, !!f.coverUrl, !!f.name.trim() && !!f.categoryId, f.bio.trim().length >= 40,
    !!f.companySize && !!f.foundedYear, !!f.website.trim() || Object.values(f.social).some((v) => v.trim()),
  ], [f]);
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  // ─── uploads ────────────────────────────────────────────────────────────
  async function uploadLogo(file: File) {
    setCropFile(null);
    setUploading("logo"); setError(null);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok && data?.avatar_url) set("avatarUrl", data.avatar_url); else setError(t.errUpload);
    setUploading(null);
  }

  async function uploadCover(file: File) {
    setUploading("cover"); setError(null);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/profile/brand-cover", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok && data?.url) set("coverUrl", data.url);
    else if (res?.status === 409) setNotice(t.migration);
    else setError(t.errUpload);
    setUploading(null);
  }

  async function removeCover() {
    const res = await fetch("/api/profile/brand-cover", { method: "DELETE" }).catch(() => null);
    if (res?.ok) set("coverUrl", null);
  }

  // ─── save per step ──────────────────────────────────────────────────────
  function payloadFor(i: number): Record<string, unknown> | null {
    // Fields backed by the 20260926 columns are only sent once that migration
    // is applied, so an unrelated save never trips a 409.
    const extras = f.extrasReady;
    if (i === 1) return { full_name: f.name.trim(), category_id: f.categoryId || null, industry: f.industry, city: f.city, ...(extras && { tagline: f.tagline }) };
    if (i === 2) return {
      bio: f.bio,
      ...(extras && { company_size: f.companySize || null, founded_year: f.foundedYear ? Number(f.foundedYear) : null, tags: f.tags }),
    };
    if (i === 3) return { website_url: f.website, social: f.social };
    return null;
  }

  async function saveAndGo(delta: 1 | -1, skip = false) {
    setError(null);
    if (delta === 1 && !skip) {
      if (step === 1 && !f.name.trim()) { setError(t.required); return; }
      const body = payloadFor(step);
      if (body) {
        setSaving(true);
        const res = await fetch("/api/profile/brand-setup", {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        }).catch(() => null);
        setSaving(false);
        if (res?.status === 409) setNotice(t.migration);
        else if (!res?.ok) { setError(t.errSave); return; }
      }
    }
    setDir(delta > 0 ? "next" : "prev");
    setStep((i) => Math.min(total - 1, Math.max(0, i + delta)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addTag() {
    const v = tagDraft.trim().replace(/,$/, "");
    if (!v || f.tags.length >= 8 || f.tags.some((x) => x.toLowerCase() === v.toLowerCase())) { setTagDraft(""); return; }
    set("tags", [...f.tags, v.slice(0, 30)]);
    setTagDraft("");
  }

  const pageHref = `/brand/${f.handle ?? f.userId}`;
  const head = [t.s1, t.s2, t.s3, t.s4, t.s5][step];
  const yearNow = new Date().getFullYear();

  return (
    <main className={s.page}>
      <div className={s.shell}>
        {/* progress */}
        <div className={s.top}>
          <p className={s.counter}>{t.stepOf(step + 1, total)}</p>
          <ol className={s.steps}>
            {t.steps.map((label, i) => (
              <li key={label} className={`${s.stepPill} ${i === step ? s.stepNow : ""} ${i < step ? s.stepDone : ""}`}>
                <span className={s.stepDot}>{i < step ? <Check size={12} /> : i + 1}</span>
                <span className={s.stepLabel}>{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <section className={s.card}>
          <div key={step} className={`${s.body} ${dir === "next" ? s.slideNext : s.slidePrev}`}>
            <h1 className={s.h}>{head.h}</h1>
            <p className={s.sub}>{head.sub}</p>

            {notice && <p className={s.notice}>{notice}</p>}

            {/* ── 1. Identity ── */}
            {step === 0 && (
              <div className={s.identity}>
                <div className={s.coverBox}>
                  {f.coverUrl ? <img src={f.coverUrl} alt="" /> : <span className={s.coverName}>{f.name || "Brand"}</span>}
                  <div className={s.coverActions}>
                    <button type="button" className={s.ghostBtn} onClick={() => coverInput.current?.click()} disabled={uploading !== null || !f.extrasReady}>
                      {uploading === "cover" ? <Loader2 size={15} className={s.spin} /> : <ImagePlus size={15} />}
                      {uploading === "cover" ? t.uploading : f.coverUrl ? t.change : t.cover}
                    </button>
                    {f.coverUrl && (
                      <button type="button" className={s.ghostBtn} onClick={removeCover} aria-label={t.remove}><Trash2 size={15} /></button>
                    )}
                  </div>
                  <div className={s.logoBox}>
                    {f.avatarUrl ? <img src={f.avatarUrl} alt="" /> : <span>{(f.name || "B").charAt(0)}</span>}
                    <button type="button" className={s.logoEdit} onClick={() => logoInput.current?.click()} disabled={uploading !== null} aria-label={t.logo}>
                      {uploading === "logo" ? <Loader2 size={15} className={s.spin} /> : <Camera size={15} />}
                    </button>
                  </div>
                </div>
                <p className={s.hint}>{t.coverHint}</p>
                <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) uploadCover(x); e.target.value = ""; }} />
                <input ref={logoInput} type="file" accept="image/*" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) setCropFile(x); e.target.value = ""; }} />
              </div>
            )}

            {/* ── 2. Basics ── */}
            {step === 1 && (
              <div className={s.fields}>
                <label className={s.field}><span>{t.name} *</span>
                  <input className={s.input} value={f.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
                </label>
                <label className={s.field}><span>{t.tagline}</span>
                  <input className={s.input} value={f.tagline} maxLength={120} placeholder={t.taglinePh} onChange={(e) => set("tagline", e.target.value)} disabled={!f.extrasReady} />
                </label>
                <div className={s.row}>
                  <label className={s.field}><span>{t.category}</span>
                    <select className={s.input} value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                      <option value="">{t.choose}</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>)}
                    </select>
                  </label>
                  <label className={s.field}><span>{t.city}</span>
                    <input className={s.input} value={f.city} maxLength={60} placeholder={t.cityPh} onChange={(e) => set("city", e.target.value)} />
                  </label>
                </div>
                <label className={s.field}><span>{t.industry}</span>
                  <input className={s.input} value={f.industry} maxLength={80} placeholder={t.industryPh} onChange={(e) => set("industry", e.target.value)} />
                </label>
              </div>
            )}

            {/* ── 3. About ── */}
            {step === 2 && (
              <div className={s.fields}>
                <label className={s.field}><span>{t.bio} <em className={s.count}>{f.bio.length}/1000</em></span>
                  <textarea className={`${s.input} ${s.textarea}`} value={f.bio} maxLength={1000} placeholder={t.bioPh} onChange={(e) => set("bio", e.target.value)} />
                </label>
                <div className={s.field}><span>{t.size}</span>
                  <div className={s.chips} role="radiogroup" aria-label={t.size}>
                    {SIZES.map((v) => (
                      <button key={v} type="button" role="radio" aria-checked={f.companySize === v} disabled={!f.extrasReady}
                        className={`${s.chip} ${f.companySize === v ? s.chipOn : ""}`} onClick={() => set("companySize", f.companySize === v ? "" : v)}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <label className={s.field}><span>{t.founded}</span>
                  <input className={s.input} type="number" inputMode="numeric" min={1800} max={yearNow} value={f.foundedYear} placeholder={String(yearNow - 3)}
                    onChange={(e) => set("foundedYear", e.target.value.slice(0, 4))} disabled={!f.extrasReady} style={{ maxWidth: 180 }} />
                </label>
                <div className={s.field}><span>{t.tags} <em className={s.count}>{f.tags.length}/8</em></span>
                  <div className={s.tagBox}>
                    {f.tags.map((tag) => (
                      <span key={tag} className={s.tag}>{tag}
                        <button type="button" onClick={() => set("tags", f.tags.filter((x) => x !== tag))} aria-label={`${t.remove} ${tag}`}><X size={12} /></button>
                      </span>
                    ))}
                    <input className={s.tagInput} value={tagDraft} placeholder={f.tags.length < 8 ? t.tagsPh : ""} disabled={!f.extrasReady || f.tags.length >= 8}
                      onChange={(e) => setTagDraft(e.target.value)} onBlur={addTag}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
                  </div>
                  <small className={s.hint}>{t.tagsHint}</small>
                </div>
              </div>
            )}

            {/* ── 4. Links ── */}
            {step === 3 && (
              <div className={s.fields}>
                <label className={s.field}><span>{t.website}</span>
                  <input className={s.input} dir="ltr" value={f.website} maxLength={300} placeholder="www.yourbrand.com" onChange={(e) => set("website", e.target.value)} />
                </label>
                <div className={s.grid2}>
                  {SOCIALS.map((p) => (
                    <label key={p.key} className={s.field}><span>{p.label}</span>
                      <input className={s.input} dir="ltr" value={f.social[p.key]} maxLength={200} placeholder={p.ph}
                        onChange={(e) => set("social", { ...f.social, [p.key]: e.target.value })} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. Done ── */}
            {step === 4 && (
              <div className={s.done}>
                <div className={s.meter}>
                  <div className={s.meterHead}><strong>{t.filled}</strong><span>{percent}%</span></div>
                  <div className={s.meterTrack}><div className={s.meterFill} style={{ transform: `scaleX(${percent / 100})` }} /></div>
                  <ul className={s.checks}>
                    {t.checks.map((label, i) => (
                      <li key={label} className={checks[i] ? s.checkOn : ""}>
                        <span className={s.checkDot}>{checks[i] && <Check size={12} />}</span>{label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={s.doneActions}>
                  <Link href={pageHref} className={`${s.btn} ${s.btnPrimary}`} onClick={() => router.refresh()}><ExternalLink size={16} />{t.viewPage}</Link>
                  <Link href="/dashboard" className={`${s.btn} ${s.btnGhost}`}><LayoutDashboard size={16} />{t.dashboard}</Link>
                  <Link href="/settings" className={`${s.btn} ${s.btnGhost}`}><ShieldCheck size={16} />{t.verify}</Link>
                </div>
              </div>
            )}

            {error && <p className={s.error} role="alert">{error}</p>}
          </div>

          {step < total - 1 && (
            <div className={s.footer}>
              <button type="button" className={`${s.btn} ${s.btnGhost} ${step === 0 ? s.hidden : ""}`} onClick={() => saveAndGo(-1)} disabled={saving}>
                <Back size={16} />{t.back}
              </button>
              <div className={s.footerEnd}>
                {step > 0 && <button type="button" className={s.skip} onClick={() => saveAndGo(1, true)} disabled={saving}>{t.skip}</button>}
                <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => saveAndGo(1)} disabled={saving || uploading !== null}>
                  {saving ? <Loader2 size={16} className={s.spin} /> : null}
                  {step === total - 2 ? t.finish : t.next}
                  {!saving && <Fwd size={16} />}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* live preview of the page header */}
        <aside className={s.preview} aria-label={t.preview}>
          <p className={s.previewLabel}>{t.preview}</p>
          <div className={s.pvCard}>
            <div className={s.pvCover}>{f.coverUrl && <img src={f.coverUrl} alt="" />}</div>
            <div className={s.pvBody}>
              <div className={s.pvLogo}>{f.avatarUrl ? <img src={f.avatarUrl} alt="" /> : (f.name || "B").charAt(0)}</div>
              <p className={s.pvName}>{f.name || "Brand"} <BadgeCheck size={16} className={s.pvTick} /></p>
              {(f.tagline || f.industry || categoryLabel) && <p className={s.pvKind}>{f.tagline || f.industry || categoryLabel}</p>}
              {f.city && <p className={s.pvMeta}><MapPin size={13} />{f.city}</p>}
              {f.website && <p className={s.pvMeta}><Globe size={13} />{f.website.replace(/^https?:\/\//, "")}</p>}
              {f.tags.length > 0 && <div className={s.pvTags}>{f.tags.slice(0, 4).map((x) => <span key={x}>{x}</span>)}</div>}
            </div>
          </div>
        </aside>
      </div>

      {cropFile && <AvatarCropModal file={cropFile} onCancel={() => setCropFile(null)} onCropped={uploadLogo} />}
    </main>
  );
}
