import { adminClient } from "@/lib/supabase/admin";
import type { AdminTalent, AdminDashboardStats, AdminBooking, AdminReview } from "../types";
import { clusterPageVisits, totalDurationByPage, type PageTotal } from "./page-duration-clustering";

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  // { count: "exact", head: true } returns just the row count — no rows are
  // fetched at all. Was: `.select("id")` (every row's id column, thousands
  // of rows over time) just to read `.length`.
  const safe = async (q: { then: unknown }) => {
    try { const r = await (q as Promise<{ count: number | null }>); return r.count ?? 0; } catch { return 0; }
  };

  // Running total, not "today" — a cumulative count of real signups since
  // launch tracking started (2026-08-25, right after the last seed/QA batch
  // that morning), so it only ever grows. The two accounts it starts from
  // (Joy Adel, Mariam Samy — both that afternoon/evening) are real; the test
  // brand created earlier that same morning is excluded by this cutoff.
  const REGISTRATION_COUNTER_START = "2026-08-25T12:00:00.000Z";

  // Was: `approved` counted every talent_profiles row with no status filter
  // (pending + approved + rejected + suspended all lumped under "Approved
  // Talents"), `rejected`/`suspended` were hardcoded 0, and `pending` came
  // from talent_verifications.status (the ID-document review queue — a
  // different table for a different thing) instead of talent_profiles.status
  // — DashboardStatsGrid.tsx's labels ("Pending/Approved/Rejected/Suspended
  // Talents") only ever meant talent_profiles.status. The verification
  // queue already has its own real count on /admin/verifications; it isn't
  // dropped, just no longer misrepresented here as the talent-listing queue.
  const countTalentsByStatus = (status: string) =>
    safe(adminClient.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", status));

  const [approved, pending, rejected, suspended, brands, bookings, reviews, newRegistrations] = await Promise.all([
    countTalentsByStatus("approved"),
    countTalentsByStatus("pending"),
    countTalentsByStatus("rejected"),
    countTalentsByStatus("suspended"),
    safe(adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "brand")),
    safe(adminClient.from("bookings").select("id", { count: "exact", head: true })),
    safe(adminClient.from("reviews").select("id", { count: "exact", head: true })),
    safe(adminClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", REGISTRATION_COUNTER_START)),
  ]);

  return {
    pending,
    approved,
    rejected,
    suspended,
    brands,
    bookings,
    reviews,
    newRegistrations,
  };
}

export interface AdminTalentsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminTalentsPageResult {
  talents: AdminTalent[];
  total:   number;
}

// Server-side pagination + server-side status filter (was: fetch every
// talent-role profile unbounded, then filter statusFilter in JS after the
// fact). `talent_profiles!inner` mirrors the same-shape query already used
// in features/talent-profile/services/public-talents.service.ts — a profile
// with no talent_profiles row was already silently excluded before (the old
// code's `if (!tp) return []`), so switching to an inner join changes
// nothing observable.
export async function fetchAdminTalentsPage({
  page = 1,
  pageSize = 10,
  status,
}: AdminTalentsPageParams): Promise<AdminTalentsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = adminClient
    .from("profiles")
    .select(`
      id, handle, full_name, avatar_url, city, created_at,
      is_approved, is_suspended, is_verified, balance,
      talent_profiles!inner (
        id, category, avg_rating, total_reviews, status, approved_at, rejection_reason
      )
    `, { count: "exact" })
    .eq("role", "talent")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("talent_profiles.status", status);

  const { data, count, error } = await query;
  if (error) return { talents: [], total: 0 };

  const talents = (data ?? []).flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
    if (!tp) return [];

    const isApproved   = (p as Record<string, unknown>).is_approved   as boolean ?? true;
    const isSuspended  = (p as Record<string, unknown>).is_suspended  as boolean ?? false;
    const accountStatus = isSuspended ? "suspended" : isApproved ? "active" : "pending";
    const talentStatus: AdminTalent["status"] = (tp.status as AdminTalent["status"]) ?? "pending";

    return [{
      profileId:       p.id,
      talentProfileId: tp.id,
      fullName:        p.full_name,
      handle:          p.handle,
      avatarUrl:       p.avatar_url,
      category:        tp.category,
      city:            p.city,
      createdAt:       p.created_at,
      status:          talentStatus,
      approvedAt:      tp.approved_at      ?? null,
      rejectionReason: tp.rejection_reason ?? null,
      avgRating:       tp.avg_rating    ?? null,
      totalReviews:    tp.total_reviews ?? null,
      accountStatus,
      blockReason:     null,
      isVerified:      (p as Record<string, unknown>).is_verified    as boolean ?? false,
      balance:         (p as Record<string, unknown>).balance        as number  ?? 0,
    }];
  });

  return { talents, total: count ?? talents.length };
}

export interface AdminBookingsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminBookingsPageResult {
  bookings: AdminBooking[];
  total:    number;
}

