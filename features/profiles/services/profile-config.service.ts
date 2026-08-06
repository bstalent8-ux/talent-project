import "server-only";

// ─── ProfileConfigService ─────────────────────────────────────────────────────
// Admin-side reads and guarded writes for the dynamic profile configuration.
//
// Deliberately separate from dynamic-profile.service.ts, which is the RUNTIME
// read path and must stay lean and cached.
//
// This module owns every "is this allowed" decision. Repositories hold none.
// Route handlers hold only authentication.

import { ProfileError } from "../errors/profile-error";
import { providerRegistry } from "../providers/registry";
import { profileTypeRepository } from "../repositories/profile-type.repository";
import { dynamicProfileRepository } from "../repositories/dynamic-profile.repository";
import { dynamicProfileService } from "./dynamic-profile.service";
import { auditService } from "./audit.service";
import type {
  FieldCreateInput,
  FieldUpdateInput,
  LayoutInput,
  ProfileTypeCreateInput,
  ProfileTypeUpdateInput,
  ReorderInput,
  SectionCreateInput,
  SectionUpdateInput,
} from "../validation/config-schemas";
import type {
  RawProfileField,
  RawProfileLayout,
  RawProfileSection,
  RawProfileType,
} from "../types/raw";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function conflict(message: string): ProfileError {
  return new ProfileError("CONFLICT", { publicMessage: message });
}

