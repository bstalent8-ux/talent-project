import "server-only";

// ─── ProfileService ───────────────────────────────────────────────────────────
// Orchestration. Resolves the profile type, picks a provider, fans out with
// Promise.all, assembles the DTO, translates every failure into a ProfileError.
//
// Knows no table names. Never branches on `role`. Never touches HTTP.
//
// AUTHORIZATION IS NOT HERE. `getUser()` and every role/ownership check stay in
// the route handlers — RLS is bypassed on service-role reads, so moving authZ
// during the same phase that moves data access would create two authorization
// surfaces mid-migration.

import { ProfileError } from "../errors/profile-error";
import { providerRegistry } from "../providers/registry";
import { profileRepository, type IdentityRow } from "../repositories/profile.repository";
import { providerRefRepository } from "../repositories/provider-ref.repository";
import { dynamicProfileService } from "./dynamic-profile.service";
import type {
  AnyPrivateCore,
  AnyPublicCore,
  BookingTarget,
  CompletionDTO,
  CompletionSectionDTO,
  PrivateProfileDTO,
  ProfileSectionDTO,
  ProviderMetadataDTO,
  ProviderRef,
  PublicProfileDTO,
  SharedIdentityDTO,
  UpdateProfileInput,
  UpdateSharedInput,
} from "../types/dto";
import type { ProfileProvider, ProviderMetadata } from "../types/provider";
import type { RawProfileType, RawSharedProfile } from "../types/raw";

// ─── Dependencies (constructor injection with a production default) ───────────

export interface ProfileServiceDeps {
  registry:       typeof providerRegistry;
  profiles:       typeof profileRepository;
  providerRefs:   typeof providerRefRepository;
  dynamic:        typeof dynamicProfileService;
}

const defaultDeps: ProfileServiceDeps = {
  registry:     providerRegistry,
  profiles:     profileRepository,
  providerRefs: providerRefRepository,
  dynamic:      dynamicProfileService,
};

// ─── Shared identity columns a user may write ─────────────────────────────────
// Identical to PROFILE_FIELDS in app/api/profile/route.ts:14, minus phone
// aliases which that route handles separately.

