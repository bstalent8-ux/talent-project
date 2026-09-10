import { adminClient } from "@/lib/supabase/admin";
import { calculateCompletion, COMPLETION_THRESHOLDS } from "@/lib/profile-completion";

// ─── COMPLETION_THRESHOLDS enforcement ──────────────────────────────────────
// The thresholds in lib/profile-completion.ts have always been "defined but
// not enforced anywhere" (CLAUDE.md §10.5). Against the current talent base,
// enforcing all of them would block ~32% from applying to jobs, ~47% from
// receiving briefs, ~43% from search. So:
//
//   applyToJobs (50)   — enforced ON by default. Low bar; a blocked talent
//                        gets a clear, minutes-to-fix message.
//                        ENFORCE_COMPLETION_APPLY="false" to disable.
//   receiveBriefs (70) — wired but OFF by default. Flip
//                        ENFORCE_COMPLETION_BRIEFS="true" after a completion
//                        push.
//   appearInSearch (60) — deliberately NOT wired. A search-visibility gate
//                        was added and then removed 2026-09-08 at the admin's
//                        explicit request (see public-talents.service.ts) —
//                        "I approved 40, only 39 show" read as a bug. The key
//                        stays here only so requireCompletion() stays total.

export const completionEnforcement = {
  applyToJobs:   process.env.ENFORCE_COMPLETION_APPLY !== "false",
  receiveBriefs: process.env.ENFORCE_COMPLETION_BRIEFS === "true",
  appearInSearch: false, // see note above — not wired anywhere
} as const;

/** A talent's completion score (0–100), same weights as their own dashboard. */
export async function talentCompletionScore(userId: string): Promise<number> {
  const { data: p } = await adminClient
    .from("profiles")
    .select(
      "avatar_url, full_name, city, bio, talent_profiles(id, bio, category, specialties, social_links, packages, availability)",
    )
    .eq("id", userId)
    .maybeSingle();
  if (!p) return 0;
  const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
  if (!tp) return 0;
  const { data: pf } = await adminClient
    .from("portfolio_items")
    .select("id")
    .eq("talent_id", tp.id)
    .limit(1);
  return calculateCompletion(p, tp, pf ?? []).score;
}

type Gate = "applyToJobs" | "receiveBriefs" | "appearInSearch";

export interface CompletionGateResult {
  ok: boolean;
  /** The talent's score (0 when the gate is disabled — not computed). */
  score: number;
  /** The threshold for this gate. */
  needed: number;
}

/**
 * `ok: true` when the gate is disabled or the talent clears it. On `ok: false`,
 * `score` / `needed` drive a 403 the caller renders as "complete your profile
 * to N% to …".
 */
export async function requireCompletion(userId: string, gate: Gate): Promise<CompletionGateResult> {
  const needed = COMPLETION_THRESHOLDS[gate];
  if (!completionEnforcement[gate]) return { ok: true, score: 0, needed };
  const score = await talentCompletionScore(userId);
  return { ok: score >= needed, score, needed };
}