// Server-side pagination — fetches only the current page via range(), plus
// the exact total via Supabase's { count: "exact" }. Replaces the old
// fetchAdminBookings(), which pulled up to 200 rows and let the client slice
// them (see AdminBookingsClient's former PAGE_SIZE/paginated logic).
export async function fetchAdminBookingsPage({
  page = 1,
  pageSize = 20,
  status,
}: AdminBookingsPageParams): Promise<AdminBookingsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = adminClient
    .from("bookings")
    .select("id, status, created_at, amount, notes, brief_url, paid_at, completed_at, brand_id, talent_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);

  const { data: bookings, count, error } = await query;
  if (error) return { bookings: [], total: 0 };
  if (!bookings?.length) return { bookings: [], total: count ?? 0 };

  // Step 2: brand_id → profiles.id
  const brandIds  = [...new Set(bookings.map(b => b.brand_id).filter(Boolean))];
  // Step 3: talent_id → talent_profiles.id → profiles.user_id → profiles
  const talentTpIds = [...new Set(bookings.map(b => b.talent_id).filter(Boolean))];

  const [{ data: brandProfiles }, { data: tpRows }] = await Promise.all([
    brandIds.length
      ? adminClient.from("profiles").select("id, full_name, handle").in("id", brandIds)
      : Promise.resolve({ data: [] }),
    talentTpIds.length
      ? adminClient.from("talent_profiles").select("id, user_id").in("id", talentTpIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userIds = (tpRows ?? []).map((tp: Record<string, unknown>) => tp.user_id as string).filter(Boolean);
  const { data: talentProfiles } = userIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle").in("id", userIds)
    : { data: [] };

  const brandMap   = Object.fromEntries((brandProfiles  ?? []).map(p => [p.id, p]));
  const tpMap      = Object.fromEntries((tpRows         ?? []).map((tp: Record<string, unknown>) => [tp.id as string, tp.user_id as string]));
  const talentMap  = Object.fromEntries((talentProfiles ?? []).map(p => [p.id, p]));

  const joined = bookings.map(b => {
    const userId = tpMap[b.talent_id];
    return {
      ...b,
      brand:  brandMap[b.brand_id]  ?? null,
      talent: userId ? talentMap[userId] : null,
    };
  }) as AdminBooking[];

  return { bookings: joined, total: count ?? joined.length };
}

export interface AdminReviewsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminReviewsPageResult {
  reviews: AdminReview[];
  total:   number;
}

// Server-side pagination + server-side status filter — was: fetch up to 200
// reviews (a fixed cap, not true pagination) and filter status in the
// client component.
export async function fetchAdminReviewsPage({
  page = 1,
  pageSize = 10,
  status,
}: AdminReviewsPageParams): Promise<AdminReviewsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  // Step 1: fetch reviews (try with new columns first)
  let reviews: Record<string, unknown>[] = [];
  let total = 0;

  let query = adminClient
    .from("reviews")
    .select("id, rating, comment, status, proof_link, review_type, created_at, brand_id, talent_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, count, error } = await query;

  if (!error && data) {
    reviews = data as Record<string, unknown>[];
    total = count ?? reviews.length;
  } else {
    // Fallback without new columns — this schema variant has no status
    // column at all (every row is synthetically "approved"), so a status
    // filter for anything else legitimately yields nothing.
    if (status && status !== "all" && status !== "approved") {
      return { reviews: [], total: 0 };
    }
    const { data: basic, count: basicCount } = await adminClient
      .from("reviews")
      .select("id, rating, comment, created_at, brand_id, talent_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    reviews = (basic ?? []).map(r => ({ ...r, status: "approved", proof_link: null, review_type: "brand" }));
    total = basicCount ?? reviews.length;
  }

  if (!reviews.length) return { reviews: [], total };

  // Step 2: fetch brand names from profiles (brand_id → profiles.id)
  const brandIds  = [...new Set(reviews.map(r => r.brand_id as string).filter(Boolean))];
  const talentIds = [...new Set(reviews.map(r => r.talent_id as string).filter(Boolean))];

  const [{ data: brandProfiles }, { data: talentProfilesData }] = await Promise.all([
    brandIds.length
      ? adminClient.from("profiles").select("id, full_name, handle").in("id", brandIds)
      : Promise.resolve({ data: [] }),
    // talent_id may reference talent_profiles.id OR profiles.id — try talent_profiles first
    talentIds.length
      ? adminClient.from("talent_profiles").select("id, user_id").in("id", talentIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Get profiles for talents via user_id
  const userIds = (talentProfilesData ?? []).map((tp: Record<string, unknown>) => tp.user_id as string).filter(Boolean);
  const { data: talentUserProfiles } = userIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle").in("id", userIds)
    : { data: [] };

  const brandMap  = Object.fromEntries((brandProfiles ?? []).map(p => [p.id, p]));
  const tpMap     = Object.fromEntries((talentProfilesData ?? []).map((tp: Record<string, unknown>) => [tp.id as string, tp.user_id as string]));
  const profileMap = Object.fromEntries((talentUserProfiles ?? []).map(p => [p.id, p]));

  const joined = reviews.map(r => {
    const brand   = brandMap[r.brand_id as string] ?? null;
    const userId  = tpMap[r.talent_id as string];
    // Fallback: if talent_id is directly a profiles.id (old seed data)
    const talent  = userId ? profileMap[userId] : (brandMap[r.talent_id as string] ?? null);
    return {
      ...r,
      brand:  brand  ? { full_name: brand.full_name }  : null,
      talent: talent ? { full_name: talent.full_name, handle: talent.handle } : null,
    };
  }) as AdminReview[];

  return { reviews: joined, total };
}

// ─── Verification requests ────────────────────────────────────────────────────
export interface AdminVerification {
  id:              string;
  talentId:        string;
  fullName:        string | null;
  handle:          string | null;
  avatarUrl:       string | null;
  status:          "pending" | "approved" | "rejected";
  submittedAt:     string;
  idDocumentUrl:   string | null;
  selfieUrl:       string | null;
  socialProof:     string | null;
  rejectionReason: string | null;
  isVerified:      boolean;
}

export interface AdminVerificationsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminVerificationsPageResult {
  verifications: AdminVerification[];
  total:         number;
}

// Server-side pagination + server-side status filter — was: fetch every
// verification request unbounded, filter status in the client component.
export async function fetchAdminVerificationsPage({
  page = 1,
  pageSize = 10,
  status,
}: AdminVerificationsPageParams): Promise<AdminVerificationsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = adminClient
    .from("talent_verifications")
    .select("id, talent_id, status, submitted_at, id_document_url, selfie_url, social_proof, rejection_reason", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range(from, to);
  if (status && status !== "all") query = query.eq("status", status);

  const { data: verifications, count, error } = await query;
  if (error) return { verifications: [], total: 0 };
  if (!verifications?.length) return { verifications: [], total: count ?? 0 };

  // Step 2: fetch matching profiles in one query (bounded to this page's rows)
  const talentIds = [...new Set(verifications.map(v => v.talent_id))];
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, is_verified")
    .in("id", talentIds);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  const joined = verifications.map((v) => {
    const p = profileMap[v.talent_id];
    return {
      id:              v.id,
      talentId:        v.talent_id,
      fullName:        p?.full_name   ?? null,
      handle:          p?.handle      ?? null,
      avatarUrl:       (p as Record<string, unknown>)?.avatar_url  as string  ?? null,
      status:          v.status as "pending" | "approved" | "rejected",
      submittedAt:     v.submitted_at,
      idDocumentUrl:   v.id_document_url  ?? null,
      selfieUrl:       v.selfie_url       ?? null,
      socialProof:     v.social_proof     ?? null,
      rejectionReason: v.rejection_reason ?? null,
      isVerified:      (p as Record<string, unknown>)?.is_verified as boolean ?? false,
    };
  });

  return { verifications: joined, total: count ?? joined.length };
}

// ─── Brands with approval workflow ───────────────────────────────────────────
export interface AdminBrand {
  id:              string;
  fullName:        string | null;
  handle:          string | null;
  city:            string | null;
  createdAt:       string;
  brandStatus:     string;
  taxDocumentUrl:  string | null;
  rejectionReason: string | null;
  accountStatus:   string;
  blockReason:     string | null;
}

export interface AdminBrandsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminBrandsPageResult {
  brands: AdminBrand[];
  total:  number;
}

// Server-side pagination + server-side brand_status filter — was: fetch
// every brand-role profile unbounded, filter in the client component.
export async function fetchAdminBrandsPage({
  page = 1,
  pageSize = 10,
  status,
}: AdminBrandsPageParams): Promise<AdminBrandsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = adminClient
    .from("profiles")
    .select(`
      id, full_name, handle, city, created_at,
      brand_status, tax_document_url, brand_rejection_reason,
      is_approved, is_suspended
    `, { count: "exact" })
    .eq("role", "brand")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("brand_status", status);

  const { data, count, error } = await query;
  if (error) return { brands: [], total: 0 };

  const brands = (data ?? []).map((b) => {
    const isApproved  = (b as Record<string, unknown>).is_approved  as boolean ?? true;
    const isSuspended = (b as Record<string, unknown>).is_suspended as boolean ?? false;
    const accountStatus = isSuspended ? "suspended" : isApproved ? "active" : "pending";
    return {
      id:              b.id,
      fullName:        b.full_name,
      handle:          b.handle,
      city:            b.city,
      createdAt:       b.created_at,
      brandStatus:     (b as Record<string, unknown>).brand_status           as string ?? "approved",
      taxDocumentUrl:  (b as Record<string, unknown>).tax_document_url       as string ?? null,
      rejectionReason: (b as Record<string, unknown>).brand_rejection_reason as string ?? null,
      accountStatus,
      blockReason:     null,
    };
  });

  return { brands, total: count ?? brands.length };
}

// ─── Home landing: testimonials ──────────────────────────────────────────────
export interface AdminTestimonial {
  id:              string;
  quote:           string;
  authorName:      string;
  authorRole:      string | null;
  company:         string | null;
  status:          "pending" | "approved" | "rejected";
  submittedAt:     string;
  submitterHandle: string | null;
  rejectionReason: string | null;
}

export async function fetchAdminTestimonials(): Promise<AdminTestimonial[]> {
  const { data: rows, error } = await adminClient
    .from("landing_testimonials")
    .select("id, submitter_id, quote, author_name, author_role, company, status, submitted_at, rejection_reason")
    .order("submitted_at", { ascending: false });

  if (error || !rows?.length) return [];

  const submitterIds = [...new Set(rows.map((r) => r.submitter_id))];
  const { data: profiles } = await adminClient.from("profiles").select("id, handle").in("id", submitterIds);
  const handleById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.handle]));

  return rows.map((r) => ({
    id:              r.id,
    quote:           r.quote,
    authorName:      r.author_name,
    authorRole:      r.author_role,
    company:         r.company,
    status:          r.status as "pending" | "approved" | "rejected",
    submittedAt:     r.submitted_at,
    submitterHandle: handleById[r.submitter_id] ?? null,
    rejectionReason: r.rejection_reason,
  }));
}

// ─── Home landing: brand moments ─────────────────────────────────────────────
export interface AdminBrandMoment {
  id:              string;
  title:           string;
  location:        string | null;
  imageUrl:        string;
  status:          "pending" | "approved" | "rejected";
  submittedAt:     string;
  submitterHandle: string | null;
  rejectionReason: string | null;
}

export async function fetchAdminBrandMoments(): Promise<AdminBrandMoment[]> {
  const { data: rows, error } = await adminClient
    .from("landing_brand_moments")
    .select("id, submitter_id, title, location, image_url, status, submitted_at, rejection_reason")
    .order("submitted_at", { ascending: false });

  if (error || !rows?.length) return [];

  const submitterIds = [...new Set(rows.map((r) => r.submitter_id))];
  const { data: profiles } = await adminClient.from("profiles").select("id, handle").in("id", submitterIds);
  const handleById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.handle]));

  return rows.map((r) => ({
    id:              r.id,
    title:           r.title,
    location:        r.location,
    imageUrl:        r.image_url,
    status:          r.status as "pending" | "approved" | "rejected",
    submittedAt:     r.submitted_at,
    submitterHandle: handleById[r.submitter_id] ?? null,
    rejectionReason: r.rejection_reason,
  }));
}

