import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Server-only. Recalculates avg_rating + total_reviews for ONE talent_profile
 * directly from the reviews table.
 *
 * Column mapping:
 *   reviews.talent_id  → talent_profiles.id   (NOT user_id)
 *   talent_profiles.avg_rating   ← calculated here
 *   talent_profiles.total_reviews ← calculated here
 */
export async function recalcRating(talentProfileId: string): Promise<{
  avg: number;
  count: number;
  error?: string;
}> {
  console.log(`[recalcRating] ▶ talentProfileId = ${talentProfileId}`);

  // ── 1. Fetch all ratings for this talent ──────────────────────────────────
  const { data: rows, error: fetchErr } = await adminClient
    .from("reviews")
    .select("rating")
    .eq("talent_id", talentProfileId)
    .eq("status", "approved");

  if (fetchErr) {
    console.error("[recalcRating] ✗ fetch reviews failed:", fetchErr.message);
    return { avg: 0, count: 0, error: fetchErr.message };
  }

  const count = rows?.length ?? 0;
  const avg =
    count === 0
      ? 0
      : Math.round(
          (rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / count) * 10
        ) / 10;

  console.log(`[recalcRating]   fetched ${count} review(s): ${JSON.stringify(rows?.map(r => r.rating))}`);
  console.log(`[recalcRating]   calculated avg_rating=${avg}, total_reviews=${count}`);

  // ── 2. Write back to talent_profiles ─────────────────────────────────────
  const { data: updated, error: updateErr } = await adminClient
    .from("talent_profiles")
    .update({ avg_rating: avg, total_reviews: count })
    .eq("id", talentProfileId)   // talent_profiles.id, NOT user_id
    .select("id, avg_rating, total_reviews");

  if (updateErr) {
    console.error("[recalcRating] ✗ update talent_profiles failed:", updateErr.message);
    return { avg, count, error: updateErr.message };
  }

  if (!updated || updated.length === 0) {
    // The .eq("id", talentProfileId) matched no rows — ID is wrong
    console.error(`[recalcRating] ✗ no row updated — talent_profiles.id "${talentProfileId}" not found`);
    return { avg, count, error: "talent_profile not found" };
  }

  console.log(`[recalcRating] ✓ updated:`, updated[0]);

  // ── 3. Bust Next.js cache ─────────────────────────────────────────────────
  const { data: tp } = await adminClient
    .from("talent_profiles")
    .select("profiles(handle)")
    .eq("id", talentProfileId)
    .maybeSingle();

  const raw = tp?.profiles;
  const handle = Array.isArray(raw)
    ? raw[0]?.handle
    : (raw as { handle?: string } | null)?.handle;

  if (handle) {
    revalidatePath(`/talent/${handle}`);
    console.log(`[recalcRating] ✓ revalidated /talent/${handle}`);
  }
  revalidatePath("/explore");

  return { avg, count };
}
