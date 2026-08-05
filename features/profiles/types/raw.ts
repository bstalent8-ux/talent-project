// ─── Raw DB row shapes ────────────────────────────────────────────────────────
// One interface per table, mirroring the live schema exactly (snake_case).
// Repositories return these; only providers and services map them to DTOs.

export type ProfileTypeSlug = "talent" | "brand" | "agency";

export type ModerationStatus = "pending" | "approved" | "rejected" | "suspended";

export type SectionKind = "core" | "dynamic";

export type SectionVisibility = "public" | "authenticated" | "owner" | "admin";

export type DynamicFieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "multi_select"
  | "media"
  | "json";

// ─── profile_types ────────────────────────────────────────────────────────────

export interface RawProfileType {
  id:           string;
  slug:         string;
  name:         string;
  description:  string | null;
  name_ar:      string | null;
  name_en:      string | null;
  core_table:   string | null;
  provider_key: string | null;
  is_bookable:  boolean;
  route_prefix: string | null;
  is_active:    boolean;
  sort_order:   number;
}

// ─── profiles ─────────────────────────────────────────────────────────────────

export interface RawSharedProfile {
  id:              string;
  role:            string;
  full_name:       string | null;
  handle:          string | null;
  avatar_url:      string | null;
  city:            string | null;
  bio:             string | null;
  phone_number:    string | null;
  is_verified:     boolean | null;
  account_status:  string | null;
  brand_status:    string | null;
  created_at:      string;
  profile_type_id: string | null;
}

/**
 * `profiles` joined to `profile_types`. `profile_types` may be returned by
 * PostgREST as an object or a single-element array depending on the embed —
 * normalization happens in the repository, never in a consumer.
 */
export interface RawSharedProfileWithType extends RawSharedProfile {
  profile_types: RawProfileType | RawProfileType[] | null;
}

// ─── talent_profiles ──────────────────────────────────────────────────────────

export interface RawTalentCore {
  id:               string;
  user_id:          string;
  category:         string | null;
  specialties:      string[] | null;
  bio:              string | null;
  availability:     string | null;
  packages:         unknown;
  social_links:     Record<string, unknown> | null;
  profile_views:    number | null;
  avg_rating:       number | null;
  total_reviews:    number | null;
  total_bookings:   number | null;
  is_featured:      boolean | null;
  status:           ModerationStatus | null;
  approved_at:      string | null;
  approved_by:      string | null;
  rejection_reason: string | null;
}

// ─── brand_profiles ───────────────────────────────────────────────────────────

export interface RawBrandCore {
  id:               string;
  user_id:          string;
  category_id:      string | null;
  company_name:     string | null;
  industry:         string | null;
  website_url:      string | null;
  social_links:     Record<string, unknown> | null;
  profile_views:    number | null;
  status:           ModerationStatus | null;
  approved_at:      string | null;
  rejection_reason: string | null;
}

// ─── profile_sections / profile_fields / profile_values ───────────────────────

export interface RawProfileSection {
  id:               string;
  profile_type_id:  string;
  key:              string;
  title:            string;
  description:      string | null;
  title_ar:         string | null;
  title_en:         string | null;
  description_ar:   string | null;
  description_en:   string | null;
  display_order:    number;
  is_enabled:       boolean;
  kind:             SectionKind;
  weight:           number;
  visibility:       SectionVisibility;
  render_component: string | null;
  icon:             string | null;
}

export interface RawProfileField {
  id:                string;
  section_id:        string;
  key:               string;
  label:             string;
  label_ar:          string | null;
  label_en:          string | null;
  placeholder_ar:    string | null;
  placeholder_en:    string | null;
  help_text_ar:      string | null;
  help_text_en:      string | null;
  field_type:        DynamicFieldType;
  is_required:       boolean;
  validation_schema: Record<string, unknown> | null;
  options:           unknown;
  weight:            number;
  is_enabled:        boolean;
  display_order:     number;
}

export interface RawProfileValue {
  id:         string;
  profile_id: string;
  field_id:   string;
  value:      unknown;
}

export interface RawProfileLayout {
  id:              string;
  profile_type_id: string;
  variant:         string;
  layout:          Record<string, unknown> | null;
  is_active:       boolean;
}

// ─── Supporting rows loaded by providers ──────────────────────────────────────

export interface RawPortfolioRow {
  id:          string;
  url:         string | null;
  media_type:  string;
  caption:     string | null;
  sort_order:  number;
  is_approved: boolean;
}

export interface RawReviewRow {
  id:         string;
  booking_id: string;
  talent_id:  string;
  brand_id:   string;
  rating:     number;
  comment:    string | null;
  status:     string | null;
  created_at: string;
}

export interface RawTalentBrandRow {
  id:                string;
  brand_name:        string;
  logo_url:          string | null;
  year_collaborated: string | null;
  sort_order:        number | null;
}
