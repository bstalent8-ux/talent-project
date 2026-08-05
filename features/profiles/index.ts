import "server-only";

// ─── features/profiles — public surface ───────────────────────────────────────
// Controllers and server components import from here and nowhere deeper.
// Repositories are NOT re-exported: nothing outside this feature may talk to a
// repository directly.

export { profileService, createProfileService } from "./services/profile.service";
export type { ProfileService, ProfileServiceDeps } from "./services/profile.service";

export { dynamicProfileService } from "./services/dynamic-profile.service";

export { providerRegistry } from "./providers/registry";
export type { ProviderRegistry } from "./providers/registry";

export { ProfileError } from "./errors/profile-error";
export type { ProfileErrorCode, ProfileErrorBody } from "./errors/profile-error";

export type {
  ProfileProvider,
  ProviderMetadata,
  BookableProvider,
} from "./types/provider";

export type {
  Bilingual,
  BookingStatsDTO,
  BookingTarget,
  BrandPrivateCore,
  BrandPublicCore,
  CompletionDTO,
  CompletionSectionDTO,
  DynamicFieldDTO,
  DynamicValidationResult,
  PrivateProfileDTO,
  ProfileLayoutDTO,
  ProfileSectionDTO,
  ProviderMetadataDTO,
  ProviderRef,
  PublicProfileDTO,
  SharedIdentityDTO,
  TalentPrivateCore,
  TalentPublicCore,
  UpdateProfileInput,
} from "./types/dto";