/** Drops undefined keys so a PATCH never nulls a column it did not mention. */
function definedOnly(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/** Config edits change what every profile of this type renders. */
function invalidate(slug: string | null | undefined): void {
  if (slug) dynamicProfileService.invalidateSchema(slug);
}

export interface ProfileTypeSummary extends RawProfileType {
  /** Is a code provider registered for this slug? */
  providerRegistered: boolean;
  /** Does that provider actually support bookings? */
  providerBookable:   boolean;
  /** How many profiles reference this type — drives the delete guard. */
  profileCount:       number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const profileConfigService = {
  // ═══ Profile types ══════════════════════════════════════════════════════════

  async listTypes(): Promise<ProfileTypeSummary[]> {
    const types = await profileTypeRepository.findAll();

    const counts = await Promise.all(
      types.map((type) => profileTypeRepository.countProfilesUsing(type.id)),
    );

    return types.map((type, index) => {
      const registered = providerRegistry.hasProvider(type.slug);
      return {
        ...type,
        providerRegistered: registered,
        providerBookable:   registered ? providerRegistry.resolve(type.slug).meta.bookable : false,
        profileCount:       counts[index],
      };
    });
  },

  async getType(id: string): Promise<ProfileTypeSummary> {
    const type = await profileTypeRepository.findById(id);
    if (!type) throw ProfileError.notFound({ profileTypeId: id });

    const registered = providerRegistry.hasProvider(type.slug);
    return {
      ...type,
      providerRegistered: registered,
      providerBookable:   registered ? providerRegistry.resolve(type.slug).meta.bookable : false,
      profileCount:       await profileTypeRepository.countProfilesUsing(type.id),
    };
  },

  /**
   * Guards shared by create and update.
   *
   * The is_active guard is the most important control in this service: a type
   * with no registered provider would make ProfileService throw
   * INVALID_PROFILE_TYPE for every profile of that type. `agency` is seeded
   * inactive for exactly this reason.
   */
  assertTypeCapabilities(slug: string, patch: { is_active?: boolean; is_bookable?: boolean }): void {
    const registered = providerRegistry.hasProvider(slug);

    if (patch.is_active === true && !registered) {
      throw conflict("no provider is registered for this profile type — it cannot be activated");
    }

    if (patch.is_bookable === true) {
      if (!registered) {
        throw conflict("no provider is registered for this profile type");
      }
      if (!providerRegistry.resolve(slug).meta.bookable) {
        throw conflict("the provider for this profile type does not support bookings");
      }
    }
  },

  async createType(adminId: string, input: ProfileTypeCreateInput): Promise<RawProfileType> {
    if (await profileTypeRepository.findBySlug(input.slug)) {
      throw conflict("a profile type with this slug already exists");
    }

    this.assertTypeCapabilities(input.slug, input);

    // core_table and provider_key are code-owned and never accepted from a
    // request; a new type starts inactive until its provider ships.
    const created = await profileTypeRepository.insert(
      definedOnly({
        slug:         input.slug,
        name:         input.name,
        name_ar:      input.name_ar,
        name_en:      input.name_en,
        description:  input.description,
        route_prefix: input.route_prefix ?? input.slug,
        is_active:    input.is_active ?? false,
        is_bookable:  input.is_bookable ?? false,
        sort_order:   input.sort_order ?? 0,
      }),
    );

    await auditService.record({
      adminId, action: "create", entityType: "profile_type",
      entityId: created.id, before: null, after: created,
    });

    invalidate(created.slug);
    return created;
  },

  async updateType(adminId: string, id: string, input: ProfileTypeUpdateInput): Promise<RawProfileType> {
    const before = await profileTypeRepository.findById(id);
    if (!before) throw ProfileError.notFound({ profileTypeId: id });

    // slug, core_table and provider_key are immutable — absent from the schema,
    // and never read from the request here either.
    this.assertTypeCapabilities(before.slug, input);

    const after = await profileTypeRepository.update(
      id,
      definedOnly({
        name:         input.name,
        name_ar:      input.name_ar,
        name_en:      input.name_en,
        description:  input.description,
        route_prefix: input.route_prefix,
        is_active:    input.is_active,
        is_bookable:  input.is_bookable,
        sort_order:   input.sort_order,
      }),
    );

    await auditService.record({
      adminId, action: "update", entityType: "profile_type",
      entityId: id, before, after,
    });

    invalidate(before.slug);
    return after;
  },

  async setTypeActive(adminId: string, id: string, isActive: boolean): Promise<RawProfileType> {
    const before = await profileTypeRepository.findById(id);
    if (!before) throw ProfileError.notFound({ profileTypeId: id });

    this.assertTypeCapabilities(before.slug, { is_active: isActive });

    const after = await profileTypeRepository.update(id, { is_active: isActive });

    await auditService.record({
      adminId, action: isActive ? "enable" : "disable", entityType: "profile_type",
      entityId: id, before, after,
    });

    invalidate(before.slug);
    return after;
  },

  /** Blocked while any profile references the type. */
  async deleteType(adminId: string, id: string): Promise<void> {
    const before = await profileTypeRepository.findById(id);
    if (!before) throw ProfileError.notFound({ profileTypeId: id });

    const profileCount = await profileTypeRepository.countProfilesUsing(id);
    if (profileCount > 0) {
      throw conflict(`${profileCount} profiles use this type — deactivate it instead of deleting`);
    }

    await profileTypeRepository.remove(id);

    await auditService.record({
      adminId, action: "delete", entityType: "profile_type",
      entityId: id, before, after: null,
    });

    invalidate(before.slug);
  },

  // ═══ Sections ═══════════════════════════════════════════════════════════════

  async listSections(profileTypeId: string): Promise<RawProfileSection[]> {
    return dynamicProfileRepository.findSectionsByType(profileTypeId, true);
  },

  async createSection(
    adminId: string,
    profileTypeId: string,
    input: SectionCreateInput,
  ): Promise<RawProfileSection> {
    const type = await profileTypeRepository.findById(profileTypeId);
    if (!type) throw ProfileError.notFound({ profileTypeId });

    const existing = await dynamicProfileRepository.findSectionsByType(profileTypeId, true);
    if (existing.some((section) => section.key === input.key)) {
      throw conflict("a section with this key already exists for this profile type");
    }

    // kind is forced to "dynamic". A core section only means something when
    // matching provider code evaluates it by key, so one created here would
    // score false forever.
    const created = await dynamicProfileRepository.insertSection({
      ...definedOnly(input as unknown as Record<string, unknown>),
      profile_type_id: profileTypeId,
      kind:            "dynamic",
    });

    await auditService.record({
      adminId, action: "create", entityType: "profile_section",
      entityId: created.id, before: null, after: created,
      metadata: { profileTypeId, typeSlug: type.slug },
    });

    invalidate(type.slug);
    return created;
  },

  async updateSection(
    adminId: string,
    sectionId: string,
    input: SectionUpdateInput,
  ): Promise<RawProfileSection> {
    const before = await dynamicProfileRepository.findSectionById(sectionId);
    if (!before) throw ProfileError.notFound({ sectionId });

    // `key` and `kind` are immutable and are not present on the update schema.
    const after = await dynamicProfileRepository.updateSection(
      sectionId,
      definedOnly(input as unknown as Record<string, unknown>),
    );

    const type = await profileTypeRepository.findById(before.profile_type_id);

    await auditService.record({
      adminId, action: "update", entityType: "profile_section",
      entityId: sectionId, before, after,
    });

    invalidate(type?.slug);
    return after;
  },

  async setSectionEnabled(
    adminId: string,
    sectionId: string,
    isEnabled: boolean,
  ): Promise<RawProfileSection> {
    const before = await dynamicProfileRepository.findSectionById(sectionId);
    if (!before) throw ProfileError.notFound({ sectionId });

    const after = await dynamicProfileRepository.updateSection(sectionId, { is_enabled: isEnabled });
    const type  = await profileTypeRepository.findById(before.profile_type_id);

    await auditService.record({
      adminId, action: isEnabled ? "enable" : "disable", entityType: "profile_section",
      entityId: sectionId, before, after,
    });

    invalidate(type?.slug);
    return after;
  },

  /**
   * Hard delete only when the section carries no user data.
   * Matches the rule already stated in 20260806_03: sections are never
   * hard-deleted once profile_values rows exist.
   */
  async deleteSection(adminId: string, sectionId: string): Promise<void> {
    const before = await dynamicProfileRepository.findSectionById(sectionId);
    if (!before) throw ProfileError.notFound({ sectionId });

    const fields    = await dynamicProfileRepository.findFieldsBySections([sectionId], true);
    const valueCount = await dynamicProfileRepository.countValuesForFields(fields.map((f) => f.id));

    if (valueCount > 0) {
      throw conflict(`${valueCount} stored values belong to this section — disable it instead of deleting`);
    }

    await dynamicProfileRepository.deleteSection(sectionId);
    const type = await profileTypeRepository.findById(before.profile_type_id);

    await auditService.record({
      adminId, action: "delete", entityType: "profile_section",
      entityId: sectionId, before, after: null,
    });

    invalidate(type?.slug);
  },

  async reorderSections(adminId: string, profileTypeId: string, input: ReorderInput): Promise<void> {
    const sections = await dynamicProfileRepository.findSectionsByType(profileTypeId, true);
    const owned    = new Set(sections.map((section) => section.id));

    // Every id must belong to this type — otherwise one request could reorder
    // another profile type's sections.
    for (const item of input.items) {
      if (!owned.has(item.id)) throw conflict("section does not belong to this profile type");
    }

    await dynamicProfileRepository.setSectionOrder(input.items);
    const type = await profileTypeRepository.findById(profileTypeId);

    await auditService.record({
      adminId, action: "reorder", entityType: "profile_section",
      entityId: profileTypeId,
      before: sections.map((s) => ({ id: s.id, display_order: s.display_order })),
      after:  input.items,
    });

    invalidate(type?.slug);
  },

  // ═══ Fields ═════════════════════════════════════════════════════════════════

  async listFields(sectionId: string): Promise<RawProfileField[]> {
    return dynamicProfileRepository.findFieldsBySections([sectionId], true);
  },

  /**
   * A section plus its parent type — for the fields screen's breadcrumb and
   * for knowing whether the section is core (and therefore holds no fields).
   */
  async getSectionWithType(sectionId: string): Promise<{
    section: RawProfileSection;
    type:    RawProfileType;
  }> {
    const section = await dynamicProfileRepository.findSectionById(sectionId);
    if (!section) throw ProfileError.notFound({ sectionId });

    const type = await profileTypeRepository.findById(section.profile_type_id);
    if (!type) throw ProfileError.notFound({ profileTypeId: section.profile_type_id });

    return { section, type };
  },

  /**
   * Fields with their stored-value counts.
   *
   * The count drives two guards in the UI — delete, and changing field_type —
   * but the API enforces both independently. A zero here is a convenience, not
   * a permission.
   */
  async listFieldsWithUsage(sectionId: string): Promise<Array<RawProfileField & { valueCount: number }>> {
    const fields = await dynamicProfileRepository.findFieldsBySections([sectionId], true);
    const counts = await dynamicProfileRepository.countValuesByField(fields.map((f) => f.id));

    return fields.map((field) => ({ ...field, valueCount: counts[field.id] ?? 0 }));
  },

  async createField(
    adminId: string,
    sectionId: string,
    input: FieldCreateInput,
  ): Promise<RawProfileField> {
    const section = await dynamicProfileRepository.findSectionById(sectionId);
    if (!section) throw ProfileError.notFound({ sectionId });

    // Core sections are backed by typed columns and can never hold dynamic
    // fields — the same rule dynamicProfileService.validate() enforces on write.
    if (section.kind === "core") {
      throw conflict("core sections are backed by typed columns and cannot hold dynamic fields");
    }

    const existing = await dynamicProfileRepository.findFieldsBySections([sectionId], true);
    if (existing.some((field) => field.key === input.key)) {
      throw conflict("a field with this key already exists in this section");
    }

    const created = await dynamicProfileRepository.insertField({
      ...definedOnly(input as unknown as Record<string, unknown>),
      section_id: sectionId,
    });

    await auditService.record({
      adminId, action: "create", entityType: "profile_field",
      entityId: created.id, before: null, after: created,
      metadata: { sectionId, sectionKey: section.key },
    });

    await this.invalidateBySection(section);
    return created;
  },

  async updateField(
    adminId: string,
    fieldId: string,
    input: FieldUpdateInput,
  ): Promise<RawProfileField> {
    const before = await dynamicProfileRepository.findFieldById(fieldId);
    if (!before) throw ProfileError.notFound({ fieldId });

    // Changing field_type reinterprets every stored value — text "12" is not
    // number 12, and a select value may not exist in the new option set.
    // Allowed only while the field holds no data.
    if (input.field_type !== before.field_type) {
      const valueCount = await dynamicProfileRepository.countValuesForFields([fieldId]);
      if (valueCount > 0) {
        throw conflict(
          `${valueCount} stored values use this field — its type cannot be changed. Disable it and create a replacement.`,
        );
      }
    }

    // `key` is immutable and absent from the update schema.
    const after = await dynamicProfileRepository.updateField(
      fieldId,
      definedOnly(input as unknown as Record<string, unknown>),
    );

    await auditService.record({
      adminId, action: "update", entityType: "profile_field",
      entityId: fieldId, before, after,
    });

    const section = await dynamicProfileRepository.findSectionById(before.section_id);
    if (section) await this.invalidateBySection(section);
    return after;
  },

  async setFieldEnabled(adminId: string, fieldId: string, isEnabled: boolean): Promise<RawProfileField> {
    const before = await dynamicProfileRepository.findFieldById(fieldId);
    if (!before) throw ProfileError.notFound({ fieldId });

    const after = await dynamicProfileRepository.updateField(fieldId, { is_enabled: isEnabled });

    await auditService.record({
      adminId, action: isEnabled ? "enable" : "disable", entityType: "profile_field",
      entityId: fieldId, before, after,
    });

    const section = await dynamicProfileRepository.findSectionById(before.section_id);
    if (section) await this.invalidateBySection(section);
    return after;
  },

  async deleteField(adminId: string, fieldId: string): Promise<void> {
    const before = await dynamicProfileRepository.findFieldById(fieldId);
    if (!before) throw ProfileError.notFound({ fieldId });

    const valueCount = await dynamicProfileRepository.countValuesForFields([fieldId]);
    if (valueCount > 0) {
      throw conflict(`${valueCount} stored values use this field — disable it instead of deleting`);
    }

    await dynamicProfileRepository.deleteField(fieldId);

    await auditService.record({
      adminId, action: "delete", entityType: "profile_field",
      entityId: fieldId, before, after: null,
    });

    const section = await dynamicProfileRepository.findSectionById(before.section_id);
    if (section) await this.invalidateBySection(section);
  },

  async reorderFields(adminId: string, sectionId: string, input: ReorderInput): Promise<void> {
    const fields = await dynamicProfileRepository.findFieldsBySections([sectionId], true);
    const owned  = new Set(fields.map((field) => field.id));

    for (const item of input.items) {
      if (!owned.has(item.id)) throw conflict("field does not belong to this section");
    }

    await dynamicProfileRepository.setFieldOrder(input.items);

    await auditService.record({
      adminId, action: "reorder", entityType: "profile_field",
      entityId: sectionId,
      before: fields.map((f) => ({ id: f.id, display_order: f.display_order })),
      after:  input.items,
    });

    const section = await dynamicProfileRepository.findSectionById(sectionId);
    if (section) await this.invalidateBySection(section);
  },

  // ═══ Layout ═════════════════════════════════════════════════════════════════

  /** Admin read: includes inactive layouts so a disabled one is still editable. */
  async getLayout(profileTypeId: string, variant = "public"): Promise<RawProfileLayout | null> {
    return dynamicProfileRepository.findLayout(profileTypeId, variant, true);
  },

  /** Every variant for one type. Powers the layout editor's variant switcher. */
  async listLayouts(profileTypeId: string): Promise<RawProfileLayout[]> {
    return dynamicProfileRepository.findLayoutsByType(profileTypeId);
  },

  /**
   * Replaces the layout for one variant.
   *
   * Every key must resolve to a real, enabled section of this type, and no key
   * may appear twice. The renderer skips unknown keys, but the admin UI must
   * not be able to author them in the first place.
   */
  async saveLayout(adminId: string, profileTypeId: string, input: LayoutInput): Promise<RawProfileLayout> {
    const type = await profileTypeRepository.findById(profileTypeId);
    if (!type) throw ProfileError.notFound({ profileTypeId });

    const sections = await dynamicProfileRepository.findSectionsByType(profileTypeId, true);
    const enabled  = new Set(sections.filter((s) => s.is_enabled).map((s) => s.key));

    const all = [...input.layout.main, ...input.layout.sidebar];

    const seen = new Set<string>();
    for (const key of all) {
      if (seen.has(key)) throw conflict(`section "${key}" appears more than once in the layout`);
      seen.add(key);
      if (!enabled.has(key)) {
        throw conflict(`section "${key}" does not exist or is disabled for this profile type`);
      }
    }

    const before = await dynamicProfileRepository.findLayout(profileTypeId, input.variant, true);
    const after  = await dynamicProfileRepository.upsertLayout(
      profileTypeId,
      input.variant,
      input.layout,
      input.is_active,
    );

    await auditService.record({
      adminId, action: "update", entityType: "profile_layout",
      entityId: after.id, before, after,
      metadata: { profileTypeId, variant: input.variant },
    });

    invalidate(type.slug);
    return after;
  },

  // ─── internal ───────────────────────────────────────────────────────────────

  async invalidateBySection(section: RawProfileSection): Promise<void> {
    const type = await profileTypeRepository.findById(section.profile_type_id);
    invalidate(type?.slug);
  },
};

export type ProfileConfigService = typeof profileConfigService;
