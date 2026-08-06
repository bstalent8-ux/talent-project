"use client";

// ─── Configuration preview ────────────────────────────────────────────────────
// Controls on the left, rendered output on the right.
//
// The output pane renders through components/profile/dynamic — the SAME
// registry and slot walker the public profile renderer will use. There is no
// preview-only rendering path.
//
// The preview language is independent of the admin's own UI language, which is
// why the renderer takes `lang` as a prop instead of reading useSite().

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import { DynamicProfileSections } from "@/components/profile/dynamic/DynamicSectionRenderer";
import type { DynamicLang } from "@/components/profile/dynamic/registry";
import { LAYOUT_VARIANTS, type LayoutVariant } from "@/features/profiles/validation/config-schemas";
import type { PreviewDiagnostic } from "@/features/profiles/services/preview.service";
import type { ProfileLayoutDTO, ProfileSectionDTO } from "@/features/profiles/types/dto";
import styles from "../../../../../packages/_components/AdminPackages.module.css";

interface TypeOption {
  id:      string;
  slug:    string;
  name:    string;
  name_ar: string | null;
  name_en: string | null;
}

interface Props {
  profileTypeId: string;
  types:         TypeOption[];
  variant:       LayoutVariant;
  sections:      ProfileSectionDTO[];
  layout:        ProfileLayoutDTO | null;
  diagnostics:   PreviewDiagnostic[];
}

export default function PreviewClient({
  profileTypeId,
  types,
  variant,
  sections,
  layout,
  diagnostics,
}: Props) {
  const { lang } = useSite();
  const router = useRouter();
  const ar = lang === "ar";

  // Preview language, independent of the admin UI language.
  const [previewLang, setPreviewLang] = useState<DynamicLang>(ar ? "ar" : "en");

  const currentType = types.find((type) => type.id === profileTypeId);

  const tx = {
    title:       ar ? "معاينة الإعدادات" : "Configuration preview",
    back:        ar ? "→ الأقسام" : "← Sections",
    controls:    ar ? "أدوات المعاينة" : "Preview controls",
    profileType: ar ? "نوع الملف" : "Profile type",
    variant:     ar ? "نسخة التخطيط" : "Layout variant",
    language:    ar ? "لغة المعاينة" : "Preview language",
    arabic:      "العربية",
    english:     "English",
    output:      ar ? "الناتج" : "Rendered output",
    diagnostics: ar ? "الفحوصات" : "Diagnostics",
    allClear:    ar ? "لا توجد مشاكل." : "No issues found.",
    errors:      ar ? "أخطاء" : "errors",
    warnings:    ar ? "تحذيرات" : "warnings",
    slots:       ar ? "الفتحات" : "Slots",
    main:        ar ? "رئيسي" : "main",
    sidebar:     ar ? "جانبي" : "sidebar",
    noLayout:    ar ? "بدون تخطيط — ترتيب display_order" : "No layout — display_order ordering",
    empty:       ar ? "لا توجد أقسام مفعّلة لعرضها." : "No enabled sections to render.",
    mockNote:    ar
      ? "القيم المعروضة وهمية ومولّدة حسب نوع كل حقل. لا تُقرأ أي بيانات مستخدم حقيقية."
      : "Values shown are mock data generated per field type. No real user data is read.",
    coreNote:    ar
      ? "الأقسام الأساسية تظهر كعناصر نائبة — يعرضها مزوّد الملف لاحقاً."
      : "Core sections appear as placeholders — the profile provider renders them.",
  };

  const errors   = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");

  function switchType(nextId: string) {
    router.push(`/admin/profile-config/types/${nextId}/preview?variant=${variant}`);
  }

  function switchVariant(next: string) {
    router.push(`/admin/profile-config/types/${profileTypeId}/preview?variant=${next}`);
  }

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={ar ? "rtl" : "ltr"}>
        {/* ── Controls + diagnostics ───────────────────────────────────── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.controls}</h2>
              <p className={styles.muted}>{currentType?.slug ?? "—"}</p>
            </div>
            <Link
              className={styles.secondaryButton}
              href={`/admin/profile-config/types/${profileTypeId}`}
              style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            >
              {tx.back}
            </Link>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label>{tx.profileType}</label>
              <select value={profileTypeId} onChange={(event) => switchType(event.target.value)}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {(ar ? type.name_ar : type.name_en) ?? type.name} ({type.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>{tx.variant}</label>
              <select value={variant} onChange={(event) => switchVariant(event.target.value)}>
                {LAYOUT_VARIANTS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>{tx.language}</label>
              <div className={styles.actions}>
                <button
                  className={previewLang === "ar" ? styles.primaryButton : styles.secondaryButton}
                  type="button"
                  onClick={() => setPreviewLang("ar")}
                >
                  {tx.arabic}
                </button>
                <button
                  className={previewLang === "en" ? styles.primaryButton : styles.secondaryButton}
                  type="button"
                  onClick={() => setPreviewLang("en")}
                >
                  {tx.english}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label>{tx.slots}</label>
              <p className={styles.muted}>
                {layout
                  ? `${tx.main}: ${layout.main.length} · ${tx.sidebar}: ${layout.sidebar.length}`
                  : tx.noLayout}
              </p>
            </div>

            {/* Diagnostics */}
            <div className={styles.field}>
              <label>
                {tx.diagnostics}
                {diagnostics.length > 0
                  ? ` — ${errors.length} ${tx.errors}, ${warnings.length} ${tx.warnings}`
                  : ""}
              </label>

              {diagnostics.length === 0 ? (
                <div className={`${styles.status} ${styles.success}`} role="status">
                  {tx.allClear}
                </div>
              ) : (
                <div className={styles.rowList}>
                  {[...errors, ...warnings].map((item, index) => (
                    <div
                      className={`${styles.status} ${item.severity === "error" ? styles.error : ""}`}
                      key={`${item.code}-${index}`}
                      role="status"
                    >
                      <strong style={{ display: "block", fontSize: "var(--text-xs)" }}>
                        {item.code}
                      </strong>
                      {item.message[ar ? "ar" : "en"]}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className={styles.muted}>{tx.mockNote}</p>
            <p className={styles.muted}>{tx.coreNote}</p>
          </div>
        </aside>

        {/* ── Rendered output ──────────────────────────────────────────── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.output}</h3>
              <p className={styles.muted}>
                {variant} · {previewLang} · {sections.length}
              </p>
            </div>
          </div>

          {/* dir flips with the PREVIEW language, not the admin UI language —
              this is what makes the RTL check meaningful. */}
          <div
            dir={previewLang === "ar" ? "rtl" : "ltr"}
            style={{ padding: "1rem", background: "var(--bg-base, transparent)" }}
          >
            {sections.length === 0 ? (
              <p className={styles.muted}>{tx.empty}</p>
            ) : (
              <DynamicProfileSections lang={previewLang} layout={layout} sections={sections} />
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
