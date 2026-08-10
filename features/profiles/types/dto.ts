// ─── Response DTOs ────────────────────────────────────────────────────────────
// Everything the service layer hands back. camelCase, no table names, no raw
// DB error text. Safe to serialize to a client.

import type { DynamicFieldType, ModerationStatus } from "./raw";
import type { LayoutEntry } from "../content/layout-entries";

export interface Bilingual {
  ar: string;
  en: string;
}

// ─── Shared identity ──────────────────────────────────────────────────────────

export interface SharedIdentityDTO {
  id:         string;
  handle:     string | null;
  fullName:   string | null;
  avatarUrl:  string | null;
  city:       string | null;
  bio:        string | null;
  isVerified: boolean;
  createdAt:  string;
  typeSlug:   string;
}

/**
 * Provider facts that are safe to expose. `coreTable` is deliberately absent —
 * DTOs cross to the client and must never leak table names.
 */
export interface ProviderMetadataDTO {
  typeSlug:    string;
  label:       Bilingual;
  routePrefix: string;
  bookable:    boolean;
}

// ─── Dynamic sections ─────────────────────────────────────────────────────────

export interface DynamicFieldOptionDTO {
  value: string;
  label: Bilingual;
}

export interface DynamicFieldDTO {
  key:          string;
  label:        Bilingual;
  placeholder:  Bilingual | null;
  helpText:     Bilingual | null;
  fieldType:    DynamicFieldType;
  isRequired:   boolean;
  options:      DynamicFieldOptionDTO[];
  /** Present on private DTOs only — the edit form needs it, viewers do not. */
  validation?:  Record<string, unknown>;
  value:        unknown | null;
  displayOrder: number;
}

export interface ProfileSectionDTO {
  key:             string;
  title:           Bilingual;
  description:     Bilingual | null;
  kind:            "core" | "dynamic";
  renderComponent: string | null;
  icon:            string | null;
  displayOrder:    number;
  /** Always empty for kind === "core". */
  fields:          DynamicFieldDTO[];
}

/**
 * Stage 1: each slot is an array of normalized entries (key + width), not raw
 * strings. A layout with no admin-set width still round-trips — every entry's
 * `width` defaults to "full" whether the DB row stored a plain key string or
 * an explicit object. See features/profiles/content/layout-entries.ts.
 */
export interface ProfileLayoutDTO {
  main:    LayoutEntry[];
  sidebar: LayoutEntry[];
}

// ─── Completion ───────────────────────────────────────────────────────────────

export interface CompletionSectionDTO {
  key:    string;
  label:  Bilingual;
  weight: number;
  done:   boolean;
  href:   string;
  /**
   * How far through this section the user is, 0..1. DISPLAY ONLY — the score is
   * computed from `done`, not from this.
   *
   * A section like "social" is satisfied by one handle but has four slots, so a
   * binary state can only say "not started", which reads as no progress to
   * someone who has filled two of them. Keeping it out of the score means adding
   * this number moves nobody's percentage.
   */
  progress: number;
}

export interface CompletionGateDTO {
  key:      string;
  minScore: number;
  passed:   boolean;
  enforced: boolean;
}

export interface CompletionDTO {
  score:      number;
  sections:   CompletionSectionDTO[];
  gates:      CompletionGateDTO[];
  computedAt: string;
}

/**
 * Provider output for core sections: section key → satisfied.
 *
 * A bare boolean is the whole answer for a section with no middle state (an
 * avatar is uploaded or it is not). The object form adds a display-only 0..1
 * ratio for sections that have many slots but are satisfied by the first one.
 *
 * `done` and `progress` are INDEPENDENT on purpose. A talent with one portfolio
 * item is done (that is the shipped rule, and the score must not move) while
 * being a third of the way to a portfolio that looks intentional. Deriving one
 * from the other would silently re-score every existing profile.
 */
export type CoreSectionState = Record<string, boolean | { done: boolean; progress: number }>;

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface BookingTarget {
  providerType:      string;
  providerProfileId: string;
  providerUserId:    string;
  /** Non-null ONLY for the talent provider. The backward-compatibility hinge. */
  legacyTalentId:    string | null;
}

