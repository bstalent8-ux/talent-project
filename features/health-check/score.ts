// ─── Health checkup scoring — pure, unit-tested ─────────────────────────────
// Turns the three live reports into 0-100 scores and one overall weighted
// score for the gauge. Kept separate from service.ts (which does the actual
// network calls) so the scoring rules themselves are testable without
// mocking fetch/Supabase — same split as page-duration-clustering.ts.

import type { CloudinaryReport } from "./types";

export function scoreSecurity(passedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((passedCount / totalCount) * 100);
}

// Step thresholds, not a smooth curve — a checkup page needs an honest
// "this is slow" cutoff an admin can act on, not a formula that quietly
// drifts. Tuned for this app's edge-function + Supabase-over-HTTP profile,
// where "fast" is a few hundred ms, not the sub-100ms of a static CDN asset.
export function scorePerformance(avgMs: number | null): number | null {
  if (avgMs === null) return null;
  if (avgMs <= 300) return 100;
  if (avgMs <= 600) return 90;
  if (avgMs <= 1000) return 75;
  if (avgMs <= 2000) return 55;
  if (avgMs <= 4000) return 30;
  return 10;
}

// Cloudinary is optional infrastructure (unconfigured = null, excluded from
// the overall average below, not penalized) — but once it IS configured, a
// failed call or near-exhausted plan credit is a real, actionable problem.
export function scoreCloudinary(report: CloudinaryReport): number | null {
  if (!report.configured) return null;
  if (!report.ok) return 20;
  if (report.creditsUsedPercent === undefined) return 90;
  if (report.creditsUsedPercent < 70) return 100;
  if (report.creditsUsedPercent < 90) return 70;
  return 40;
}

// ─── Per-category rating badge ──────────────────────────────────────────────
// A 0-100 score is precise but not scannable at a glance — each checkup card
// also shows this as "N/10 · band" (Excellent/Good/Medium/Low). Same bands
// the gauge's colors imply (80+/50+/below), just with a 4-way split instead
// of the gauge's 3 colors, and a word instead of relying on color alone
// (color-blind-safe, and legible in a screenshot with no context).

export type RatingBand = "excellent" | "good" | "medium" | "low";

export interface Rating {
  outOf10: number;
  band: RatingBand;
}

export function ratingLabel(score: number): Rating {
  const clamped = Math.max(0, Math.min(100, score));
  const outOf10 = Math.round(clamped / 10);
  const band: RatingBand = clamped >= 90 ? "excellent" : clamped >= 70 ? "good" : clamped >= 50 ? "medium" : "low";
  return { outOf10, band };
}

const WEIGHTS = { security: 0.4, performance: 0.35, cloudinary: 0.25 } as const;

/** Weighted average over whichever categories have a score — a category
 *  that's null (not configured, or every probe failed) is dropped from both
 *  the numerator and denominator, so it doesn't drag the score down just for
 *  being unset. Every category null (shouldn't happen — security always
 *  produces a number) falls back to 0. */
export function computeOverallScore(scores: { security: number; performance: number | null; cloudinary: number | null }): number {
  const parts: { value: number; weight: number }[] = [{ value: scores.security, weight: WEIGHTS.security }];
  if (scores.performance !== null) parts.push({ value: scores.performance, weight: WEIGHTS.performance });
  if (scores.cloudinary !== null) parts.push({ value: scores.cloudinary, weight: WEIGHTS.cloudinary });

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = parts.reduce((sum, p) => sum + p.value * p.weight, 0);
  return Math.round(weightedSum / totalWeight);
}
