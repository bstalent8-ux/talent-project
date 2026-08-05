import "server-only";

// ─── ProviderRefRepository ────────────────────────────────────────────────────
// The Class A replacement: "what is this user's provider row id?"
//
// Kept separate from TalentRepository on purpose. If this lived on the talent
// repository, every Class A caller would import the talent repository —
// reintroducing exactly the coupling Phase 2 removes.
//
// Deliberately NOT a profile load, and deliberately NOT cached: it backs
// ownership checks on the booking path, where a stale entry is an
// authorization bug.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";

export interface ProviderRefRow {
  profileId:         string;
  typeSlug:          string;
  providerProfileId: string;
}

/** Core table per profile type. The only place this mapping is hardcoded. */
const CORE_TABLE_BY_SLUG: Record<string, string> = {
  talent: "talent_profiles",
  brand:  "brand_profiles",
  // TODO(phase-5): agency: "agency_profiles"
};

export const providerRefRepository = {
  /**
   * One indexed query against the type's core table.
   * `typeSlug` comes from the caller (ProfileService already resolved it), so
   * this method performs no type detection of its own.
   */
  async resolveRef(userId: string, typeSlug: string): Promise<ProviderRefRow | null> {
    const table = CORE_TABLE_BY_SLUG[typeSlug];
    if (!table) return null;

    const { data, error } = await adminClient
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    if (!data?.id) return null;

    return { profileId: userId, typeSlug, providerProfileId: data.id };
  },

  /**
   * Reverse lookup: provider row id → owning profile id.
   * Used when a caller holds a talent_profiles.id and needs the user behind it.
   */
  async resolveRefByProviderProfileId(
    providerProfileId: string,
    typeSlug: string,
  ): Promise<ProviderRefRow | null> {
    const table = CORE_TABLE_BY_SLUG[typeSlug];
    if (!table) return null;

    const { data, error } = await adminClient
      .from(table)
      .select("id, user_id")
      .eq("id", providerProfileId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    if (!data?.user_id) return null;

    return { profileId: data.user_id, typeSlug, providerProfileId: data.id };
  },
};

export type ProviderRefRepository = typeof providerRefRepository;
