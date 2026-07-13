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
  name: string;
  year: string;
  verified: boolean;
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
}

export interface PackageItem {
  id: string;
  name: string;
  price: string;
  popular: boolean;
  features: string[];
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
}

export interface TalentData {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  title: string;
  location: string;
  memberSince: string;
  rating: number;
  reviewCount: number;
  views: string;
  verified: boolean;
  fastResponse: boolean;
  premium: boolean;
  bio?: string | null;
  specialties?: string[];
  category?: string | null;
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