const WRITABLE_SHARED_FIELDS = [
  "handle", "full_name", "avatar_url", "city", "bio", "phone_number",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIdentityDTO(profile: RawSharedProfile, typeSlug: string): SharedIdentityDTO {
  return {
    id:         profile.id,
    handle:     profile.handle,
    fullName:   profile.full_name,
    avatarUrl:  profile.avatar_url,
    city:       profile.city,
    bio:        profile.bio,
    isVerified: Boolean(profile.is_verified),
    createdAt:  profile.created_at,
    typeSlug,
  };
}

/** `coreTable` is deliberately dropped — DTOs must not leak table names. */
function toMetaDTO(meta: ProviderMetadata): ProviderMetadataDTO {
  return {
    typeSlug:    meta.typeSlug,
    label:       meta.label,
    routePrefix: meta.routePrefix,
    bookable:    meta.bookable,
  };
}

function pick(src: unknown, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (src && typeof src === "object") {
    for (const key of keys) {
      if (key in (src as Record<string, unknown>)) out[key] = (src as Record<string, unknown>)[key];
    }
  }
  return out;
}

/**
 * Type detection.
 *
 * Primary: `profiles.profile_type_id` → `profile_types.slug` (Phase 1).
 * Fallback: `profiles.role`, because a single row missed by the Phase 1
 * backfill would otherwise 500 a profile page. Every fallback logs a WARN;
 * dropping trg_sync_profile_type in Phase 4 requires zero warnings for 7 days
 * (PROFILE_ADAPTER_PHASE2.md AC-12).
 */
function resolveTypeSlug(identity: IdentityRow): string | null {
  const fromType = unwrapSlug(identity.type);
  if (fromType) return fromType;

  const role = identity.profile.role;
  const fallback =
    role === "talent" ? "talent"
    : role === "brand" || role === "client" ? "brand"
    : null;

  if (fallback) {
    console.warn(
      "[profiles] profile_type_id missing, fell back to role",
      { profileId: identity.profile.id, role },
    );
  }

  return fallback;
}

function unwrapSlug(type: RawProfileType | null): string | null {
  return type?.slug ?? null;
}

/** Admins have no public profile by design (Phase 1, step 2). */
function isPublicallyVisible(profile: RawSharedProfile): boolean {
  return profile.account_status === "active" || profile.account_status == null;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createProfileService(overrides: Partial<ProfileServiceDeps> = {}) {
  const deps: ProfileServiceDeps = { ...defaultDeps, ...overrides };

  /** Identity + provider, or a ProfileError. Shared by every entry point. */
  async function resolveContext(identity: IdentityRow | null): Promise<{
    identity: IdentityRow;
    typeSlug: string;
    provider: ProfileProvider<any, any, any>;
  }> {
    if (!identity) throw ProfileError.notFound();

    const typeSlug = resolveTypeSlug(identity);
    // An admin (or any typeless profile) has no profile surface. NOT_FOUND, not
    // an error — and identical to a nonexistent handle, so the API cannot be
    // used as a moderation-status oracle.
    if (!typeSlug) throw ProfileError.notFound({ profileId: identity.profile.id, reason: "no profile type" });

    const provider = deps.registry.resolve(typeSlug);
    return { identity, typeSlug, provider };
  }

  async function buildPublic(identity: IdentityRow): Promise<PublicProfileDTO> {
    const ctx = await resolveContext(identity);
    const { profile } = ctx.identity;

    if (!isPublicallyVisible(profile)) throw ProfileError.notFound({ profileId: profile.id });

    // One parallel wave. Dynamic + layout are type-agnostic and run for every
    // profile type without the provider knowing they exist.
    const [core, sections, layout] = await Promise.all([
      ctx.provider.getPublicProfile({ shared: profile }),
      deps.dynamic.getSectionsForProfile(profile.id, ctx.typeSlug, "public"),
      deps.dynamic.getLayout(ctx.typeSlug),
    ]);

    // The provider's public gate failed (unapproved / suspended). Same
    // NOT_FOUND as a missing profile, deliberately.
    if (!core) throw ProfileError.notFound({ profileId: profile.id, reason: "failed public gate" });

    return {
      identity:   toIdentityDTO(profile, ctx.typeSlug),
      meta:       toMetaDTO(ctx.provider.meta),
      core:       core as AnyPublicCore,
      sections:   mergeSections(sections),
      layout,
      isBookable: ctx.provider.meta.bookable,
    };
  }

  /**
   * Merge order is fixed: shared identity → provider core → dynamic.
   * A dynamic section whose key collides with a core section is dropped and
   * logged rather than overwriting it.
   */
  function mergeSections(sections: ProfileSectionDTO[]): ProfileSectionDTO[] {
    const seen = new Set<string>();
    const out: ProfileSectionDTO[] = [];

    for (const section of sections) {
      if (seen.has(section.key)) {
        console.warn("[profiles] duplicate section key dropped", { key: section.key });
        continue;
      }
      seen.add(section.key);
      out.push(section);
    }

    return out.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async function buildCompletion(
    provider: ProfileProvider<any, any, any>,
    profile: RawSharedProfile,
  ): Promise<CompletionDTO> {
    const core = await provider.loadCore(profile.id);

    const [state, descriptors] = await Promise.all([
      provider.getCompletion({ shared: profile, core }),
      provider.getCoreCompletionSections(),
    ]);

    const sections: CompletionSectionDTO[] = descriptors.map((d) => ({
      ...d,
      done: state[d.key] === true,
    }));

    // Normalized so the achievable maximum is always exactly 100, which keeps
    // zero-weight sections (e.g. talent "payment") harmless.
    const totalWeight = sections.reduce((acc, s) => acc + s.weight, 0);
    const earned      = sections.reduce((acc, s) => acc + (s.done ? s.weight : 0), 0);
    const score       = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

    return {
      score,
      sections,
      // TODO(phase-3): read profile_completion_rules and report real gates.
      gates:      [],
      computedAt: new Date().toISOString(),
    };
  }

  return {
    // ─── Public reads ───────────────────────────────────────────────────────

    async getPublicProfileByHandle(handle: string): Promise<PublicProfileDTO> {
      return buildPublic(await deps.profiles.findIdentityByHandle(handle));
    },

    async getPublicProfileById(profileId: string): Promise<PublicProfileDTO> {
      return buildPublic(await deps.profiles.findIdentityById(profileId));
    },

    // ─── Owner reads ────────────────────────────────────────────────────────

    /** Caller MUST have already verified that userId is the signed-in user. */
    async getOwnProfile(userId: string): Promise<PrivateProfileDTO> {
      const ctx = await resolveContext(await deps.profiles.findIdentityByUserId(userId));
      const { profile } = ctx.identity;

      const [result, sections, completion] = await Promise.all([
        ctx.provider.getPrivateProfile({ shared: profile }),
        deps.dynamic.getSectionsForProfile(profile.id, ctx.typeSlug, "owner"),
        buildCompletion(ctx.provider, profile),
      ]);

      if (!result) throw ProfileError.notFound({ profileId: profile.id, reason: "core row missing" });

      return {
        identity:   toIdentityDTO(profile, ctx.typeSlug),
        meta:       toMetaDTO(ctx.provider.meta),
        core:       result.core as AnyPrivateCore,
        sections:   mergeSections(sections),
        completion,
        moderation: result.moderation,
      };
    },

    async getCompletion(profileId: string): Promise<CompletionDTO> {
      const ctx = await resolveContext(await deps.profiles.findIdentityById(profileId));
      return buildCompletion(ctx.provider, ctx.identity.profile);
    },

    async getSections(typeSlug: string): Promise<ProfileSectionDTO[]> {
      return deps.registry.resolve(typeSlug).getSections();
    },

    // ─── Writes ─────────────────────────────────────────────────────────────

    /**
     * Caller MUST have already verified ownership.
     *
     * Ordering is deliberate: validation completes before ANY write, and the
     * least damaging write (dynamic values) goes last. There is no transaction
     * across profiles / core table / profile_values — PostgREST cannot span
     * statements. That partial-write risk is identical to today's
     * app/api/profile/route.ts and is accepted for Phase 2.
     */
    async updateProfile(userId: string, input: UpdateProfileInput): Promise<PrivateProfileDTO> {
      const ctx = await resolveContext(await deps.profiles.findIdentityByUserId(userId));
      const { profile } = ctx.identity;

      // 1. Validate everything first.
      const validation = input.dynamic
        ? await ctx.provider.validateDynamicFields({ values: input.dynamic })
        : { ok: true as const, errors: [], sanitized: {} };

      if (!validation.ok) throw ProfileError.validation(validation.errors);

      // 2. Shared identity.
      const sharedPatch = pick(input.shared as UpdateSharedInput, WRITABLE_SHARED_FIELDS);
      if (Object.keys(sharedPatch).length > 0) {
        await deps.profiles.updateShared(profile.id, sharedPatch);
      }

      // 3. Typed core. Filtered here AND again inside the provider.
      if (input.core) {
        const corePatch = pick(input.core, ctx.provider.meta.writableCoreFields);
        if (Object.keys(corePatch).length > 0) {
          await ctx.provider.updateProfile({ profileId: profile.id, corePatch });
        }
      }

      // 4. Dynamic values.
      if (Object.keys(validation.sanitized).length > 0) {
        await deps.dynamic.saveValues(profile.id, ctx.typeSlug, validation.sanitized);
      }

      // TODO(part-2): invalidate lib/cache tags here once controllers migrate.
      return this.getOwnProfile(userId);
    },

    // ─── Migration-window plumbing ──────────────────────────────────────────
    // These three exist so Class B controllers can drop their direct
    // talent_profiles / brand_profiles queries WITHOUT changing their response
    // payloads. They expose the provider's existing methods and add no
    // behaviour of their own.
    //
    // TODO(part-3): remove once every consumer reads a DTO instead of a raw
    // row. Do NOT use them in new code.

    /**
     * Raw core row for a profile, with the resolved type so the caller can tell
     * a talent row from a brand row.
     *
     * Returns null — never throws — for a profile with no type (admins) or no
     * core row, because callers like GET /api/me must keep returning a 200 with
     * a null profile in exactly those cases.
     */
    async loadCoreRow(profileId: string): Promise<{ typeSlug: string; core: unknown } | null> {
      const identity = await deps.profiles.findIdentityById(profileId);
      if (!identity) return null;

      const typeSlug = resolveTypeSlug(identity);
      if (!typeSlug || !deps.registry.hasProvider(typeSlug)) return null;

      const core = await deps.registry.resolve(typeSlug).loadCore(profileId);
      if (!core) return null;

      return { typeSlug, core };
    },

    /**
     * Upserts the typed core row for a user, routing by their resolved profile
     * type. The patch is filtered against the provider's writableCoreFields.
     *
     * Used by create-or-update controllers that manage the shared `profiles`
     * row themselves (POST /api/profile runs during signup, before a full
     * profile exists).
     */
    async updateCoreForUser(userId: string, corePatch: Record<string, unknown>): Promise<void> {
      const identity = await deps.profiles.findIdentityByUserId(userId);
      if (!identity) throw ProfileError.notFound({ profileId: userId });

      const typeSlug = resolveTypeSlug(identity);
      if (!typeSlug) throw ProfileError.notFound({ profileId: userId, reason: "no profile type" });

      const provider = deps.registry.resolve(typeSlug);
      const patch    = pick(corePatch, provider.meta.writableCoreFields);
      if (Object.keys(patch).length === 0) return;

      await provider.updateProfile({ profileId: userId, corePatch: patch });
    },

    /**
     * Reverse lookup: a provider row id (talent_profiles.id) → the owning
     * profile id. For admin surfaces that address a talent by its core row id.
     */
    async resolveProviderOwner(providerProfileId: string, typeSlug: string): Promise<string | null> {
      const ref = await deps.providerRefs.resolveRefByProviderProfileId(providerProfileId, typeSlug);
      return ref?.profileId ?? null;
    },

    // ─── Class A: reference resolution ──────────────────────────────────────

    /**
     * "What is this user's provider row id?" — one indexed query.
     * Deliberately NOT a profile load and deliberately NOT cached: it backs
     * ownership checks, where a stale entry is an authorization bug.
     */
    async resolveProviderRef(userId: string): Promise<ProviderRef | null> {
      const identity = await deps.profiles.findIdentityByUserId(userId);
      if (!identity) return null;

      const typeSlug = resolveTypeSlug(identity);
      if (!typeSlug) return null;

      return deps.providerRefs.resolveRef(userId, typeSlug);
    },

    /**
     * Booking target for a provider profile.
     * Throws NOT_BOOKABLE for a registered-but-unbookable type (brand), and
     * NOT_FOUND when the provider's own gate rejects (e.g. talent not approved)
     * — the controller maps that to the same 403 it returns today.
     */
    async resolveBookingTarget(profileId: string): Promise<BookingTarget> {
      const identity = await deps.profiles.findIdentityById(profileId);
      if (!identity) throw ProfileError.notFound();

      const typeSlug = resolveTypeSlug(identity);
      if (!typeSlug) throw ProfileError.notFound({ profileId });

      const provider = deps.registry.resolveBookable(typeSlug);
      const target   = await provider.resolveBookingTarget(profileId);

      if (!target) throw ProfileError.forbidden({ profileId, reason: "provider booking gate" });
      return target;
    },
  };
}

/** Production singleton. Tests construct their own with createProfileService({...}). */
export const profileService = createProfileService();

export type ProfileService = ReturnType<typeof createProfileService>;
