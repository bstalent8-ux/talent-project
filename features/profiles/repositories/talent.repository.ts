import "server-only";

// ─── TalentRepository ─────────────────────────────────────────────────────────
// Owns `talent_profiles` and the child rows a talent profile needs. One table
// per method. No business logic — the public/private filtering decisions live
// in TalentProfileProvider, not here.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";
import type {
  RawPortfolioRow,
  RawReviewRow,
  RawTalentBrandRow,
  RawTalentCore,
} from "../types/raw";

const CORE_COLUMNS =
  "id, user_id, category, specialties, bio, availability, packages, social_links, profile_views, avg_rating, total_reviews, total_bookings, is_featured, status, approved_at, approved_by, rejection_reason";

export const talentRepository = {
  async findByUserId(userId: string): Promise<RawTalentCore | null> {
    const { data, error } = await adminClient
      .from("talent_profiles")
      .select(CORE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawTalentCore) ?? null;
  },

  async findById(talentProfileId: string): Promise<RawTalentCore | null> {
    const { data, error } = await adminClient
      .from("talent_profiles")
      .select(CORE_COLUMNS)
      .eq("id", talentProfileId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawTalentCore) ?? null;
  },

  /** Class A lookup: user_id → talent_profiles.id. One indexed query. */
  async findIdByUserId(userId: string): Promise<string | null> {
    const { data, error } = await adminClient
      .from("talent_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return data?.id ?? null;
  },

  async upsert(userId: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await adminClient
      .from("talent_profiles")
      .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" });

    if (error) throw fromSupabaseError(error);
  },

  // ─── Child rows ─────────────────────────────────────────────────────────────

  /** `approvedOnly` mirrors the existing public filter on portfolio_items. */
  async findPortfolio(talentProfileId: string, approvedOnly: boolean): Promise<RawPortfolioRow[]> {
    let query = adminClient
      .from("portfolio_items")
      .select("id, url, media_type, caption, sort_order, is_approved")
      .eq("talent_id", talentProfileId);

    if (approvedOnly) query = query.eq("is_approved", true);

    const { data, error } = await query.order("sort_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawPortfolioRow[]) ?? [];
  },

  async findReviews(talentProfileId: string, approvedOnly: boolean): Promise<RawReviewRow[]> {
    let query = adminClient
      .from("reviews")
      .select("id, booking_id, talent_id, brand_id, rating, comment, status, created_at")
      .eq("talent_id", talentProfileId);

    if (approvedOnly) query = query.eq("status", "approved");

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw fromSupabaseError(error);
    return (data as RawReviewRow[]) ?? [];
  },

  async findBrands(talentProfileId: string): Promise<RawTalentBrandRow[]> {
    const { data, error } = await adminClient
      .from("talent_brands")
      .select("id, brand_name, logo_url, year_collaborated, sort_order")
      .eq("talent_profile_id", talentProfileId)
      .order("sort_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawTalentBrandRow[]) ?? [];
  },

  /**
   * Booking statuses for this talent, for stats only.
   * Reads `talent_id` — NOT `provider_profile_id`. Switching booking reads to
   * the shadow column is Phase 5, one route at a time.
   */
  async findBookingStatuses(talentProfileId: string): Promise<Array<{ status: string }>> {
    const { data, error } = await adminClient
      .from("bookings")
      .select("status")
      .eq("talent_id", talentProfileId);

    if (error) throw fromSupabaseError(error);
    return (data as Array<{ status: string }>) ?? [];
  },
};

export type TalentRepository = typeof talentRepository;
