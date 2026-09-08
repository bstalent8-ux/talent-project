// ─── Admin health checkup — service (server only) ───────────────────────────
// Four independent live checks, each degrading honestly when its
// prerequisite isn't set up rather than failing the whole run. Server-only:
// reads process.env and calls out to Cloudinary/Anthropic — never import
// from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";
import { fetchAdminUserActivityStats } from "../admin/services/admin.service";
import { scoreSecurity, scorePerformance, scoreCloudinary, computeOverallScore } from "./score";
import type {
  CloudinaryReport, SecurityCheckItem, SecurityReport, PerformanceProbe, PerformanceReport,
  TrafficSnapshot, AiReport, HealthCheckResult,
} from "./types";

// ─── Cloudinary usage ────────────────────────────────────────────────────────
// One call to Cloudinary's own `/usage` endpoint — storage, bandwidth,
// resource count and (on paid plans) percentage of the plan's credit used.
// Needs CLOUDINARY_API_KEY/SECRET (server-only — distinct from the
// NEXT_PUBLIC_CLOUDINARY_* unsigned-upload vars, which grant no read access).

function cloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

interface CloudinaryUsageResponse {
  plan?: string;
  credits?: { used_percent?: number };
  storage?: { usage?: number };
  bandwidth?: { usage?: number };
  resources?: number;
}

