import "server-only";

// ─── Generic profile provider ─────────────────────────────────────────────────
// Stage 0 of the Admin-Driven Fully Dynamic Profile System.
//
// Every OTHER provider (talent.provider.ts, brand.provider.ts) is a static
// singleton that knows a real typed table. This one is a FACTORY: it is built
// per-request from a `profile_types` row that has `core_table IS NULL` — the
// DB-level signal, set the moment an admin creates a type through
// profileConfigService.createType(), that "this type has no typed core and is
// fully generic."
//
// It is deliberately NOT registered in providers/registry.ts. Talent and brand
// must keep winning through their own static Map lookup, unaffected by this
// file's existence — see resolveContext() in profile.service.ts, the only
// caller, which tries the registry first and falls back to
// createGenericProvider() only when the registry has nothing for the slug AND
// the resolved profile_types row proves it is meant to be generic.
//
// NOT BOOKABLE, ever, regardless of `profile_types.is_bookable`. The real
// booking-creation route (POST /api/bookings/direct) hard-queries
// `talent_profiles` directly — it does not go through this provider layer at
// all — so a generic type could never actually be booked no matter what this
// file did. `resolveBookingTarget` is omitted entirely (mirrors
// brand.provider.ts's own "not bookable" pattern) so asking a generic profile
// for a booking target is a compile error, not a runtime one.

import { hasSectionContent } from "../content/section-content";
import { dynamicProfileService } from "../services/dynamic-profile.service";
import type {
  CompletionGateDTO,
  CompletionSectionDTO,
  CoreSectionState,
  DynamicValidationResult,
  GenericPrivateCore,
  GenericPublicCore,
  ProfileSectionDTO,
} from "../types/dto";
import type {
  ProfileProvider,
  ProviderLoadInput,
  ProviderMetadata,
  PrivateCoreResult,
} from "../types/provider";
import type { RawProfileType } from "../types/raw";

const GENERIC_CORE: GenericPublicCore = { kind: "generic" };

/**
 * Builds a provider for one `profile_types` row. Cheap and side-effect free —
 * safe to call once per request, no caching needed (the schema cache in
 * dynamic-profile.service.ts already caches the expensive part).
 */
export function createGenericProvider(
  type: RawProfileType,
): ProfileProvider<Record<string, never>, GenericPublicCore, GenericPrivateCore> {
  const meta: ProviderMetadata = {
    typeSlug:    type.slug,
    coreTable:   "(none — generic type)",
    // Always false. Stage 0 scope: see file header. A future Stage that
    // generalizes the booking pipeline is a separate, larger decision.
    bookable:    false,
    routePrefix: type.route_prefix ?? type.slug,
    label:       { ar: type.name_ar ?? type.name, en: type.name_en ?? type.name },
    // No typed core columns exist, so nothing is writable through the core
    // path. Dynamic values are the only write surface (dynamicProfileService).
    writableCoreFields: [],
  };

  return {
    meta,

    async loadCore() {
      return {};
    },

    async getPublicProfile(_input: ProviderLoadInput) {
      // No moderation/approval concept exists for a generic type yet — every
      // profile of this type is publicly visible once its owning `profiles`
      // row passes the shared account_status gate (already checked by
      // ProfileService before this is ever called). Stage 0 is
      // public-profile-only, not a moderation system.
      return GENERIC_CORE;
    },

    async getPrivateProfile(_input: ProviderLoadInput): Promise<PrivateCoreResult<GenericPrivateCore>> {
      return {
        core: GENERIC_CORE,
        moderation: { status: null, rejectionReason: null, approvedAt: null },
      };
    },

    async updateProfile() {
      // No typed core to write. Dynamic values go through
      // dynamicProfileService.saveValues() via ProfileService.updateProfile's
      // `dynamic` branch, not through here.
    },

    async getSections(): Promise<ProfileSectionDTO[]> {
      return dynamicProfileService.getSectionDefinitions(meta.typeSlug);
    },

    hasContent(section, profile) {
      // Every section a generic type can have is kind==="dynamic" (a type with
      // no core table can never have a kind==="core" section — nothing would
      // back it). hasSectionContent's dynamic branch is fully generic already;
      // no per-type rule table entry is needed here or ever will be.
      return hasSectionContent(meta.typeSlug, section, profile);
    },

    async getCompletion(): Promise<CoreSectionState> {
      // No core sections exist to score. Dynamic-field weights are not wired
      // into completion scoring anywhere yet (true for talent's equipment/
      // awards today too — see lib/profile-completion.ts), so a generic
      // profile's completion score is honestly 0/0 until that lands.
      return {};
    },

    async getCoreCompletionSections(): Promise<Array<Omit<CompletionSectionDTO, "done" | "progress">>> {
      return [];
    },

    async getCompletionGates(): Promise<Array<Omit<CompletionGateDTO, "passed">>> {
      // No type-specific features (job applications, briefs) are defined for
      // an arbitrary admin-created type yet.
      return [];
    },

    async validateDynamicFields({ values }): Promise<DynamicValidationResult> {
      return dynamicProfileService.validate(meta.typeSlug, values);
    },

    // resolveBookingTarget intentionally omitted — meta.bookable is false.
  };
}
