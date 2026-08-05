import "server-only";

// ─── DynamicProfileRepository ─────────────────────────────────────────────────
// Owns the Phase 1 tables: profile_sections, profile_fields, profile_values,
// profile_layouts.
//
// Type-agnostic — identical for every profile type. No validation, no
// visibility decisions; those belong to the service and the providers.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";
import type {
  RawProfileField,
  RawProfileLayout,
  RawProfileSection,
  RawProfileValue,
} from "../types/raw";

const SECTION_COLUMNS =
  "id, profile_type_id, key, title, description, title_ar, title_en, description_ar, description_en, display_order, is_enabled, kind, weight, visibility, render_component, icon";

const FIELD_COLUMNS =
  "id, section_id, key, label, label_ar, label_en, placeholder_ar, placeholder_en, help_text_ar, help_text_en, field_type, is_required, validation_schema, options, weight, is_enabled, display_order";

export const dynamicProfileRepository = {
  /** `profileTypeId` is the uuid PK, not the slug. */
  async findSectionsByType(profileTypeId: string): Promise<RawProfileSection[]> {
    const { data, error } = await adminClient
      .from("profile_sections")
      .select(SECTION_COLUMNS)
      .eq("profile_type_id", profileTypeId)
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileSection[]) ?? [];
  },

  /** One query for N sections — never one per section. */
  async findFieldsBySections(sectionIds: string[]): Promise<RawProfileField[]> {
    if (sectionIds.length === 0) return [];

    const { data, error } = await adminClient
      .from("profile_fields")
      .select(FIELD_COLUMNS)
      .in("section_id", sectionIds)
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileField[]) ?? [];
  },

  /** One query for every dynamic value on a profile. */
  async findValuesByProfile(profileId: string): Promise<RawProfileValue[]> {
    const { data, error } = await adminClient
      .from("profile_values")
      .select("id, profile_id, field_id, value")
      .eq("profile_id", profileId);

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileValue[]) ?? [];
  },

  /**
   * Batch upsert on the (profile_id, field_id) unique constraint created in
   * 20260806_04. Values arrive already validated and resolved to field ids —
   * this method does not know what a field means.
   */
  async upsertValues(
    profileId: string,
    entries: Array<{ fieldId: string; value: unknown }>,
  ): Promise<void> {
    if (entries.length === 0) return;

    const rows = entries.map((e) => ({
      profile_id: profileId,
      field_id:   e.fieldId,
      value:      e.value,
    }));

    const { error } = await adminClient
      .from("profile_values")
      .upsert(rows, { onConflict: "profile_id,field_id" });

    if (error) throw fromSupabaseError(error);
  },

  async deleteValues(profileId: string, fieldIds: string[]): Promise<void> {
    if (fieldIds.length === 0) return;

    const { error } = await adminClient
      .from("profile_values")
      .delete()
      .eq("profile_id", profileId)
      .in("field_id", fieldIds);

    if (error) throw fromSupabaseError(error);
  },

  async findLayout(profileTypeId: string, variant = "public"): Promise<RawProfileLayout | null> {
    const { data, error } = await adminClient
      .from("profile_layouts")
      .select("id, profile_type_id, variant, layout, is_active")
      .eq("profile_type_id", profileTypeId)
      .eq("variant", variant)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileLayout) ?? null;
  },
};

export type DynamicProfileRepository = typeof dynamicProfileRepository;
