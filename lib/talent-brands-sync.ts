// Syncs a talent's plain self-entered brand-name list (profile/me's
// "Collaborated Brands" editor, saved into talent_profiles.social_links.brands)
// into the real talent_brands table — the ONLY table the public profile reads
// for brand cards (see components/profile/dynamic/adapters/talent.context.ts's
// toBrandItems: "never from the legacy social_links.brands fallback"). Before
// this, a talent could type real companies into the editor, save successfully,
// and nothing would ever appear on their live profile — social_links.brands
// was written but never read back out by the current pipeline.
//
// A verified row is never deleted here even if its name drops out of the
// talent's list — an admin's verification (talent_brands.verified) shouldn't
// vanish because of a typo fix or reorder on the talent's side.

import { adminClient } from "@/lib/supabase/admin";

export interface ExistingBrandRow {
  id: string;
  brand_name: string;
  verified: boolean | null;
}

export interface BrandSyncPlan {
  toDeleteIds: string[];
  toInsert: { brand_name: string; sort_order: number }[];
  toReorder: { id: string; brand_name: string; sort_order: number }[];
}

const MAX_BRANDS = 20;
const MAX_NAME_LENGTH = 60;

export function planBrandSync(existing: ExistingBrandRow[], desiredNamesRaw: unknown): BrandSyncPlan {
  const desiredNames = Array.isArray(desiredNamesRaw)
    ? Array.from(new Set(
        desiredNamesRaw
          .map((n) => (typeof n === "string" ? n.trim() : ""))
          .filter((n) => n.length > 0 && n.length <= MAX_NAME_LENGTH)
      )).slice(0, MAX_BRANDS)
    : [];

  const existingByName = new Map(existing.map((row) => [row.brand_name, row]));
  const desiredSet = new Set(desiredNames);

  const toDeleteIds = existing
    .filter((row) => !row.verified && !desiredSet.has(row.brand_name))
    .map((row) => row.id);

  const toInsert: BrandSyncPlan["toInsert"] = [];
  const toReorder: BrandSyncPlan["toReorder"] = [];

  desiredNames.forEach((name, index) => {
    const match = existingByName.get(name);
    if (match) {
      toReorder.push({ id: match.id, brand_name: match.brand_name, sort_order: index });
    } else {
      toInsert.push({ brand_name: name, sort_order: index });
    }
  });

  return { toDeleteIds, toInsert, toReorder };
}

/**
 * Best-effort — never throws. This is a secondary write alongside the main
 * profile save (same posture as lib/notifications/service.ts): a failure here
 * must not fail the talent's profile save.
 *
 * Capped at 4 sequential round trips regardless of how many brands a talent
 * has (max 20, see MAX_BRANDS) — the reorder step used to be one UPDATE per
 * row in a for-loop, which meant a profile save could fire 20+ sequential
 * DB round trips from inside a single edge function invocation. Batched into
 * one upsert instead.
 */
export async function syncTalentBrands(userId: string, desiredNamesRaw: unknown): Promise<void> {
  try {
    const { data: tp } = await adminClient
      .from("talent_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!tp?.id) return;

    const { data: existing, error: fetchErr } = await adminClient
      .from("talent_brands")
      .select("id, brand_name, verified")
      .eq("talent_profile_id", tp.id);
    if (fetchErr) throw fetchErr;

    const plan = planBrandSync((existing as ExistingBrandRow[]) ?? [], desiredNamesRaw);

    if (plan.toDeleteIds.length > 0) {
      await adminClient.from("talent_brands").delete().in("id", plan.toDeleteIds);
    }
    if (plan.toInsert.length > 0) {
      await adminClient.from("talent_brands").insert(
        plan.toInsert.map((row) => ({ ...row, talent_profile_id: tp.id }))
      );
    }
    if (plan.toReorder.length > 0) {
      await adminClient.from("talent_brands").upsert(
        plan.toReorder.map((row) => ({ ...row, talent_profile_id: tp.id })),
        { onConflict: "id" }
      );
    }
  } catch (e) {
    console.error("[talent-brands-sync] failed", e);
  }
}
