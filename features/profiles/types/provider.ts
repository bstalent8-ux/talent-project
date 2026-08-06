// ─── ProfileProvider ──────────────────────────────────────────────────────────
// The contract every profile type implements. The ONLY layer allowed to know
// that talent_profiles / brand_profiles exist.
//
// A provider never touches HTTP, auth, caching, or another provider.

import type {
  AnyPrivateCore,
  AnyPublicCore,
  BookingTarget,
  CompletionSectionDTO,
  CoreSectionState,
  DynamicValidationResult,
  ProfileSectionDTO,
  ModerationDTO,
  PublicProfileDTO,
  Bilingual,
} from "./dto";
import type { RawSharedProfile } from "./raw";

/** Immutable provider facts, readable with no I/O. */
export interface ProviderMetadata {
  readonly typeSlug:    string;
  /** Audit/logging only. Callers must never use this to build a query. */
  readonly coreTable:   string;
  readonly bookable:    boolean;
  readonly routePrefix: string;
  readonly label:       Bilingual;
  /**
   * The ONLY core columns a user may write. Copied byte-for-byte from the
   * existing consts in app/api/profile/route.ts so Phase 2 changes nothing.
   */
  readonly writableCoreFields: readonly string[];
}

export interface ProviderLoadInput {
  shared: RawSharedProfile;
}

export interface ProviderCompletionInput<TCore = unknown> {
  shared: RawSharedProfile;
  core:   TCore;
}

/** What a provider returns for a private view, alongside the core payload. */
export interface PrivateCoreResult<TPrivate = AnyPrivateCore> {
  core:       TPrivate;
  moderation: ModerationDTO;
}

export interface ProfileProvider<
  TCoreRow  = unknown,
  TPublic   = AnyPublicCore,
  TPrivate  = AnyPrivateCore,
> {
  readonly meta: ProviderMetadata;

  /** Raw core row for this profile, or null when it does not exist. */
  loadCore(profileId: string): Promise<TCoreRow | null>;

  /**
   * Guest-visible view model. Returns null when the profile fails this type's
   * public gate (talent/brand: status !== "approved"). Centralizing the gate
   * here is what stops each public route from having to remember it —
   * CLAUDE.md §8 requires reapplying public filters in code because RLS is
   * bypassed on service-role reads.
   */
  getPublicProfile(input: ProviderLoadInput): Promise<TPublic | null>;

  /** Owner's own view: includes moderation state and unapproved child rows. */
  getPrivateProfile(input: ProviderLoadInput): Promise<PrivateCoreResult<TPrivate> | null>;

  /**
   * Upsert the typed core row. `corePatch` has already been filtered against
   * meta.writableCoreFields by ProfileService; the provider filters again as
   * defence in depth — this write goes through the service role.
   */
  updateProfile(input: { profileId: string; corePatch: Record<string, unknown> }): Promise<void>;

  /** Section definitions for this type. Definitions only, never user values. */
  getSections(): Promise<ProfileSectionDTO[]>;

  /**
   * Does this section have anything worth rendering for this profile?
   *
   * Owned by the provider, NOT by each component: a component that decides its
   * own visibility can only hide its body, leaving the heading and card chrome
   * behind, and every new component has to remember the rule again. Asking here
   * lets ProfileService drop the section from the DTO entirely, so the renderer
   * stays generic and the payload never carries sections nobody sees.
   *
   * Synchronous and side-effect free — it runs once per section per render.
   */
  hasContent(section: ProfileSectionDTO, profile: PublicProfileDTO): boolean;

  /** Evaluates CORE sections only. Dynamic sections are scored generically. */
  getCompletion(input: ProviderCompletionInput<TCoreRow>): Promise<CoreSectionState>;

  /** Descriptors for this type's core sections, used to build a CompletionDTO. */
  getCoreCompletionSections(): Promise<Array<Omit<CompletionSectionDTO, "done">>>;

  /** Compiles profile_fields to a schema and validates. Never throws. */
  validateDynamicFields(input: {
    values: Record<string, Record<string, unknown>>;
  }): Promise<DynamicValidationResult>;

  /** Present only when meta.bookable === true. */
  resolveBookingTarget?(profileId: string): Promise<BookingTarget | null>;
}

/** A provider statically known to be bookable. */
export type BookableProvider = ProfileProvider & {
  resolveBookingTarget: NonNullable<ProfileProvider["resolveBookingTarget"]>;
};
