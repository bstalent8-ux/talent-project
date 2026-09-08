"use client";
import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import HealthGauge from "./HealthGauge";
import { ratingLabel, type RatingBand } from "@/features/health-check/score";
import type { HealthCheckResult } from "@/features/health-check/types";
import type { HealthCheckHistoryPoint } from "@/features/health-check/service";

const TX = {
  ar: {
    run: "شغّل الفحص الآن", running: "جاري الفحص...",
    lastRun: "آخر فحص", never: "لسه ماتفحصش",
    overall: "التقييم العام",
    cloudinary: "ميديا (Cloudinary)", security: "الأمان", performance: "الأداء", traffic: "الزيارات (آخر 7 أيام)",
    notConfigured: "مش متصل — محتاج CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET",
    storage: "المساحة المستخدمة", bandwidth: "الباندويدث", resources: "عدد الملفات", credits: "نسبة استهلاك الباقة",
    error: "خطأ",
    checksPass: "فحص ناجح",
    avgResponse: "متوسط زمن الاستجابة", slowest: "أبطأ طلب",
    pageViews: "زيارات صفحات", signups: "تسجيلات", clicks: "دوسات", profileViews: "زيارات بروفايل",
    aiTitle: "نصايح AI", aiNotConfigured: "مش شغالة — محتاج ANTHROPIC_API_KEY",
    aiError: "معرفناش نجيب النصايح",
    history: "آخر الفحوصات",
    disclaimer: "ده فحص ذاتي سريع للتهيئة والأداء — مش بديل عن اختبار اختراق (pentest) حقيقي.",
    bandExcellent: "ممتاز", bandGood: "جيد", bandMedium: "متوسط", bandLow: "ضعيف",
  },
  en: {
    run: "Run Checkup Now", running: "Running...",
    lastRun: "Last run", never: "Never run yet",
    overall: "Overall score",
    cloudinary: "Media (Cloudinary)", security: "Security", performance: "Performance", traffic: "Traffic (last 7 days)",
    notConfigured: "Not connected — needs CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
    storage: "Storage used", bandwidth: "Bandwidth", resources: "Files", credits: "Plan credit used",
    error: "Error",
    checksPass: "checks passed",
    avgResponse: "Avg. response time", slowest: "Slowest request",
    pageViews: "Page views", signups: "Signups", clicks: "Clicks", profileViews: "Profile views",
    aiTitle: "AI Recommendations", aiNotConfigured: "Not enabled — needs ANTHROPIC_API_KEY",
    aiError: "Couldn't fetch recommendations",
    history: "Recent checkups",
    disclaimer: "This is a fast self-audit of configuration and performance — not a substitute for a real penetration test.",
    bandExcellent: "Excellent", bandGood: "Good", bandMedium: "Medium", bandLow: "Low",
  },
};

const BAND_COLOR: Record<RatingBand, string> = {
  excellent: "#00D26A",
  good: "#60A5FA",
  medium: "#F4B740",
  low: "#EF4444",
};