// ─── Support tickets (contact_messages) ────────────────────────────────────
export interface AdminSupportTicket {
  id:          string;
  name:        string;
  email:       string;
  phone:       string | null;
  type:        string;
  subject:     string;
  message:     string;
  status:      "new" | "in_progress" | "resolved";
  adminReply:  string | null;
  repliedAt:   string | null;
  context:     { page?: string | null; pageError?: string | null } | null;
  attachmentUrl: string | null;
  createdAt:   string;
}

export interface AdminSupportTicketsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminSupportTicketsPageResult {
  tickets: AdminSupportTicket[];
  total:   number;
}

// Server-side pagination + server-side status filter — was: fetch every
// contact_messages row unbounded, filter status in the client component.
export async function fetchAdminSupportTicketsPage({
  page = 1,
  pageSize = 10,
  status,
}: AdminSupportTicketsPageParams): Promise<AdminSupportTicketsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = adminClient
    .from("contact_messages")
    .select("id, name, email, phone, type, subject, message, status, admin_reply, replied_at, context, attachment_url, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);

  const { data: rows, count, error } = await query;
  if (error || !rows) return { tickets: [], total: 0 };

  const tickets = rows.map((r) => ({
    id:         r.id,
    name:       r.name,
    email:      r.email,
    phone:      r.phone,
    type:       r.type,
    subject:    r.subject,
    message:    r.message,
    status:     (r.status ?? "new") as "new" | "in_progress" | "resolved",
    adminReply: r.admin_reply,
    repliedAt:  r.replied_at,
    context:    r.context,
    attachmentUrl: r.attachment_url,
    createdAt:  r.created_at,
  }));

  return { tickets, total: count ?? tickets.length };
}