/** Class A replacement — a lookup, deliberately not a profile load. */
export interface ProviderRef {
  profileId:         string;
  typeSlug:          string;
  providerProfileId: string;
}

// ─── Type-specific cores ──────────────────────────────────────────────────────

export interface PackageItemDTO {
  id:       string;
  name:     string;
  price:    string;
  popular:  boolean;
  features: string[];
}

export interface PortfolioItemDTO {
  id:         string;
  url:        string | null;
  mediaType:  string;
  caption:    string | null;
  sortOrder:  number;
  isApproved: boolean;
}

export interface ReviewItemDTO {
  id:        string;
  author:    string;
  rating:    number;
  text:      string;
  createdAt: string;
}

export interface TalentBrandDTO {
  id:               string;
  name:             string;
  logoUrl:          string | null;
  yearCollaborated: string | null;
  sortOrder:        number;
}

export interface BookingStatsDTO {
  total:     number;
  completed: number;
  pending:   number;
  cancelled: number;
}

export interface TalentPublicCore {
  kind:          "talent";
  category:      string | null;
  specialties:   string[];
  availability:  string | null;
  packages:      PackageItemDTO[];
  socialLinks:   Record<string, unknown>;
  rating:        number;
  reviewCount:   number;
  totalBookings: number;
  views:         string;
  isFeatured:    boolean;
  portfolio:     PortfolioItemDTO[];
  reviews:       ReviewItemDTO[];
  brands:        TalentBrandDTO[];
  /**
   * Public: the talent page already renders these counts to guests today
   * (fetchBookingStatsByTalentId, app/(main)/talent/[handle]/page.tsx:41).
   */
  bookingStats:  BookingStatsDTO;
}

export type TalentPrivateCore = TalentPublicCore;

export interface BrandPublicCore {
  kind:        "brand";
  companyName: string | null;
  industry:    string | null;
  websiteUrl:  string | null;
  categoryId:  string | null;
  socialLinks: Record<string, unknown>;
  isApproved:  boolean;
}

export interface BrandPrivateCore extends BrandPublicCore {
  profileViews: number;
}

/**
 * Stage 0: the core payload for a profile type with no typed core table
 * (`profile_types.core_table IS NULL`). Carries nothing — a generic type's
 * entire content lives in its dynamic sections/fields, never in a typed
 * column. See features/profiles/providers/generic.provider.ts.
 */
export interface GenericPublicCore {
  kind: "generic";
}

export type GenericPrivateCore = GenericPublicCore;

export type AnyPublicCore  = TalentPublicCore  | BrandPublicCore  | GenericPublicCore;
export type AnyPrivateCore = TalentPrivateCore | BrandPrivateCore | GenericPrivateCore;

// ─── Composite ────────────────────────────────────────────────────────────────

export interface PublicProfileDTO {
  identity:   SharedIdentityDTO;
  meta:       ProviderMetadataDTO;
  core:       AnyPublicCore;
  sections:   ProfileSectionDTO[];
  layout:     ProfileLayoutDTO;
  isBookable: boolean;
}

export interface ModerationDTO {
  status:          ModerationStatus | null;
  rejectionReason: string | null;
  approvedAt:      string | null;
}

export interface PrivateProfileDTO {
  identity:   SharedIdentityDTO;
  meta:       ProviderMetadataDTO;
  core:       AnyPrivateCore;
  sections:   ProfileSectionDTO[];
  completion: CompletionDTO;
  moderation: ModerationDTO;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface UpdateSharedInput {
  full_name?:  string | null;
  handle?:     string | null;
  avatar_url?: string | null;
  city?:       string | null;
  bio?:        string | null;
}

export interface UpdateProfileInput {
  shared?:  UpdateSharedInput;
  /** Filtered against provider.meta.writableCoreFields before it reaches the DB. */
  core?:    Record<string, unknown>;
  /** sectionKey → { fieldKey → value } */
  dynamic?: Record<string, Record<string, unknown>>;
}

export interface DynamicValidationError {
  sectionKey: string;
  fieldKey:   string;
  message:    Bilingual;
}

export interface DynamicValidationResult {
  ok:     boolean;
  errors: DynamicValidationError[];
  /** Only populated when ok === true. sectionKey → { fieldKey → value } */
  sanitized: Record<string, Record<string, unknown>>;
}
