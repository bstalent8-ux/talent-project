import "server-only";

// ─── BrandRepository ──────────────────────────────────────────────────────────
// Owns `brand_profiles`. One table. No business logic.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";
import type { RawBrandCore } from "../types/raw";

const CORE_COLUMNS =
  "id, user_id, category_id, company_name, industry, website_url, social_links, profile_views, status, approved_at, rejection_reason";

export const brandRepository = {
  async findByUserId(userId: string): Promise<RawBrandCore | null> {
    const { data, error } = await adminClient
      .from("brand_profiles")
      .select(CORE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawBrandCore) ?? null;
  },

  async findById(brandProfileId: string): Promise<RawBrandCore | null> {
    const { data, error } = await adminClient
      .from("brand_profiles")
      .select(CORE_COLUMNS)
      .eq("id", brandProfileId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawBrandCore) ?? null;
  },

  async findIdByUserId(userId: string): Promise<string | null> {
    const { data, error } = await adminClient
      .from("brand_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return data?.id ?? null;
  },

  /**
   * `status` is moderation state. It is seeded only on creation, never on edit
   * — the same rule the existing route enforces at app/api/profile/route.ts:117,
   * otherwise saving a profile silently sends an approved brand back to pending.
   */
  async upsert(userId: string, patch: Record<string, unknown>): Promise<void> {
    const existing = await this.findIdByUserId(userId);

    const { error } = await adminClient
      .from("brand_profiles")
      .upsert(
        {
          ...patch,
          user_id: userId,
          ...(existing ? {} : { status: "pending" }),
        },
        { onConflict: "user_id" },
      );

    if (error) throw fromSupabaseError(error);
  },

  async countJobsPosted(brandUserId: string): Promise<number> {
    const { count, error } = await adminClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandUserId);

    if (error) throw fromSupabaseError(error);
    return count ?? 0;
  },
};

export type BrandRepository = typeof brandRepository;
