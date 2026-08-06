import "server-only";

// ─── ProfileTypeRepository ────────────────────────────────────────────────────
// Owns `profile_types`. One table. No business logic — every guard
// (provider registered? profiles still referencing it?) lives in
// profile-config.service.ts.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";
import type { RawProfileType } from "../types/raw";

const COLUMNS =
  "id, slug, name, description, name_ar, name_en, core_table, provider_key, is_bookable, route_prefix, is_active, sort_order";

export const profileTypeRepository = {
  /** Admin listing: includes inactive types. */
  async findAll(): Promise<RawProfileType[]> {
    const { data, error } = await adminClient
      .from("profile_types")
      .select(COLUMNS)
      .order("sort_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileType[]) ?? [];
  },

  async findById(id: string): Promise<RawProfileType | null> {
    const { data, error } = await adminClient
      .from("profile_types")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileType) ?? null;
  },

  async findBySlug(slug: string): Promise<RawProfileType | null> {
    const { data, error } = await adminClient
      .from("profile_types")
      .select(COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileType) ?? null;
  },

  async insert(patch: Record<string, unknown>): Promise<RawProfileType> {
    const { data, error } = await adminClient
      .from("profile_types")
      .insert(patch)
      .select(COLUMNS)
      .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileType;
  },

  async update(id: string, patch: Record<string, unknown>): Promise<RawProfileType> {
    const { data, error } = await adminClient
      .from("profile_types")
      .update(patch)
      .eq("id", id)
      .select(COLUMNS)
      .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileType;
  },

  async remove(id: string): Promise<void> {
    const { error } = await adminClient.from("profile_types").delete().eq("id", id);
    if (error) throw fromSupabaseError(error);
  },

  /** Guard input: how many profiles reference this type. */
  async countProfilesUsing(id: string): Promise<number> {
    const { count, error } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("profile_type_id", id);

    if (error) throw fromSupabaseError(error);
    return count ?? 0;
  },
};

export type ProfileTypeRepository = typeof profileTypeRepository;
