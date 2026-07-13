import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/recalc-ratings
 *
 * One-shot backfill: recalculates avg_rating + total_reviews for EVERY
 * talent_profile in a single aggregated query instead of N+1 calls.
 *
 * Returns a diff so you can see what changed.
 */
export async function POST() {
  // ── 1. Aggregate ratings per talent from reviews table ───────────────────
  const { data: agg, error: aggErr } = await adminClient
    .from("reviews")
    .select("talent_id, rating")
    .eq("status", "approved");

  if (aggErr) {
    return NextResponse.json({ error: aggErr.message }, { status: 500 });
  }

  // Build a map: talent_profile_id → { sum, count }
  const map = new Map<string, { sum: number; count: number }>();
  for (const row of agg ?? []) {
    const entry = map.get(row.talent_id) ?? { sum: 0, count: 0 };
    entry.sum += row.rating ?? 0;
    entry.count += 1;
    map.set(row.talent_id, entry);
  }

  // ── 2. Fetch all talent profiles ─────────────────────────────────────────
  const { data: profiles, error: profErr } = await adminClient
    .from("talent_profiles")
    .select("id, avg_rating, total_reviews, profiles(handle)");

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  // ── 3. Update each profile and collect diff ───────────────────────────────
  const results: Array<{
    id: string;
    handle: string | null;
    old_avg: number | null;
    new_avg: number;
    old_count: number | null;
    new_count: number;
    changed: boolean;
  }> = [];

  for (const tp of profiles ?? []) {
    const stats = map.get(tp.id);
    const newCount = stats?.count ?? 0;
    const newAvg =
      newCount === 0
        ? 0
        : Math.round((stats!.sum / newCount) * 10) / 10;

    const rawHandle = tp.profiles;
    const handle = Array.isArray(rawHandle)
      ? (rawHandle[0] as { handle?: string })?.handle ?? null
      : (rawHandle as { handle?: string } | null)?.handle ?? null;

    const changed =
      tp.avg_rating !== newAvg || tp.total_reviews !== newCount;

    if (changed) {
      const { error: updateErr } = await adminClient
        .from("talent_profiles")
        .update({ avg_rating: newAvg, total_reviews: newCount })
        .eq("id", tp.id);

      if (updateErr) {
        console.error(`[backfill] failed for ${tp.id}:`, updateErr.message);
      } else {
        if (handle) revalidatePath(`/talent/${handle}`);
      }
    }

    results.push({
      id: tp.id,
      handle,
      old_avg: tp.avg_rating,
      new_avg: newAvg,
      old_count: tp.total_reviews,
      new_count: newCount,
      changed,
    });
  }

  revalidatePath("/explore");

  const changed = results.filter(r => r.changed);
  console.log(`[backfill] updated ${changed.length} / ${results.length} talent profiles`);

  return NextResponse.json({
    total: results.length,
    updated: changed.length,
    results,
  });
}