function RatingBadge({ score, lang }: { score: number; lang: "ar" | "en" }) {
  const t = TX[lang];
  const { outOf10, band } = ratingLabel(score);
  const bandLabel = { excellent: t.bandExcellent, good: t.bandGood, medium: t.bandMedium, low: t.bandLow }[band];
  const color = BAND_COLOR[band];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20,
      fontSize: 11.5, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 15%, transparent)`,
      fontVariantNumeric: "tabular-nums",
    }}>
      {outOf10}/10 · {bandLabel}
    </span>
  );
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default function HealthCheckView({
  initialResult, initialHistory,
}: {
  initialResult: HealthCheckResult | null;
  initialHistory: HealthCheckHistoryPoint[];
}) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const [result, setResult] = useState(initialResult);
  const [history, setHistory] = useState(initialHistory);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TRACK = dark ? "#1e293b" : "#E2E8F0";

  async function handleRun() {
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch("/api/admin/health-check/run", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRunError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      const data: HealthCheckResult = await res.json();
      setResult(data);
      if (data.id && data.createdAt) {
        setHistory((prev) => [{ id: data.id as string, createdAt: data.createdAt as string, score: data.score }, ...prev].slice(0, 10));
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "network error");
    } finally {
      setRunning(false);
    }
  }

  const sectionStyle: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none",
            background: running ? MUTED : "var(--color-primary)", color: "#06210f", fontWeight: 700, fontSize: 14,
            cursor: running ? "default" : "pointer",
          }}
        >
          <RefreshCw size={16} style={{ animation: running ? "hc-spin 1s linear infinite" : "none" }} />
          {running ? t.running : t.run}
        </button>
        <span style={{ fontSize: 13, color: MUTED }}>
          {t.lastRun}: {result?.createdAt ? new Date(result.createdAt).toLocaleString(ar ? "ar-EG" : "en-GB") : t.never}
        </span>
      </div>

      {runError && (
        <div style={{ ...sectionStyle, borderColor: "#EF4444" }}>
          <p style={{ margin: 0, color: "#EF4444", fontSize: 13 }}>{t.error}: {runError}</p>
        </div>
      )}

      {!result ? null : (
        <>
          <div style={{ ...sectionStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: MUTED, fontWeight: 600 }}>{t.overall}</p>
            <HealthGauge score={result.score} trackColor={TRACK} />
            <p style={{ margin: "-8px 0 0", fontSize: 32, fontWeight: 800, color: TEXT }}>{result.score}</p>
            <p style={{ margin: 0, fontSize: 11.5, color: MUTED, textAlign: "center", maxWidth: 420 }}>{t.disclaimer}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {/* Cloudinary */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{t.cloudinary}</p>
                {result.categoryScores.cloudinary !== null && <RatingBadge score={result.categoryScores.cloudinary} lang={lang} />}
              </div>
              {!result.cloudinary.configured ? (
                <p style={{ margin: 0, fontSize: 12.5, color: MUTED }}>{t.notConfigured}</p>
              ) : !result.cloudinary.ok ? (
                <p style={{ margin: 0, fontSize: 12.5, color: "#EF4444" }}>{t.error}: {result.cloudinary.error}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: TEXT }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.storage}</span><span>{formatBytes(result.cloudinary.storageBytes)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.bandwidth}</span><span>{formatBytes(result.cloudinary.bandwidthBytes)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.resources}</span><span>{result.cloudinary.resourceCount ?? "—"}</span></div>
                  {result.cloudinary.creditsUsedPercent !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.credits}</span><span>{result.cloudinary.creditsUsedPercent}%</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Security */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>
                  {t.security} · {result.security.passedCount}/{result.security.totalCount} {t.checksPass}
                </p>
                <RatingBadge score={result.categoryScores.security} lang={lang} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.security.items.map((item) => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: TEXT }}>
                    {item.passed ? <CheckCircle2 size={15} color="#00D26A" /> : <XCircle size={15} color="#EF4444" />}
                    <span>{ar ? item.labelAr : item.labelEn}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT }}>{t.performance}</p>
                {result.categoryScores.performance !== null && <RatingBadge score={result.categoryScores.performance} lang={lang} />}
              </div>
              {result.performance.avgMs === null ? (
                <p style={{ margin: 0, fontSize: 12.5, color: "#EF4444" }}>{t.error}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: TEXT }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.avgResponse}</span><span>{result.performance.avgMs} ms</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.slowest}</span><span>{result.performance.slowest?.label} · {result.performance.slowest?.ms} ms</span></div>
                </div>
              )}
            </div>

            {/* Traffic */}
            <div style={sectionStyle}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.traffic}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: TEXT }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.pageViews}</span><span>{result.traffic.pageViews}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.signups}</span><span>{result.traffic.signups}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.clicks}</span><span>{result.traffic.clicks}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: MUTED }}>{t.profileViews}</span><span>{result.traffic.talentProfileViews}</span></div>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.aiTitle}</p>
            {!result.ai.configured ? (
              <p style={{ margin: 0, fontSize: 12.5, color: MUTED }}>{t.aiNotConfigured}</p>
            ) : !result.ai.ok ? (
              <p style={{ margin: 0, fontSize: 12.5, color: "#EF4444" }}>{t.aiError}{result.ai.error ? `: ${result.ai.error}` : ""}</p>
            ) : (
              <ol style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {(result.ai.tips ?? []).map((tip, i) => (
                  <li key={i} style={{ fontSize: 13, color: TEXT }}>{tip}</li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {history.length > 0 && (
        <div style={sectionStyle}>
          <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: TEXT }}>{t.history}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {history.map((h) => (
              <div key={h.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 8, background: dark ? "#0a121c" : "#f8fafc", minWidth: 90 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: h.score >= 80 ? "#00D26A" : h.score >= 50 ? "#F4B740" : "#EF4444" }}>{h.score}</span>
                <span style={{ fontSize: 10.5, color: MUTED }}>{new Date(h.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-GB")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes hc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
