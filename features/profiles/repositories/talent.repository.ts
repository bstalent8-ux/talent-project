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
  "id, user_id, category, specialties, bio, availability, availability_schedule, packages, social_links, profile_views, avg_rating, total_reviews, total_bookings, is_featured, status, approved_at, approved_by, rejection_reason";

// availability_schedule ships in supabase/migrations/20260813_talent_availability_schedule.sql,
// which is a human-applied SQL-editor migration (CLAUDE.md §6) — the column
// can lag a deploy that already selects it. Every query/write below tolerates
// that gap instead of 500ing every talent read: on the specific "column does
// not exist" error, retry without the column rather than failing the request.
const CORE_COLUMNS_NO_SCHEDULE = CORE_COLUMNS.replace("availability, availability_schedule,", "availability,");

// Reads hit PostgREST's query planner (42703 "column does not exist"); writes
// hit its schema-cache check instead (PGRST204 "could not find the column") —
// same root cause, different code depending on which PostgREST layer sees it.
function isMissingScheduleColumn(error: { code?: string; message?: string } | null): boolean {
  return (error?.code === "42703" || error?.code === "PGRST204") && !!error.message?.includes("availability_schedule");
}

export const talentRepository = {
  async findByUserId(userId: string): Promise<RawTalentCore | null> {
    let { data, error } = await adminClient
      .from("talent_profiles")
      .select(CORE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && isMissingScheduleColumn(error)) {
      ({ data, error } = await adminClient
        .from("talent_profiles")
        .select(CORE_COLUMNS_NO_SCHEDULE)
        .eq("user_id", userId)
        .maybeSingle());
      if (data) (data as Record<string, unknown>).availability_schedule = null;
    }

    if (error) throw fromSupabaseError(error);
    return (data as RawTalentCore) ?? null;
  },

  async findById(talentProfileId: string): Promise<RawTalentCore | null> {
    let { data, error } = await adminClient
      .from("talent_profiles")
      .select(CORE_COLUMNS)
      .eq("id", talentProfileId)
      .maybeSingle();

    if (error && isMissingScheduleColumn(error)) {
      ({ data, error } = await adminClient
        .from("talent_profiles")
        .select(CORE_COLUMNS_NO_SCHEDULE)
        .eq("id", talentProfileId)
        .maybeSingle());
      if (data) (data as Record<string, unknown>).availability_schedule = null;
    }

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

  /**
   * update-first, not a single `.upsert(...).onConflict("user_id")` call.
   *
   * Every section save here is a genuinely partial patch (e.g. just
   * `{ social_links }` or `{ availability, availability_schedule }`) — it
   * never carries `category`, which is NOT NULL with no default. Postgres
   * builds and validates the candidate INSERT row for `INSERT ... ON
   * CONFLICT DO UPDATE` — checking NOT NULL on every omitted column — BEFORE
   * it evaluates whether a conflict exists, so a partial upsert 500s with
   * "null value in column category violates not-null constraint" even
   * against an existing row that already has a category. Confirmed live:
   * the same two-key patch that fails via `.upsert()` succeeds via
   * `.update()`, which only touches the columns it's given.
   *
   * A talent_profiles row is seeded with `category` at registration (CLAUDE.md
   * §5), so the UPDATE branch is the overwhelmingly common path; INSERT only
   * fires for the rare partial-signup row that never got created.
   *
   * No silent-column-drop fallback on this path (there was one; removed).
   * `availability_schedule` is a real, migrated column now — a write that
   * fails must surface as a thrown error so the caller shows it, not get
   * quietly stripped and reported as success.
   */
  async upsert(userId: string, patch: Record<string, unknown>): Promise<void> {
    const { data: updated, error } = await adminClient
      .from("talent_profiles")
      .update(patch)
      .eq("user_id", userId)
      .select("id");

    if (error) throw fromSupabaseError(error);
    if (updated && updated.length > 0) return;

    // No existing row — first-ever save for this user.
    const { error: insertError } = await adminClient
      .from("talent_profiles")
      .insert({ ...patch, user_id: userId });
    if (insertError) throw fromSupabaseError(insertError);
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

  /**
   * Whether this talent has an admin-approved talent_verifications row (ID
   * document + selfie reviewed) — the real "Identity Verified" signal, a
   * different thing from profiles.is_verified (a general trust badge).
   * talent_verifications.talent_id references profiles.id (== this table's
   * user_id, not its own id) — confirmed live before writing this, do not
   * pass a talent_profiles.id here.
   */
  async findApprovedVerification(userId: string): Promise<boolean> {
    const { data, error } = await adminClient
      .from("talent_verifications")
      .select("id")
      .eq("talent_id", userId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return Boolean(data);
  },

  async findBrands(talentProfileId: string): Promise<RawTalentBrandRow[]> {
    const { data, error } = await adminClient
      .from("talent_brands")
      .select("id, brand_name, logo_url, year_collaborated, sort_order, verified")
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
