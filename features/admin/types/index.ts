import type { TalentStatus } from "@/features/talent-profile/types";

export type { TalentStatus };

export interface AdminTalent {
  profileId:       string;
  talentProfileId: string;
  fullName:        string | null;
  handle:          string | null;
  /** From auth.users — one Admin API lookup per row, current page only. */
  email:           string | null;
  phoneNumber:     string | null;
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

// ─── Talent Actions CRM ──────────────────────────────────────────────────────
// Same shape as the leads CRM's LeadAction (features/leads/types.ts), minus
// the stage/assignee concepts that don't apply to an already-onboarded
// talent — this is a plain contact log with an optional follow-up reminder.
export const TALENT_ACTION_TYPES = ["call", "message", "email", "meeting", "note"] as const;
export type TalentActionType = (typeof TALENT_ACTION_TYPES)[number];

export interface TalentAction {
  id:              string;
  talentId:        string;
  actionType:      string;
  note:            string | null;
  performedBy:     string | null;
  performedByName: string | null;
  followUpAt:      string | null;
  notifiedAt:      string | null;
  createdAt:       string;
}

export interface AddTalentActionInput {
  actionType:  string;
  note?:       string | null;
  performedBy: string | null;
  followUpAt?: string | null;
}

export interface AdminTalentBrand {
  id: string;
  brandName: string;
  logoUrl: string | null;
  yearCollaborated: string | null;
  sortOrder: number;
  verified: boolean;
}

export interface TalentActionAuditEntry {
  id: string;
  action: "created" | "updated" | "deleted";
  changedByName: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
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

export interface AdminBookingPayment {
  id:         string;
  status:     string;
  proof_url:  string | null;
}

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
  // Only ever a "pending" row in practice — see admin.service.ts's
  // fetchAdminBookingsPage comment for why this is fetched per page rather
  // than joined in SQL. Null for a booking that never got a payment-proof
  // upload, or whose payment has already moved past pending (held/released).
  payment:      AdminBookingPayment | null;
}

// ─── Admin booking detail (the /admin/bookings/[id] page) ──────────────────
// A superset of AdminBooking: everything a moderator needs to see the full
// story of one booking without leaving the admin — the brief, the full
// payment row (not just the pending-proof summary above), deliverables,
// review, a status-change audit trail, and the raw chat transcript.

export interface AdminBookingHistoryEntry {
  id:          string;
  from_status: string;
  to_status:   string;
  note:        string | null;
  created_at:  string;
  changedBy:   ProfileRef | null;
}

export interface AdminBookingMessage {
  id:         string;
  content:    string;
  created_at: string;
  sender:     ProfileRef | null;
}

export interface AdminBookingFull {
  id:              string;
  status:          string;
  amount:          number | null;
  service_type:    string | null;
  notes:           string | null;
  created_at:      string;
  paid_at:         string | null;
  completed_at:    string | null;
  brand:           ProfileRef;
  talent:          ProfileRef | null;
  job:             { id: string; title: string } | null;
  brief:           Record<string, unknown> | null;
  deliverables:    Record<string, unknown>[];
  payment:         Record<string, unknown> | null;
  review:          Record<string, unknown> | null;
  history:         AdminBookingHistoryEntry[];
  messages:        AdminBookingMessage[];
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
