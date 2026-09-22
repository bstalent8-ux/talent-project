// ─── Raw DB shapes ───────────────────────────────────────────────────────────

export interface RawProfile {
  id: string;
  full_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  is_verified?: boolean | null;
  talent_profiles: RawTalentProfile | RawTalentProfile[] | null;
}

export type TalentStatus = "pending" | "approved" | "rejected" | "suspended";

export interface RawTalentProfile {
  id: string;
  user_id: string;
  category: string | null;
  specialties: string[] | null;
  bio: string | null;
  availability: string | null;
  packages: unknown;
  social_links: Record<string, unknown> | null;
  profile_views: number | null;
  avg_rating: number | null;
  total_reviews: number | null;
  total_bookings: number | null;
  is_featured: boolean | null;
  status: TalentStatus | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
}

export interface RawPortfolioItem {
  id: string;
  url: string | null;
  media_type: string;
  caption: string | null;
  sort_order: number;
  is_approved: boolean;
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface CampaignStats {
  views: string;
  ctr: string;
  sales_increase: string;
  repeat: string;
}

export interface FeaturedCampaign {
  name: string;
  ctr_before: string;
  ctr_after: string;
  growth: string;
}

export interface ExperienceItem {
  /** Stable per-entry key for the wizard's add/edit/delete UI. Older admin-entered
   * rows (pre this field) don't have one — the adapter backfills it on read. */
  id?: string;
  name: string;
  /** Legacy free-text year, still read for old entries; new entries leave it empty
   * in favor of `deliveredAt`. */
  year: string;
  /** `true` only when an admin has checked this entry — never settable by the
   * talent (see POST /api/profile/complete's "experience" section, which always
   * overwrites this from the previously-stored value, ignoring whatever the
   * client sends). */
  verified: boolean;
  description?: string | null;
  /** Free text, e.g. "أسبوعين" / "3 days" — execution time, not a date. */
  duration?: string | null;
  /** Free text delivery date or window. */
  deliveredAt?: string | null;
  /** What was handed over, e.g. "3 short videos". */
  deliverable?: string | null;
  /** The talent's own upload for this entry — takes priority over a name-match
   * against talent_brands' logo (see findBrandLogo() in UgcPreviousShoots). */
  logoUrl?: string | null;
}

export interface Review {
  id: string;
  author: string;
  brand: string;
  rating: number;
  text: string;
  date: string;
}

export interface RawReview {
  id: string;
  booking_id: string;
  talent_id: string;
  brand_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
}

export interface BrandItem {
  id: string;
  name: string;
  logo_url?: string | null;
  year_collaborated?: string | null;
  sort_order: number;
  verified?: boolean;
}

export interface PackageItem {
  id: string;
  name: string;
  price: string;
  popular: boolean;
  features: string[];
  /** Admin-set, optional. One of PackagesSection.tsx's PACKAGE_ICON_MAP keys
   * ("sun"|"diamond"|"gem"|"crown"|"rocket") — an unrecognized or missing
   * value falls back to the default star, never a broken render. */
  icon?: string;
}

export interface AddonItem {
  key: string;
  label: string;
  price: number;
}

export interface PortfolioItem {
  id: string;
  url: string | null;
  media_type: string;
  caption: string | null;
  sort_order: number;
  created_at?: string;
}

export interface TalentData {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  title: string;
  location: string;
  memberSince: string;
  /** Full ISO timestamp behind `memberSince` — same source (identity.createdAt),
   * kept as a real date for Career Timeline instead of re-parsing the display string. */
  registeredAt?: string | null;
  rating: number;
  reviewCount: number;
  views: string;
  verified: boolean;
  fastResponse: boolean;
  premium: boolean;
  bio?: string | null;
  specialties?: string[];
  category?: string | null;
  /** Hero-adjacent identity line (public UGC/Model profile). Empty → hidden. */
  availability?: string | null;
  /** Real presence — profile.last_active_at within lib/online-status.ts's
   * window. NOT the same thing as `availability` ("open for bookings"). */
  isOnline?: boolean;
  /** Structured weekly hours + exceptions, when the talent has filled it in. */
  availabilitySchedule?: import("@/lib/availability-schedule").AvailabilitySchedule | null;
  languages?: string | null;
  /** Approved Model measurement fields (height/weight/shoe_size/hair_color/
   * eye_color), null unless category === "model" — see toMeasurements(). */
  measurements?: Record<string, string> | null;
  /** True only when an admin has approved a talent_verifications row (ID
   * document + selfie) — distinct from `verified` (the general is_verified
   * trust badge). */
  identityVerified?: boolean;
  /** Admin-only Model/Fashion trust metrics — every field optional, a
   * missing field must render as "not shown", never a fabricated number.
   * See supabase/migrations/20260820_talent_model_metrics.sql. */
  modelMetrics?: ModelMetrics;
}

export interface ModelMetrics {
  responseTimeLabel: string | null;
  responseRate:      number | null;
  repeatClientRate:  number | null;
  onTimeRate:        number | null;
  avgProjectValue:   number | null;
  noShowRate:        number | null;
  tier:              string | null;
  /** Auto-computed, NULL until enough bookings exist — see
   * supabase/migrations/20260821_auto_model_metrics.sql. */
  avgResponseHours: number | null;
  autoOnTimeRate:   number | null;
}

export interface BookingStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}

// ─── Composite page data ──────────────────────────────────────────────────────

export interface TalentPageData {
  talent: TalentData;
  brands: BrandItem[];
  reviews: Review[];
  experience: ExperienceItem[] | null;
  packages: PackageItem[] | null;
  addons: AddonItem[] | null;
  portfolioItems: PortfolioItem[];
  campaignStats: CampaignStats | null;
  featuredCampaign: FeaturedCampaign | null;
}

// Legacy — kept for transformer compatibility, not used in UI
export interface PerformanceData {
  reach: string;
  engagement: string;
  impact: string;
  repeat_clients: string;
}
