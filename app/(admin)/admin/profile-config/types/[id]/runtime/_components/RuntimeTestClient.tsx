"use client";

// ─── Runtime test harness ─────────────────────────────────────────────────────
// Controls on the left, the REAL DynamicProfileRenderer on the right.
//
// Nothing here is a preview-only rendering path: the output pane mounts
// DynamicProfileRenderer, which is the component the public route will mount.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import DynamicProfileRenderer from "@/components/profile/dynamic/DynamicProfileRenderer";
import type { DynamicLang } from "@/components/profile/dynamic/registry";
import { anchorIdFor } from "@/components/profile/dynamic/anchors";
import { isInlineCoreKey } from "@/components/profile/dynamic/adapters/core-keys";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import type { PackageItem } from "@/features/talent-profile/types";
import styles from "../../../../../packages/_components/AdminPackages.module.css";

interface Props {
  profileTypeId: string;
  typeSlug:      string;
  handle:        string;
  profile:       PublicProfileDTO | null;
  loadError:     string | null;
}

export default function RuntimeTestClient({
  profileTypeId,
  typeSlug,
  handle,
  profile,
  loadError,
}: Props) {
  const { lang } = useSite();
  const router = useRouter();
  const ar = lang === "ar";

  const [handleInput, setHandleInput] = useState(handle);
  const [renderLang, setRenderLang]   = useState<DynamicLang>(ar ? "ar" : "en");
  const [lastBooking, setLastBooking] = useState<string | null>(null);

  const tx = {
    title:      ar ? "اختبار التشغيل" : "Runtime test",
    back:       ar ? "→ الأقسام" : "← Sections",
    preview:    ar ? "معاينة الإعدادات ←" : "Config preview →",
    controls:   ar ? "أدوات الاختبار" : "Test controls",
    handle:     ar ? "معرّف الملف (handle)" : "Profile handle",
    load:       ar ? "تحميل" : "Load",
    language:   ar ? "لغة العرض" : "Render language",
    arabic:     "العربية",
    english:    "English",
    output:     ar ? "الناتج الحقيقي" : "Live rendered output",
    empty:      ar ? "أدخل معرّف ملف لتحميله." : "Enter a profile handle to load.",
    devOnly:    ar
      ? "هذه الصفحة للتطوير فقط ولا تعمل في الإنتاج."
      : "Development-only route — returns 404 in production.",
    realData:   ar
      ? "بيانات حقيقية عبر ProfileService — نفس المسار المخطط للإنتاج."
      : "Real data via ProfileService — the same path planned for production.",
    sections:   ar ? "الأقسام" : "Sections",
    anchors:    ar ? "المراسي" : "Anchors",
    inline:     ar ? "مضمّن" : "inline",
    core:       ar ? "أساسي" : "core",
    dynamicK:   ar ? "ديناميكي" : "dynamic",
    booking:    ar ? "إجراء الحجز" : "Booking action",
    noBooking:  ar ? "لم يُستدعَ بعد." : "Not triggered yet.",
    notFound:   ar ? "تعذّر تحميل الملف" : "Could not load profile",
  };

  function load() {
    const next = handleInput.trim();
    router.push(
      `/admin/profile-config/types/${profileTypeId}/runtime${next ? `?handle=${encodeURIComponent(next)}` : ""}`,
    );
  }

  const booking = {
    onBook: (pkg: PackageItem | null) =>
      setLastBooking(pkg ? `book: ${pkg.name} (${pkg.price})` : "book: no package"),
    onMessage: () => setLastBooking("message"),
  };

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={ar ? "rtl" : "ltr"}>
        {/* ── Controls ─────────────────────────────────────────────────── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.controls}</h2>
              <p className={styles.muted}>{typeSlug}</p>
            </div>
            <div className={styles.actions}>
              <Link
                className={styles.secondaryButton}
                href={`/admin/profile-config/types/${profileTypeId}`}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                {tx.back}
              </Link>
              <Link
                className={styles.secondaryButton}
                href={`/admin/profile-config/types/${profileTypeId}/preview`}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                {tx.preview}
              </Link>
            </div>
          </div>

          <div className={styles.form}>
            <div className={`${styles.status} ${styles.error}`} role="status">{tx.devOnly}</div>
            <p className={styles.muted}>{tx.realData}</p>

            <div className={styles.field}>
              <label>{tx.handle}</label>
              <input
                placeholder="sara"
                value={handleInput}
                onChange={(event) => setHandleInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") load(); }}
              />
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryButton} type="button" onClick={load}>
                {tx.load}
              </button>
            </div>

            <div className={styles.field}>
              <label>{tx.language}</label>
              <div className={styles.actions}>
                <button
                  className={renderLang === "ar" ? styles.primaryButton : styles.secondaryButton}
                  type="button"
                  onClick={() => setRenderLang("ar")}
                >
                  {tx.arabic}
                </button>
                <button
                  className={renderLang === "en" ? styles.primaryButton : styles.secondaryButton}
                  type="button"
                  onClick={() => setRenderLang("en")}
                >
                  {tx.english}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label>{tx.booking}</label>
              <p className={styles.muted}>{lastBooking ?? tx.noBooking}</p>
            </div>

            {loadError ? (
              <div className={`${styles.status} ${styles.error}`} role="status">
                {tx.notFound}: {loadError}
              </div>
            ) : null}

            {/* Anchor + section inventory — verifies the TabsNavigation contract. */}
            {profile ? (
              <div className={styles.field}>
                <label>{tx.sections} / {tx.anchors}</label>
                <div className={styles.rowList}>
                  {profile.sections.map((section) => {
                    const inline = section.kind === "core" && isInlineCoreKey(typeSlug, section.key);
                    return (
                      <div className={styles.draftRow} key={section.key} style={{ gridTemplateColumns: "1fr auto auto" }}>
                        <span style={{ fontSize: "var(--text-sm)" }}>{section.key}</span>
                        <span className={styles.pill}>
                          {section.kind === "core" ? tx.core : tx.dynamicK}
                          {inline ? ` · ${tx.inline}` : ""}
                        </span>
                        <code style={{ fontSize: "var(--text-xs)" }}>#{anchorIdFor(section.key)}</code>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* ── Live output ──────────────────────────────────────────────── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.output}</h3>
              <p className={styles.muted}>
                {profile ? `${profile.identity.handle} · ${renderLang}` : "—"}
              </p>
            </div>
          </div>

          <div
            dir={renderLang === "ar" ? "rtl" : "ltr"}
            style={{ padding: "1rem" }}
          >
            {profile ? (
              <DynamicProfileRenderer booking={booking} lang={renderLang} profile={profile} />
            ) : (
              <p className={styles.muted}>{tx.empty}</p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
