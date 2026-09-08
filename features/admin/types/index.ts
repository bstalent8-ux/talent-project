import type { TalentStatus } from "@/features/talent-profile/types";

export type { TalentStatus };

export interface AdminTalent {
  profileId:       string;
  talentProfileId: string;
  fullName:        string | null;
  handle:          string | null;
  avatarUrl:       string | null;
  category:        string | null;
  city:            string | null;
  createdAt:       string;
  status:          TalentStatus;
  approvedAt:      string | null;
  rejectionReason: string | null;
  avgRating:       number | null;
  totalReviews:    number | null;
  accountStatus:   string;
  blockReason:     string | null;
  isVerified:      boolean;
  balance:         number;
  /** 0-100, same weighted score as the talent's own dashboard
   *  (lib/profile-completion.ts's calculateCompletion) — computed
   *  server-side per row in fetchAdminTalentsPage, not re-derived here. */
  completionScore: number;
}

export interface AdminDashboardStats {
  pending:          number;
  approved:         number;
  rejected:         number;
  suspended:        number;
  brands:           number;
  bookings:         number;
  reviews:          number;
  /** Running total of profiles (any role) created since launch tracking
   * started — grows over time, not reset daily. See
   * REGISTRATION_COUNTER_START in admin.service.ts. */
  newRegistrations: number;
  /** Every talent_profiles.category value seen, with its count — regardless
   *  of status (pending/approved/etc), so it reads as "our talent pool
   *  composition" rather than duplicating the approved-only stat above.
   *  Whatever categories exist show up here automatically, not just the
   *  two the platform ships with (ugc/model) — see DashboardStatsGrid.tsx. */
  byCategory: Record<string, number>;
}

type ProfileRef = { full_name: string | null; handle: string | null } | { full_name: string | null; handle: string | null }[] | null;

export interface AdminBooking {
  id:           string;
  status:       string;
  created_at:   string;
  amount:       number | null;
  notes:        string | null;
  brief_url:    string | null;
  paid_at:      string | null;
  completed_at: string | null;
  brand:        ProfileRef;
  talent:       ProfileRef;
}

export interface AdminReview {
  id:          string;
  rating:      number;
  comment:     string | null;
  status:      string;
  proof_link:  string | null;
  review_type: string | null;
  created_at:  string;
  brand:       { full_name: string | null } | { full_name: string | null }[] | null;
  talent:      ProfileRef;
}
