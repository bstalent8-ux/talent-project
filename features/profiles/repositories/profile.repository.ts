import "server-only";

// ─── ProfileRepository ────────────────────────────────────────────────────────
// Owns the `profiles` table (plus the `profile_types` embed used for type
// detection). No business logic, no role branching, no DTO construction.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";
import type {
  RawProfileType,
  RawSharedProfile,
  RawSharedProfileWithType,
} from "../types/raw";

const SHARED_COLUMNS =
  "id, role, full_name, handle, avatar_url, city, bio, phone_number, is_verified, account_status, brand_status, created_at, profile_type_id";

const TYPE_COLUMNS =
  "id, slug, name, description, name_ar, name_en, core_table, provider_key, is_bookable, route_prefix, is_active, sort_order";

const SHARED_WITH_TYPE = `${SHARED_COLUMNS}, profile_types(${TYPE_COLUMNS})`;

/** PostgREST returns an embed as an object or a 1-element array. Normalize once. */
function unwrapType(raw: RawProfileType | RawProfileType[] | null): RawProfileType | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export interface IdentityRow {
  profile: RawSharedProfile;
  type:    RawProfileType | null;
}

function toIdentity(row: RawSharedProfileWithType | null): IdentityRow | null {
  if (!row) return null;
  const { profile_types, ...profile } = row;
  return { profile: profile as RawSharedProfile, type: unwrapType(profile_types) };
}

export const profileRepository = {
  async findIdentityById(profileId: string): Promise<IdentityRow | null> {
    const { data, error } = await adminClient
      .from("profiles")
      .select(SHARED_WITH_TYPE)
      .eq("id", profileId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return toIdentity(data as RawSharedProfileWithType | null);
  },

  async findIdentityByHandle(handle: string): Promise<IdentityRow | null> {
    const { data, error } = await adminClient
      .from("profiles")
      .select(SHARED_WITH_TYPE)
      .eq("handle", handle)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return toIdentity(data as RawSharedProfileWithType | null);
  },

  /**
   * `profiles.id` is 1:1 with `auth.users.id`, so this is the same lookup as
   * findIdentityById. Kept as a distinct method because call sites read very
   * differently ("the signed-in user" vs "some profile").
   */
  async findIdentityByUserId(userId: string): Promise<IdentityRow | null> {
    return this.findIdentityById(userId);
  },

  async updateShared(profileId: string, patch: Record<string, unknown>): Promise<void> {
    if (!patch || Object.keys(patch).length === 0) return;

    const { error } = await adminClient
      .from("profiles")
      .update(patch)
      .eq("id", profileId);

    if (error) throw fromSupabaseError(error);
  },

  /** Type registry lookup, used by the service when a profile carries no type. */
  async findTypeBySlug(slug: string): Promise<RawProfileType | null> {
    const { data, error } = await adminClient
      .from("profile_types")
      .select(TYPE_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileType) ?? null;
  },
};

export type ProfileRepository = typeof profileRepository;