export async function fetchCloudinaryReport(): Promise<CloudinaryReport> {
  const cfg = cloudinaryConfig();
  if (!cfg) return { configured: false, ok: false };

  try {
    const auth = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString("base64");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/usage`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { configured: true, ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as CloudinaryUsageResponse;
    return {
      configured: true,
      ok: true,
      plan: data.plan,
      storageBytes: data.storage?.usage,
      bandwidthBytes: data.bandwidth?.usage,
      resourceCount: data.resources,
      creditsUsedPercent: data.credits?.used_percent,
    };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

// ─── Security checklist ─────────────────────────────────────────────────────
// A small, honest self-audit — NOT a penetration test. Each check is a live
// probe against the site's own origin (derived from the incoming request,
// so this works against whatever host actually served the request — prod,
// preview, or localhost — with no separate "site URL" env var to keep in
// sync). A probe that errors (network failure) counts as failed, not skipped
// — "couldn't verify" is not the same as "passing".

const SECURITY_LABELS: Record<string, { labelAr: string; labelEn: string }> = {
  csp: { labelAr: "ترويسة Content-Security-Policy موجودة", labelEn: "Content-Security-Policy header present" },
  frameAncestors: { labelAr: "حماية من clickjacking (frame-ancestors)", labelEn: "Clickjacking protection (frame-ancestors)" },
  adminPageGated: { labelAr: "صفحة /admin بترفض غير المسجلين", labelEn: "/admin rejects unauthenticated visitors" },
  adminApiGated: { labelAr: "API الأدمن بيرفض الطلبات من غير تسجيل دخول", labelEn: "Admin API rejects unauthenticated requests" },
  httpsOnly: { labelAr: "الموقع شغال على HTTPS", labelEn: "Site is served over HTTPS" },
};

async function checkCsp(origin: string): Promise<SecurityCheckItem> {
  try {
    const res = await fetch(origin, { redirect: "manual" });
    const csp = res.headers.get("content-security-policy");
    return { key: "csp", ...SECURITY_LABELS.csp, passed: !!csp };
  } catch {
    return { key: "csp", ...SECURITY_LABELS.csp, passed: false, detail: "request failed" };
  }
}

async function checkFrameAncestors(origin: string): Promise<SecurityCheckItem> {
  try {
    const res = await fetch(origin, { redirect: "manual" });
    const csp = res.headers.get("content-security-policy") ?? "";
    return { key: "frameAncestors", ...SECURITY_LABELS.frameAncestors, passed: csp.includes("frame-ancestors") };
  } catch {
    return { key: "frameAncestors", ...SECURITY_LABELS.frameAncestors, passed: false, detail: "request failed" };
  }
}

async function checkAdminPageGated(origin: string): Promise<SecurityCheckItem> {
  try {
    const res = await fetch(`${origin}/admin`, { redirect: "manual" });
    // The (admin) layout redirects an unauthenticated visitor away — a bare
    // 200 here would mean the admin dashboard rendered for a guest.
    const passed = res.status >= 300 && res.status < 400;
    return { key: "adminPageGated", ...SECURITY_LABELS.adminPageGated, passed, detail: `HTTP ${res.status}` };
  } catch {
    return { key: "adminPageGated", ...SECURITY_LABELS.adminPageGated, passed: false, detail: "request failed" };
  }
}

async function checkAdminApiGated(origin: string): Promise<SecurityCheckItem> {
  try {
    const res = await fetch(`${origin}/api/admin/categories`, { redirect: "manual" });
    const passed = res.status === 401 || res.status === 403;
    return { key: "adminApiGated", ...SECURITY_LABELS.adminApiGated, passed, detail: `HTTP ${res.status}` };
  } catch {
    return { key: "adminApiGated", ...SECURITY_LABELS.adminApiGated, passed: false, detail: "request failed" };
  }
}

function checkHttps(origin: string): SecurityCheckItem {
  const passed = origin.startsWith("https://") || origin.startsWith("http://localhost");
  return { key: "httpsOnly", ...SECURITY_LABELS.httpsOnly, passed };
}

export async function runSecurityChecklist(origin: string): Promise<SecurityReport> {
  const items = await Promise.all([
    checkCsp(origin),
    checkFrameAncestors(origin),
    checkAdminPageGated(origin),
    checkAdminApiGated(origin),
    Promise.resolve(checkHttps(origin)),
  ]);
  return { items, passedCount: items.filter((i) => i.passed).length, totalCount: items.length };
}

// ─── Performance probe ───────────────────────────────────────────────────────
// Times a handful of real requests against the site's own origin, right now
// — not a historical log (no per-request timing is collected anywhere in
// this app yet; that would need a middleware change, a separate step).

const PROBE_TARGETS: { label: string; path: string }[] = [
  { label: "Home", path: "/home" },
  { label: "Explore", path: "/explore" },
  { label: "Talent profile API", path: "/api/me" },
];

async function timedProbe(origin: string, target: { label: string; path: string }): Promise<PerformanceProbe> {
  const start = Date.now();
  try {
    const res = await fetch(`${origin}${target.path}`, { redirect: "manual" });
    return { label: target.label, path: target.path, ms: Date.now() - start, status: res.status };
  } catch {
    return { label: target.label, path: target.path, ms: null, status: null };
  }
}

export async function runPerformanceProbe(origin: string): Promise<PerformanceReport> {
  const probes = await Promise.all(PROBE_TARGETS.map((target) => timedProbe(origin, target)));
  const timed = probes.filter((p): p is PerformanceProbe & { ms: number } => p.ms !== null);
  if (timed.length === 0) return { probes, avgMs: null, maxMs: null, slowest: null };

  const avgMs = Math.round(timed.reduce((sum, p) => sum + p.ms, 0) / timed.length);
  const slowest = timed.reduce((a, b) => (b.ms > a.ms ? b : a));
  return { probes, avgMs, maxMs: slowest.ms, slowest };
}

// ─── Traffic snapshot ────────────────────────────────────────────────────────
// Reuses the same in-house event log /admin/user-activity is built on — a
// trailing 7-day window, not the date-range picker on that page (this is a
// checkup summary, not a report).

export async function fetchTrafficSnapshot(): Promise<TrafficSnapshot> {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const stats = await fetchAdminUserActivityStats({ from, to });
  return {
    pageViews: stats.page_view,
    signups: stats.signup,
    clicks: stats.click,
    talentProfileViews: stats.talent_profile_view,
  };
}

// ─── AI recommendations ──────────────────────────────────────────────────────
// One Messages API call summarizing the three reports above into a short,
// prioritized action list. Haiku, not Sonnet — this is a cheap, frequent
// utility call (an admin can re-run the whole checkup on a whim), not a
// reasoning-heavy task; a fast/cheap model is the right tool here.

function anthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  error?: { message?: string };
}

export async function fetchAiRecommendations(
  cloudinary: CloudinaryReport,
  security: SecurityReport,
  performance: PerformanceReport,
  traffic: TrafficSnapshot,
): Promise<AiReport> {
  if (!anthropicConfigured()) return { configured: false, ok: false };

  const summary = {
    cloudinary: cloudinary.configured
      ? { ok: cloudinary.ok, storageBytes: cloudinary.storageBytes, creditsUsedPercent: cloudinary.creditsUsedPercent, error: cloudinary.error }
      : "not configured",
    security: security.items.map((i) => ({ check: i.labelEn, passed: i.passed, detail: i.detail })),
    performance: { avgMs: performance.avgMs, maxMs: performance.maxMs, slowest: performance.slowest?.label ?? null },
    trafficLast7d: traffic,
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content:
            "You are reviewing a health checkup for a small web platform (Next.js on Cloudflare, Supabase backend). " +
            "Given this JSON of live checks, list at most 5 short, concrete, prioritized action items an admin/developer " +
            "should do next. One line each, most urgent first, plain text (no markdown), no preamble.\n\n" +
            JSON.stringify(summary),
        }],
      }),
    });

    const data = (await res.json()) as AnthropicResponse;
    if (!res.ok) return { configured: true, ok: false, error: data.error?.message ?? `HTTP ${res.status}` };

    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const tips = text.split("\n").map((line) => line.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean).slice(0, 5);
    return { configured: true, ok: true, tips };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

// ─── Full run + persistence ─────────────────────────────────────────────────

export async function runHealthCheck(origin: string, userId: string | null): Promise<HealthCheckResult> {
  const [cloudinary, security, performance, traffic] = await Promise.all([
    fetchCloudinaryReport(),
    runSecurityChecklist(origin),
    runPerformanceProbe(origin),
    fetchTrafficSnapshot(),
  ]);
  const ai = await fetchAiRecommendations(cloudinary, security, performance, traffic);

  const categoryScores = {
    cloudinary: scoreCloudinary(cloudinary),
    security: scoreSecurity(security.passedCount, security.totalCount),
    performance: scorePerformance(performance.avgMs),
  };
  const score = computeOverallScore(categoryScores);

  const result: HealthCheckResult = { score, categoryScores, cloudinary, security, performance, traffic, ai };

  const { data, error } = await adminClient
    .from("health_check_runs")
    .insert({ created_by: userId, score, results: result })
    .select("id, created_at")
    .single();
  if (!error && data) {
    result.id = data.id;
    result.createdAt = data.created_at;
  }

  return result;
}

const HISTORY_LIMIT = 10;

export async function fetchLatestHealthCheck(): Promise<HealthCheckResult | null> {
  const { data, error } = await adminClient
    .from("health_check_runs")
    .select("id, created_at, results")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { ...(data.results as HealthCheckResult), id: data.id, createdAt: data.created_at };
}

export interface HealthCheckHistoryPoint {
  id: string;
  createdAt: string;
  score: number;
}

export async function fetchHealthCheckHistory(): Promise<HealthCheckHistoryPoint[]> {
  const { data, error } = await adminClient
    .from("health_check_runs")
    .select("id, created_at, score")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id, createdAt: r.created_at, score: r.score }));
}