export interface AdminTalentTypeRequest {
  id:            string;
  userId:        string;
  handle:        string | null;
  fullName:      string | null;
  selectedType:  "ugc" | "model" | "other";
  otherTypeText: string | null;
  utmSource:     string | null;
  utmCampaign:   string | null;
  createdAt:     string;
}

export interface AdminTalentTypeDateRange {
  from?: string; // "YYYY-MM-DD", inclusive
  to?:   string; // "YYYY-MM-DD", inclusive
}

function applyTalentTypeDateRange<T extends { gte: (c: string, v: string) => T; lt: (c: string, v: string) => T }>(
  query: T,
  { from, to }: AdminTalentTypeDateRange,
): T {
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) {
    const exclusiveEnd = new Date(`${to}T00:00:00.000Z`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    query = query.lt("created_at", exclusiveEnd.toISOString());
  }
  return query;
}

export interface AdminTalentTypeStats {
  ugc:   number;
  model: number;
  other: number;
  otherBreakdown: Array<{ label: string; count: number }>;
}

// Aggregate counts, computed server-side over the FULL date-filtered
// dataset (count-only queries — no rows fetched) rather than over whatever
// happens to be on the current page. Deliberately separate from the
// paginated list below: an aggregate can never be derived from one page.
export async function fetchAdminTalentTypeStats(range: AdminTalentTypeDateRange = {}): Promise<AdminTalentTypeStats> {
  const countFor = async (selectedType: "ugc" | "model" | "other") => {
    let query = adminClient
      .from("talent_type_requests")
      .select("id", { count: "exact", head: true })
      .eq("selected_type", selectedType);
    query = applyTalentTypeDateRange(query, range);
    const { count } = await query;
    return count ?? 0;
  };

  const [ugc, model, other] = await Promise.all([countFor("ugc"), countFor("model"), countFor("other")]);

  // Bounded by the "other" subset only (never the whole table) — a real
  // GROUP BY would need an RPC/view; this single narrow column fetch is the
  // lightweight equivalent for a dataset that's inherently small (a subset
  // of new-talent signups, not the whole marketplace).
  let otherQuery = adminClient
    .from("talent_type_requests")
    .select("other_type_text")
    .eq("selected_type", "other");
  otherQuery = applyTalentTypeDateRange(otherQuery, range);
  const { data: otherRows } = await otherQuery;

  const counts = new Map<string, number>();
  for (const row of otherRows ?? []) {
    const key = (row.other_type_text ?? "—").trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const otherBreakdown = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return { ugc, model, other, otherBreakdown };
}

export interface AdminTalentTypeRequestsPageParams extends AdminTalentTypeDateRange {
  page?:     number;
  pageSize?: number;
}

export interface AdminTalentTypeRequestsPageResult {
  requests: AdminTalentTypeRequest[];
  total:    number;
}

// Server-side pagination — was: fetch every talent_type_requests row
// unbounded, paginate/filter by date entirely in the client. See
// supabase/migrations/20260822_talent_type_requests.sql.
export async function fetchAdminTalentTypeRequestsPage({
  page = 1,
  pageSize = 10,
  from,
  to,
}: AdminTalentTypeRequestsPageParams): Promise<AdminTalentTypeRequestsPageResult> {
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo   = rangeFrom + pageSize - 1;

  let query = adminClient
    .from("talent_type_requests")
    .select("id, user_id, selected_type, other_type_text, utm_source, utm_campaign, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);
  query = applyTalentTypeDateRange(query, { from, to });

  const { data: rows, count, error } = await query;
  if (error) return { requests: [], total: 0 };
  if (!rows?.length) return { requests: [], total: count ?? 0 };

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, handle, full_name")
    .in("id", userIds);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const requests = rows.map((r) => ({
    id:            r.id,
    userId:        r.user_id,
    handle:        profileMap[r.user_id]?.handle ?? null,
    fullName:      profileMap[r.user_id]?.full_name ?? null,
    selectedType:  r.selected_type as "ugc" | "model" | "other",
    otherTypeText: r.other_type_text,
    utmSource:     r.utm_source,
    utmCampaign:   r.utm_campaign,
    createdAt:     r.created_at,
  }));

  return { requests, total: count ?? requests.length };
}

// ─── User activity (in-house event log) ──────────────────────────────────────

export const USER_EVENT_NAMES = [
  "page_view", "talent_profile_view", "search",
  "booking_brief_sent", "job_application", "signup", "login",
  "page_engagement", "click",
] as const;
export type UserEventName = typeof USER_EVENT_NAMES[number];

export interface AdminUserEvent {
  id:         string;
  userId:     string | null;
  handle:     string | null;
  fullName:   string | null;
  eventName:  UserEventName;
  targetType: string | null;
  targetId:   string | null;
  metadata:   Record<string, unknown>;
  createdAt:  string;
}

export interface AdminUserActivityDateRange {
  from?: string; // "YYYY-MM-DD", inclusive
  to?:   string; // "YYYY-MM-DD", inclusive
}

function applyUserActivityDateRange<T extends { gte: (c: string, v: string) => T; lt: (c: string, v: string) => T }>(
  query: T,
  { from, to }: AdminUserActivityDateRange,
): T {
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) {
    const exclusiveEnd = new Date(`${to}T00:00:00.000Z`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    query = query.lt("created_at", exclusiveEnd.toISOString());
  }
  return query;
}

export type AdminUserActivityStats = Record<UserEventName, number>;

// Count-only queries (no rows fetched) over the full date-filtered dataset —
// same shape as fetchAdminTalentTypeStats.
export async function fetchAdminUserActivityStats(range: AdminUserActivityDateRange = {}): Promise<AdminUserActivityStats> {
  const countFor = async (eventName: UserEventName) => {
    let query = adminClient
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", eventName);
    query = applyUserActivityDateRange(query, range);
    const { count } = await query;
    return count ?? 0;
  };

  const counts = await Promise.all(USER_EVENT_NAMES.map(countFor));
  return Object.fromEntries(USER_EVENT_NAMES.map((name, i) => [name, counts[i]])) as AdminUserActivityStats;
}

export interface AdminUserActivityPageParams extends AdminUserActivityDateRange {
  page?:      number;
  pageSize?:  number;
  eventName?: UserEventName;
}

export interface AdminUserActivityPageResult {
  events: AdminUserEvent[];
  total:  number;
}

// Server-side pagination — same join-in-JS pattern as
// fetchAdminTalentTypeRequestsPage (Supabase joins across these tables are
// avoided deliberately, see CLAUDE.md §11).
export async function fetchAdminUserActivityPage({
  page = 1,
  pageSize = 20,
  from,
  to,
  eventName,
}: AdminUserActivityPageParams): Promise<AdminUserActivityPageResult> {
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo   = rangeFrom + pageSize - 1;

  let query = adminClient
    .from("user_events")
    .select("id, user_id, event_name, target_type, target_id, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);
  query = applyUserActivityDateRange(query, { from, to });
  if (eventName) query = query.eq("event_name", eventName);

  const { data: rows, count, error } = await query;
  if (error) return { events: [], total: 0 };
  if (!rows?.length) return { events: [], total: count ?? 0 };

  const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = userIds.length
    ? await adminClient.from("profiles").select("id, handle, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const events = rows.map((r) => ({
    id:         r.id,
    userId:     r.user_id,
    handle:     r.user_id ? profileMap[r.user_id]?.handle ?? null : null,
    fullName:   r.user_id ? profileMap[r.user_id]?.full_name ?? null : null,
    eventName:  r.event_name as UserEventName,
    targetType: r.target_type,
    targetId:   r.target_id,
    metadata:   (r.metadata ?? {}) as Record<string, unknown>,
    createdAt:  r.created_at,
  }));

  return { events, total: count ?? events.length };
}

// ─── Traffic sources (signup attribution) ──────────────────────────────────
// Groups signup events by utm_source/utm_campaign — same join-in-JS
// approach as the rest of this file (see CLAUDE.md §11): signup volume is
// low enough that fetching every signup row in range and aggregating in
// memory is cheap, and it avoids a raw-SQL jsonb GROUP BY the Supabase
// query builder can't express. lib/analytics/attribution.ts + the register
// page default an untagged signup to "organic" at write time, but this
// still falls back defensively for any row written before that shipped.

// Two-bucket channel a signup is credited to, derived from utm_source.
// Only a paid ad link is "campaign" — a Facebook-group post is unpaid
// distribution same as any other organic share, so "fb_group" (see
// lib/analytics/attribution.ts) counts as organic here too, same as the
// untagged fallback "organic" itself. The per-source detail table still
// shows "fb_group" as its own row for anyone who wants that split; this
// bucket is only the two-way paid-vs-not headline number.
export type TrafficChannel = "campaign" | "organic";

function classifyChannel(source: string): TrafficChannel {
  return source === "organic" || source === "fb_group" ? "organic" : "campaign";
}

export interface AdminTrafficSource {
  source:   string;
  campaign: string | null;
  channel:  TrafficChannel;
  count:    number;
}

export interface AdminTrafficSummary {
  total:    number;
  campaign: number;
  organic:  number;
}

export async function fetchAdminTrafficSources(range: AdminUserActivityDateRange = {}): Promise<AdminTrafficSource[]> {
  let query = adminClient
    .from("user_events")
    .select("metadata")
    .eq("event_name", "signup");
  query = applyUserActivityDateRange(query, range);

  const { data: rows, error } = await query;
  if (error || !rows?.length) return [];

  const counts = new Map<string, AdminTrafficSource>();
  for (const row of rows) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const source   = typeof metadata.utm_source === "string" ? metadata.utm_source : "organic";
    const campaign = typeof metadata.utm_campaign === "string" ? metadata.utm_campaign : null;
    const key = `${source} ${campaign ?? ""}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { source, campaign, channel: classifyChannel(source), count: 1 });
  }

  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/** Rolls fetchAdminTrafficSources up into the three headline buckets
 * (+ total) the admin page's summary cards show. */
export function summarizeTrafficSources(sources: AdminTrafficSource[]): AdminTrafficSummary {
  const summary: AdminTrafficSummary = { total: 0, campaign: 0, organic: 0 };
  for (const s of sources) {
    summary.total += s.count;
    summary[s.channel] += s.count;
  }
  return summary;
}

// ─── Per-visitor rollup ─────────────────────────────────────────────────────
// "Visitor" = one real identity: a signed-in user is grouped by user_id
// (the same person logging in from two different devices/sessions is one
// row, not two) — a guest with no account is grouped by session_id, the
// only thing tying their events together. That distinction matters
// specifically because session_id is shared browser-wide (localStorage):
// two different logged-in people testing on the same machine must NOT be
// merged into one row just because they happened to share that token.

export interface AdminVisitor {
  /** user_id for a signed-in visitor, "guest:<session_id>" for a guest —
   * pass straight through as the [key] route param. */
  key:        string;
  userId:     string | null;
  sessionId:  string;
  handle:     string | null;
  fullName:   string | null;
  firstSeen:  string;
  lastSeen:   string;
  eventCount: number;
}

// No per-visitor rollup table exists — this groups the most recent N raw
// events in JS, the same "resolve in JS, not a DB join" posture as the rest
// of this file (CLAUDE.md §11). Fine at today's volume; a real rollup table
// (or a materialized view) is the fix once a full scan of this many rows
// stops being cheap.
const VISITOR_SCAN_LIMIT = 3000;

export async function fetchAdminUserActivityVisitors(range: AdminUserActivityDateRange = {}): Promise<AdminVisitor[]> {
  let query = adminClient
    .from("user_events")
    .select("user_id, session_id, created_at")
    .order("created_at", { ascending: false })
    .limit(VISITOR_SCAN_LIMIT);
  query = applyUserActivityDateRange(query, range);

  const { data: rows, error } = await query;
  if (error || !rows?.length) return [];

  const byKey = new Map<string, { userId: string | null; sessionId: string; first: string; last: string; count: number }>();
  for (const r of rows) {
    const key = r.user_id ?? `guest:${r.session_id}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
      if (r.created_at < existing.first) existing.first = r.created_at;
      if (r.created_at > existing.last) existing.last = r.created_at;
    } else {
      byKey.set(key, { userId: r.user_id, sessionId: r.session_id, first: r.created_at, last: r.created_at, count: 1 });
    }
  }

  const userIds = [...new Set([...byKey.values()].map((v) => v.userId).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = userIds.length
    ? await adminClient.from("profiles").select("id, handle, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return [...byKey.entries()]
    .map(([key, v]) => ({
      key,
      userId:     v.userId,
      sessionId:  v.sessionId,
      handle:     v.userId ? profileMap[v.userId]?.handle ?? null : null,
      fullName:   v.userId ? profileMap[v.userId]?.full_name ?? null : null,
      firstSeen:  v.first,
      lastSeen:   v.last,
      eventCount: v.count,
    }))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

// ─── Single-visitor detail ──────────────────────────────────────────────────

export interface AdminVisitorDetail {
  key:        string;
  userId:     string | null;
  sessionId:  string;
  handle:     string | null;
  fullName:   string | null;
  events:     AdminUserEvent[];
  /** Total time spent per page, reconstructed from page_engagement
   * heartbeats — see features/admin/services/page-duration-clustering.ts. */
  pageTotals: PageTotal[];
}

const VISITOR_DETAIL_LIMIT = 500;

export async function fetchAdminVisitorDetail(key: string): Promise<AdminVisitorDetail | null> {
  const isGuest  = key.startsWith("guest:");
  const userId   = isGuest ? null : key;
  const sessionId = isGuest ? key.slice("guest:".length) : null;

  let query = adminClient
    .from("user_events")
    .select("id, user_id, session_id, event_name, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(VISITOR_DETAIL_LIMIT);
  // A guest's session_id is looked up on its own (not also filtered to
  // user_id IS NULL) — if that same browser session later signs in, this
  // still shows the full journey under the one token that ties it together.
  query = userId ? query.eq("user_id", userId) : query.eq("session_id", sessionId as string);

  const { data: rows, error } = await query;
  if (error || !rows?.length) return null;

  let handle: string | null = null;
  let fullName: string | null = null;
  if (userId) {
    const { data: profile } = await adminClient.from("profiles").select("handle, full_name").eq("id", userId).maybeSingle();
    handle = profile?.handle ?? null;
    fullName = profile?.full_name ?? null;
  }

  const events: AdminUserEvent[] = rows.map((r) => ({
    id:         r.id,
    userId:     r.user_id,
    handle,
    fullName,
    eventName:  r.event_name as UserEventName,
    targetType: r.target_type,
    targetId:   r.target_id,
    metadata:   (r.metadata ?? {}) as Record<string, unknown>,
    createdAt:  r.created_at,
  }));

  const engagementSamples = rows
    .filter((r) => r.event_name === "page_engagement")
    .map((r) => {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      return {
        path:        typeof m.path === "string" ? m.path : "?",
        duration_ms: typeof m.duration_ms === "number" ? m.duration_ms : 0,
        created_at:  r.created_at,
      };
    });
  const pageTotals = totalDurationByPage(clusterPageVisits(engagementSamples));

  return {
    key,
    userId,
    sessionId: sessionId ?? rows[0].session_id,
    handle,
    fullName,
    events,
    pageTotals,
  };
}

// ─── Email log ──────────────────────────────────────────────────────────────
// Backs /admin/emails. Rows come from lib/email/send.ts's own best-effort
// insert on every send (see supabase/migrations/20260830_email_log.sql) —
// this is a read-only paginated view over that table, joined in JS to the
// recipient's handle/name the same way every other admin list here does
// (Supabase joins across these tables are avoided deliberately, CLAUDE.md §12).

export interface AdminEmailLogRow {
  id:              string;
  recipientEmail:  string;
  recipientId:     string | null;
  recipientHandle: string | null;
  recipientName:   string | null;
  subject:         string;
  bodyHtml:        string;
  template:        string;
  status:          "sent" | "failed";
  error:           string | null;
  createdAt:       string;
}

export interface AdminEmailLogPageResult {
  emails: AdminEmailLogRow[];
  total:  number;
}

export async function fetchAdminEmailLogPage({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number }): Promise<AdminEmailLogPageResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await adminClient
    .from("email_log")
    .select("id, recipient_email, recipient_id, subject, body_html, template, status, error, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { emails: [], total: 0 };

  const recipientIds = Array.from(new Set((data ?? []).map((r) => r.recipient_id).filter((id): id is string => !!id)));
  const profilesById: Record<string, { handle: string | null; full_name: string | null }> = {};
  if (recipientIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, handle, full_name")
      .in("id", recipientIds);
    for (const p of profiles ?? []) profilesById[p.id] = { handle: p.handle, full_name: p.full_name };
  }

  const emails: AdminEmailLogRow[] = (data ?? []).map((r) => ({
    id:              r.id,
    recipientEmail:  r.recipient_email,
    recipientId:     r.recipient_id,
    recipientHandle: r.recipient_id ? profilesById[r.recipient_id]?.handle ?? null : null,
    recipientName:   r.recipient_id ? profilesById[r.recipient_id]?.full_name ?? null : null,
    subject:         r.subject,
    bodyHtml:        r.body_html,
    template:        r.template,
    status:          r.status as "sent" | "failed",
    error:           r.error,
    createdAt:       r.created_at,
  }));

  return { emails, total: count ?? emails.length };
}

// ─── Notification log ─────────────────────────────────────────────────────────
// Backs /admin/notifications-log — a read-only paginated view over every row
// ever written to `notifications`, individual sends (PROFILE_APPROVED,
// BOOKING_REQUEST, ...) and broadcasts alike. Distinct from /admin/notifications'
// own "send history", which only covers rows its own broadcast composer wrote.
// Joined in JS to the recipient's handle/name, same pattern as
// fetchAdminEmailLogPage above.

export interface AdminNotificationLogRow {
  id:              string;
  recipientId:     string;
  recipientHandle: string | null;
  recipientName:   string | null;
  type:            string;
  title:           string;
  message:         string;
  metadata:        Record<string, unknown>;
  isRead:          boolean;
  createdAt:       string;
}

export interface AdminNotificationLogPageResult {
  notifications: AdminNotificationLogRow[];
  total:         number;
}

export async function fetchAdminNotificationLogPage({
  page = 1,
  pageSize = 20,
  type,
}: { page?: number; pageSize?: number; type?: string }): Promise<AdminNotificationLogPageResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from("notifications")
    .select("id, recipient_id, type, title, message, metadata, is_read, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (type) query = query.eq("type", type);

  const { data, count, error } = await query;
  if (error) return { notifications: [], total: 0 };

  const recipientIds = Array.from(new Set((data ?? []).map((r) => r.recipient_id).filter((id): id is string => !!id)));
  const profilesById: Record<string, { handle: string | null; full_name: string | null }> = {};
  if (recipientIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, handle, full_name")
      .in("id", recipientIds);
    for (const p of profiles ?? []) profilesById[p.id] = { handle: p.handle, full_name: p.full_name };
  }

  const notifications: AdminNotificationLogRow[] = (data ?? []).map((r) => ({
    id:              r.id,
    recipientId:     r.recipient_id,
    recipientHandle: profilesById[r.recipient_id]?.handle ?? null,
    recipientName:   profilesById[r.recipient_id]?.full_name ?? null,
    type:            r.type,
    title:           r.title,
    message:         r.message,
    metadata:        (r.metadata ?? {}) as Record<string, unknown>,
    isRead:          r.is_read,
    createdAt:       r.created_at,
  }));

  return { notifications, total: count ?? notifications.length };
}
