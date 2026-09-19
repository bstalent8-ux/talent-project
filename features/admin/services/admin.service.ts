import { adminClient } from "@/lib/supabase/admin";
import type { AdminTalent, AdminDashboardStats, AdminBooking, AdminBookingFull, AdminReview, TalentAction, AddTalentActionInput, AdminTalentBrand, TalentActionAuditEntry } from "../types";
import { clusterPageVisits, totalDurationByPage, type PageTotal, type EngagementSample } from "./page-duration-clustering";
import { calculateCompletion } from "@/lib/profile-completion";
import { extractPhoneCandidates } from "./bio-phone-detection";
import { toIntlDigits } from "@/lib/leads/phone-links";

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

  // No SQL GROUP BY through the JS client — fetch every category value and
  // tally in-process. The talent pool is small enough (dozens, not
  // thousands) that this is one cheap query, same posture as other
  // JS-side-join spots this codebase already uses (CLAUDE.md §11.10).
  const countsByCategory = async (): Promise<Record<string, number>> => {
    const { data } = await adminClient.from("talent_profiles").select("category");
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const key = row.category ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  };

  const [approved, pending, rejected, suspended, brands, bookings, reviews, newRegistrations, byCategory] = await Promise.all([
    countTalentsByStatus("approved"),
    countTalentsByStatus("pending"),
    countTalentsByStatus("rejected"),
    countTalentsByStatus("suspended"),
    safe(adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "brand")),
    safe(adminClient.from("bookings").select("id", { count: "exact", head: true })),
    safe(adminClient.from("reviews").select("id", { count: "exact", head: true })),
    safe(adminClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", REGISTRATION_COUNTER_START)),
    countsByCategory(),
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
    byCategory,
  };
}

export const TALENT_SORT_KEYS = ["full_name", "city", "balance", "created_at"] as const;
const TALENT_SORTABLE = new Set<string>(TALENT_SORT_KEYS);

export interface AdminTalentsPageParams {
  page?:      number;
  pageSize?:  number;
  status?:    string;
  category?:  string;
  city?:      string;
  sort?:      string;
  dir?:       "asc" | "desc";
  duplicate?: TalentDuplicateFilter;
  /** Free-text search against full_name and phone_number (ilike, ANDed
   *  with every other filter). Same box the admin types a name or a phone
   *  digit string into — see applyTalentSearch() below. */
  q?: string;
  /** Profile-completion score filter (0-100). completionScore is computed in
   *  JS, not a DB column, so this restricts by id list — same approach as
   *  the duplicate filter. Needs both `score` and `scoreOp` to apply. */
  score?:   number;
  scoreOp?: TalentScoreOp;
}

export type TalentScoreOp = "eq" | "lte" | "gte";

function scoreMatches(score: number, op: TalentScoreOp, target: number): boolean {
  switch (op) {
    case "eq":  return score === target;
    case "lte": return score <= target;
    case "gte": return score >= target;
  }
}

/** `.or("full_name.ilike.%x%,phone_number.ilike.%x%")` — PostgREST's filter
 *  string treats "," and "()" as syntax, and "%"/"_" as ilike wildcards, so
 *  a search term containing any of those needs escaping/stripping before it
 *  reaches the query string, not just before display. */
function applyTalentSearch<T extends { or: (s: string) => T }>(query: T, q: string | undefined): T {
  const term = (q ?? "").trim().replace(/[,()]/g, "");
  if (!term) return query;
  const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
  return query.or(`full_name.ilike.%${escaped}%,phone_number.ilike.%${escaped}%`);
}

/** Feeds the Category/City filter selects with only values that actually
 *  exist — the platform's category list can change (see the Dashboard's
 *  byCategory card), and city is free text typed by each talent, so a
 *  hardcoded option list would drift from reality immediately. */
export interface AdminTalentFilterOptions {
  categories: string[];
  cities:     string[];
}

export async function fetchAdminTalentFilterOptions(): Promise<AdminTalentFilterOptions> {
  const [{ data: categoryRows }, { data: cityRows }] = await Promise.all([
    adminClient.from("talent_profiles").select("category"),
    adminClient.from("profiles").select("city").eq("role", "talent"),
  ]);

  const categories = Array.from(new Set((categoryRows ?? []).map((r) => r.category).filter((c): c is string => !!c))).sort();
  const cities = Array.from(new Set((cityRows ?? []).map((r) => r.city).filter((c): c is string => !!c))).sort();

  return { categories, cities };
}

export interface AdminTalentsPageResult {
  talents: AdminTalent[];
  total:   number;
  /** Whole-table count of talents flagged isDuplicate, regardless of the
   *  current status/category/city/duplicate filters — always accurate so
   *  the admin can see "X duplicated" without switching the filter first. */
  duplicateTotal: number;
}

export type TalentDuplicateFilter = "all" | "with" | "without";

interface DuplicateInfoEntry {
  isDuplicate: boolean;
  isBest: boolean;
  matchedBy: ("name" | "phone")[];
  /** Union-find root shared by every member of this talent's duplicate
   *  cluster — stable only within one computeTalentDuplicateInfo() call,
   *  which is all the "with duplication" grouped view needs it for. */
  clusterId: string;
  /** This talent's completion score — already computed here for the
   *  "best in cluster" pick, reused by the score filter. */
  score: number;
}

/** Full-table scan (talent pool is dozens, not thousands — same posture as
 *  fetchAdminDashboardStats's countsByCategory) that finds talents sharing a
 *  normalized full name or phone number with another talent, clusters them
 *  with union-find (so a name-match and a phone-match chain into one group
 *  even across three-plus accounts), and flags the highest-completionScore
 *  member of each cluster as the one an admin would likely keep. Always
 *  computed (not just when the duplicate filter is active) so the table can
 *  show the DUPLICATE badge even on the unfiltered "all" view. */
async function computeTalentDuplicateInfo(): Promise<Map<string, DuplicateInfoEntry>> {
  const { data } = await adminClient
    .from("profiles")
    .select(`
      id, full_name, phone_number, avatar_url, city, bio,
      talent_profiles!inner (id, category, social_links, packages, specialties, availability, bio)
    `)
    .eq("role", "talent");

  const rows = data ?? [];
  const tpOf = (r: (typeof rows)[number]) => (Array.isArray(r.talent_profiles) ? r.talent_profiles[0] : r.talent_profiles);

  const tpIds = rows.map((r) => tpOf(r)?.id).filter((id): id is string => !!id);
  const { data: portfolioRows } = tpIds.length
    ? await adminClient.from("portfolio_items").select("talent_id").in("talent_id", tpIds)
    : { data: [] };
  const hasPortfolio = new Set((portfolioRows ?? []).map((r) => r.talent_id));

  const normalizeName = (n: string | null) => (n ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const normalizePhone = (p: string | null) => (p ? toIntlDigits(p) : "");

  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x);
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const r of rows) find(r.id);

  const byName = new Map<string, string[]>();
  const byPhone = new Map<string, string[]>();
  for (const r of rows) {
    const nameKey = normalizeName(r.full_name);
    if (nameKey) (byName.get(nameKey) ?? (byName.set(nameKey, []), byName.get(nameKey)!)).push(r.id);
    const phoneKey = normalizePhone((r as Record<string, unknown>).phone_number as string | null);
    if (phoneKey) (byPhone.get(phoneKey) ?? (byPhone.set(phoneKey, []), byPhone.get(phoneKey)!)).push(r.id);
  }

  const matchedBy = new Map<string, Set<"name" | "phone">>();
  const markMatch = (ids: string[], kind: "name" | "phone") => {
    if (ids.length < 2) return;
    for (const id of ids) (matchedBy.get(id) ?? (matchedBy.set(id, new Set()), matchedBy.get(id)!)).add(kind);
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  };
  for (const ids of byName.values())  markMatch(ids, "name");
  for (const ids of byPhone.values()) markMatch(ids, "phone");

  const clusters = new Map<string, string[]>();
  for (const r of rows) {
    const root = find(r.id);
    (clusters.get(root) ?? (clusters.set(root, []), clusters.get(root)!)).push(r.id);
  }

  const scoreById = new Map<string, number>();
  for (const r of rows) {
    const tp = tpOf(r);
    if (!tp) continue;
    scoreById.set(r.id, calculateCompletion(r, tp, hasPortfolio.has(tp.id) ? [{}] : []).score);
  }

  const result = new Map<string, DuplicateInfoEntry>();
  for (const [root, members] of clusters.entries()) {
    const isDup = members.length > 1;
    let bestId: string | null = null;
    let bestScore = -1;
    if (isDup) {
      for (const id of members) {
        const s = scoreById.get(id) ?? 0;
        if (s > bestScore) { bestScore = s; bestId = id; }
      }
    }
    for (const id of members) {
      result.set(id, {
        isDuplicate: isDup,
        isBest: isDup && id === bestId,
        matchedBy: Array.from(matchedBy.get(id) ?? []),
        clusterId: root,
        score: scoreById.get(id) ?? 0,
      });
    }
  }
  return result;
}

/** Shared row-shape -> AdminTalent[] builder used by both the plain
 *  (DB-paginated) path and the "with duplication" grouped path below —
 *  email lookup + completion-score are bounded to whatever page of rows is
 *  passed in, same per-page cost class either way. */
async function buildAdminTalents(
  rows: Record<string, unknown>[],
  duplicateInfo: Map<string, DuplicateInfoEntry>,
): Promise<AdminTalent[]> {
  const tpOf = (r: Record<string, unknown>) => {
    const tp = r.talent_profiles;
    return (Array.isArray(tp) ? tp[0] : tp) as Record<string, unknown> | null | undefined;
  };

  const tpIds = rows.map((r) => tpOf(r)?.id).filter((id): id is string => !!id);
  const { data: portfolioRows } = tpIds.length
    ? await adminClient.from("portfolio_items").select("talent_id").in("talent_id", tpIds)
    : { data: [] };
  const hasPortfolio = new Set((portfolioRows ?? []).map((r) => r.talent_id));

  const profileIds = rows.map((r) => r.id as string);
  const emailResults = await Promise.all(
    profileIds.map((id) => adminClient.auth.admin.getUserById(id).then(
      (res) => res.data.user?.email ?? null,
      () => null,
    )),
  );
  const emailMap = Object.fromEntries(profileIds.map((id, i) => [id, emailResults[i]]));

  return rows.flatMap((p) => {
    const tp = tpOf(p);
    if (!tp) return [];

    const isApproved   = p.is_approved   as boolean ?? true;
    const isSuspended   = p.is_suspended as boolean ?? false;
    const accountStatus = isSuspended ? "suspended" : isApproved ? "active" : "pending";
    const talentStatus: AdminTalent["status"] = (tp.status as AdminTalent["status"]) ?? "pending";
    const id = p.id as string;

    return [{
      profileId:       id,
      talentProfileId: tp.id as string,
      fullName:        p.full_name as string | null,
      handle:          p.handle as string | null,
      email:           emailMap[id] ?? null,
      phoneNumber:     p.phone_number as string | null ?? null,
      avatarUrl:       p.avatar_url as string | null,
      category:        tp.category as string | null,
      city:            p.city as string | null,
      createdAt:       p.created_at as string,
      status:          talentStatus,
      approvedAt:      tp.approved_at      as string | null ?? null,
      rejectionReason: tp.rejection_reason as string | null ?? null,
      avgRating:       tp.avg_rating    as number | null ?? null,
      totalReviews:    tp.total_reviews as number | null ?? null,
      accountStatus,
      blockReason:     null,
      isVerified:      p.is_verified as boolean ?? false,
      balance:         p.balance     as number  ?? 0,
      completionScore: calculateCompletion(p, tp, hasPortfolio.has(tp.id as string) ? [{}] : []).score,
      isDuplicate:        duplicateInfo.get(id)?.isDuplicate ?? false,
      isDuplicateBest:    duplicateInfo.get(id)?.isBest ?? false,
      duplicateMatchedBy: duplicateInfo.get(id)?.matchedBy ?? [],
    }];
  });
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
  category,
  city,
  sort,
  dir,
  duplicate = "all",
  q,
  score,
  scoreOp,
}: AdminTalentsPageParams): Promise<AdminTalentsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const sortCol   = sort && TALENT_SORTABLE.has(sort) ? sort : "created_at";
  const ascending = sort ? dir !== "desc" : false;

  // Always computed (cheap full-table scan, see its own comment) so every
  // row can carry a DUPLICATE badge even on the unfiltered view, and so the
  // with/without toggle below has a ready-made id list to restrict to.
  const duplicateInfo = await computeTalentDuplicateInfo();
  const duplicateTotal = Array.from(duplicateInfo.values()).filter((v) => v.isDuplicate).length;

  // Score filter → an id allow-list (null = no score filter). Both `score`
  // and `scoreOp` must be present; a half-specified filter is ignored.
  const scoreIds: Set<string> | null =
    scoreOp && typeof score === "number" && Number.isFinite(score)
      ? new Set(Array.from(duplicateInfo.entries()).filter(([, v]) => scoreMatches(v.score, scoreOp, score)).map(([id]) => id))
      : null;

  const SELECT = `
    id, handle, full_name, avatar_url, city, bio, created_at, phone_number,
    is_approved, is_suspended, is_verified, balance,
    talent_profiles!inner (
      id, category, avg_rating, total_reviews, status, approved_at, rejection_reason,
      specialties, social_links, packages, availability, bio
    )
  `;

  // "With duplication" ignores the normal column sort and groups instead —
  // every cluster's members sit back-to-back (best-completionScore member
  // first in each group), which a plain created_at/name sort can't do since
  // grouping isn't a real column. duplicateTotal is small (dozens, not
  // thousands — same posture as computeTalentDuplicateInfo's own scan), so
  // this fetches every matching row unpaginated and paginates in JS after
  // grouping, instead of the DB range() used below.
  if (duplicate === "with") {
    const dupIds = Array.from(duplicateInfo.entries())
      .filter(([id, v]) => v.isDuplicate && (!scoreIds || scoreIds.has(id)))
      .map(([id]) => id);
    if (dupIds.length === 0) return { talents: [], total: 0, duplicateTotal };

    let groupedQuery = adminClient.from("profiles").select(SELECT).eq("role", "talent").in("id", dupIds);
    if (status && status !== "all") groupedQuery = groupedQuery.eq("talent_profiles.status", status);
    if (category) groupedQuery = groupedQuery.eq("talent_profiles.category", category);
    if (city) groupedQuery = groupedQuery.eq("city", city);
    groupedQuery = applyTalentSearch(groupedQuery, q);

    const { data: groupedData, error: groupedError } = await groupedQuery;
    if (groupedError) return { talents: [], total: 0, duplicateTotal };
    const rows = (groupedData ?? []) as unknown as Record<string, unknown>[];

    const clusterOrder: string[] = [];
    const clusters = new Map<string, Record<string, unknown>[]>();
    for (const r of rows) {
      const cid = duplicateInfo.get(r.id as string)?.clusterId ?? (r.id as string);
      if (!clusters.has(cid)) { clusters.set(cid, []); clusterOrder.push(cid); }
      clusters.get(cid)!.push(r);
    }
    for (const cid of clusterOrder) {
      clusters.get(cid)!.sort((a, b) => {
        const aBest = duplicateInfo.get(a.id as string)?.isBest ? 1 : 0;
        const bBest = duplicateInfo.get(b.id as string)?.isBest ? 1 : 0;
        return bBest - aBest;
      });
    }
    // Groups themselves ordered by name so the list reads predictably
    // (not e.g. shuffled by fetch order) — the grouping is the point, not
    // which group comes first.
    clusterOrder.sort((a, b) => {
      const an = (clusters.get(a)![0].full_name as string | null) ?? "";
      const bn = (clusters.get(b)![0].full_name as string | null) ?? "";
      return an.localeCompare(bn);
    });

    const sorted = clusterOrder.flatMap((cid) => clusters.get(cid)!);
    const pageRows = sorted.slice(from, from + pageSize);
    const talents = await buildAdminTalents(pageRows, duplicateInfo);
    return { talents, total: sorted.length, duplicateTotal };
  }

  // Id allow-list from the duplicate ("without") and score filters, shared by
  // the paths below (null = no restriction).
  const restrictIds: string[] | null = (duplicate === "without" || scoreIds)
    ? Array.from(duplicateInfo.entries())
        .filter(([id, v]) => (duplicate !== "without" || !v.isDuplicate) && (!scoreIds || scoreIds.has(id)))
        .map(([id]) => id)
    : null;

  // Sorting by score: completionScore is computed in JS, not a column, so a
  // DB .order() cannot do it. Same approach as the grouped duplicate view —
  // fetch every matching row unpaginated (talent pool is small), sort in JS
  // by the already-computed score, then paginate.
  if (sort === "score") {
    if (restrictIds && restrictIds.length === 0) return { talents: [], total: 0, duplicateTotal };
    let scoreQuery = adminClient.from("profiles").select(SELECT).eq("role", "talent");
    if (status && status !== "all") scoreQuery = scoreQuery.eq("talent_profiles.status", status);
    if (category) scoreQuery = scoreQuery.eq("talent_profiles.category", category);
    if (city) scoreQuery = scoreQuery.eq("city", city);
    scoreQuery = applyTalentSearch(scoreQuery, q);
    if (restrictIds) scoreQuery = scoreQuery.in("id", restrictIds);

    const { data: scoreData, error: scoreError } = await scoreQuery;
    if (scoreError) return { talents: [], total: 0, duplicateTotal };
    const scoreRows = (scoreData ?? []) as unknown as Record<string, unknown>[];
    const sign = dir === "desc" ? -1 : 1;
    scoreRows.sort((a, b) => {
      const diff = (duplicateInfo.get(a.id as string)?.score ?? 0) - (duplicateInfo.get(b.id as string)?.score ?? 0);
      return diff !== 0 ? diff * sign : String(a.id).localeCompare(String(b.id));
    });
    const talents = await buildAdminTalents(scoreRows.slice(from, from + pageSize), duplicateInfo);
    return { talents, total: scoreRows.length, duplicateTotal };
  }

  let query = adminClient
    .from("profiles")
    .select(SELECT, { count: "exact" })
    .eq("role", "talent")
    .order(sortCol, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (status && status !== "all") query = query.eq("talent_profiles.status", status);
  if (category) query = query.eq("talent_profiles.category", category);
  if (city) query = query.eq("city", city);
  query = applyTalentSearch(query, q);

  if (restrictIds) {
    if (restrictIds.length === 0) return { talents: [], total: 0, duplicateTotal };
    query = query.in("id", restrictIds);
  }

  const { data, count, error } = await query;
  if (error) return { talents: [], total: 0, duplicateTotal };

  const talents = await buildAdminTalents((data ?? []) as unknown as Record<string, unknown>[], duplicateInfo);
  return { talents, total: count ?? talents.length, duplicateTotal };
}

export const BOOKING_SORT_KEYS = ["status", "amount", "created_at", "paid_at", "completed_at"] as const;
export type BookingSortKey = (typeof BOOKING_SORT_KEYS)[number];
const BOOKING_SORTABLE = new Set<string>(BOOKING_SORT_KEYS);

export interface AdminBookingsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
  sort?:     string;
  dir?:      "asc" | "desc";
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
  sort,
  dir,
}: AdminBookingsPageParams): Promise<AdminBookingsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const sortCol   = sort && BOOKING_SORTABLE.has(sort) ? sort : "created_at";
  const ascending = sort ? dir !== "desc" : false;

  let query = adminClient
    .from("bookings")
    .select("id, status, created_at, amount, notes, brief_url, paid_at, completed_at, brand_id, talent_id", { count: "exact" })
    .order(sortCol, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
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

  // Payments the admin still needs to act on — a brand uploaded a proof
  // screenshot and it hasn't been confirmed (-> held) yet. Bounded to this
  // page's own booking ids, same pattern as everything else here.
  const bookingIds = bookings.map((b) => b.id);
  const { data: payments } = bookingIds.length
    ? await adminClient.from("payments").select("id, booking_id, status, proof_url").in("booking_id", bookingIds).eq("status", "pending")
    : { data: [] };
  const paymentMap = Object.fromEntries((payments ?? []).map((p) => [p.booking_id, p]));

  const joined = bookings.map(b => {
    const userId = tpMap[b.talent_id];
    return {
      ...b,
      brand:   brandMap[b.brand_id]  ?? null,
      talent:  userId ? talentMap[userId] : null,
      payment: paymentMap[b.id] ?? null,
    };
  }) as AdminBooking[];

  return { bookings: joined, total: count ?? joined.length };
}

export const REVIEW_SORT_KEYS = ["rating", "status", "created_at"] as const;
const REVIEW_SORTABLE = new Set<string>(REVIEW_SORT_KEYS);

export interface AdminReviewsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
  sort?:     string;
  dir?:      "asc" | "desc";
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
  sort,
  dir,
}: AdminReviewsPageParams): Promise<AdminReviewsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const sortCol   = sort && REVIEW_SORTABLE.has(sort) ? sort : "created_at";
  const ascending = sort ? dir !== "desc" : false;
  // The no-status-column fallback schema can't sort by "status".
  const fallbackSortCol = sortCol === "status" ? "created_at" : sortCol;

  // Step 1: fetch reviews (try with new columns first)
  let reviews: Record<string, unknown>[] = [];
  let total = 0;

  let query = adminClient
    .from("reviews")
    .select("id, rating, comment, status, proof_link, review_type, created_at, brand_id, talent_id", { count: "exact" })
    .order(sortCol, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
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
      .order(fallbackSortCol, { ascending, nullsFirst: false })
      .order("id", { ascending: true })
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

export const VERIFICATION_SORT_KEYS = ["status", "submitted_at"] as const;
const VERIFICATION_SORTABLE = new Set<string>(VERIFICATION_SORT_KEYS);

export interface AdminVerificationsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
  sort?:     string;
  dir?:      "asc" | "desc";
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
  sort,
  dir,
}: AdminVerificationsPageParams): Promise<AdminVerificationsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const sortCol   = sort && VERIFICATION_SORTABLE.has(sort) ? sort : "submitted_at";
  const ascending = sort ? dir !== "desc" : false;

  let query = adminClient
    .from("talent_verifications")
    .select("id, talent_id, status, submitted_at, id_document_url, selfie_url, social_proof, rejection_reason", { count: "exact" })
    .order(sortCol, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
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

export const BRAND_SORT_KEYS = ["full_name", "city", "brand_status", "created_at"] as const;
const BRAND_SORTABLE = new Set<string>(BRAND_SORT_KEYS);

export interface AdminBrandsPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
  sort?:     string;
  dir?:      "asc" | "desc";
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
  sort,
  dir,
}: AdminBrandsPageParams): Promise<AdminBrandsPageResult> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const sortCol   = sort && BRAND_SORTABLE.has(sort) ? sort : "created_at";
  const ascending = sort ? dir !== "desc" : false;

  let query = adminClient
    .from("profiles")
    .select(`
      id, full_name, handle, city, created_at,
      brand_status, tax_document_url, brand_rejection_reason,
      is_approved, is_suspended
    `, { count: "exact" })
    .eq("role", "brand")
    .order(sortCol, { ascending, nullsFirst: false })
    .order("id", { ascending: true })
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
  status:      "new" | "seen" | "process" | "done";
  adminReply:  string | null;
  repliedAt:   string | null;
  context:     { page?: string | null; pageError?: string | null; submittedBy?: { type: "user" | "admin"; name: string | null } } | null;
  attachmentUrl:  string | null;
  attachmentType: "image" | "video" | null;
  /** Free-text claim tag an admin writes on a ticket (e.g. "admin-1") —
   *  not a profiles FK, see the migration's own comment. */
  assignedAdmin: string | null;
  /** Internal-only note, never shown to the ticket submitter — distinct
   *  from adminReply, which is user-facing. */
  adminNote:     string | null;
  /** talent_profiles.id this ticket is about — set only for tickets filed
   *  from the talents table / edit-profile page (20260916_support_ticket_
   *  talent_link.sql). Null for a self-reported ticket. */
  talentId:      string | null;
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
    .select("id, name, email, phone, type, subject, message, status, admin_reply, replied_at, context, attachment_url, attachment_type, assigned_admin, admin_note, talent_id, created_at", { count: "exact" })
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
    status:     (r.status ?? "new") as "new" | "seen" | "process" | "done",
    adminReply: r.admin_reply,
    repliedAt:  r.replied_at,
    context:    r.context,
    attachmentUrl:  r.attachment_url,
    attachmentType: (r as Record<string, unknown>).attachment_type as "image" | "video" | null ?? null,
    assignedAdmin:  (r as Record<string, unknown>).assigned_admin as string | null ?? null,
    adminNote:      (r as Record<string, unknown>).admin_note as string | null ?? null,
    talentId:       (r as Record<string, unknown>).talent_id as string | null ?? null,
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

// ─── Daily traffic trend ────────────────────────────────────────────────────
// Backs the /admin/user-activity trend graph — page views, signups, clicks
// and profile views per day. No GROUP BY available through the Supabase
// query builder for a jsonb-free straight count-by-day, so this fetches
// (event_name, created_at) for the four tracked event types and buckets by
// calendar day in JS — same "resolve in JS, not a DB join/aggregate" posture
// as fetchAdminUserActivityVisitors right below, and capped the same way for
// the same reason (see DAILY_TRAFFIC_SCAN_LIMIT).

export interface AdminDailyTrafficPoint {
  date:               string; // "YYYY-MM-DD"
  pageViews:          number;
  signups:            number;
  clicks:             number;
  talentProfileViews: number;
}

const DAILY_TRAFFIC_SCAN_LIMIT = 20_000;

export async function fetchAdminDailyTraffic(range: AdminUserActivityDateRange = {}): Promise<AdminDailyTrafficPoint[]> {
  let query = adminClient
    .from("user_events")
    .select("event_name, created_at")
    .in("event_name", ["page_view", "signup", "click", "talent_profile_view"])
    .order("created_at", { ascending: true })
    .limit(DAILY_TRAFFIC_SCAN_LIMIT);
  query = applyUserActivityDateRange(query, range);

  const { data: rows, error } = await query;
  if (error || !rows?.length) return [];

  const byDate = new Map<string, AdminDailyTrafficPoint>();
  for (const r of rows) {
    const date = r.created_at.slice(0, 10);
    let point = byDate.get(date);
    if (!point) {
      point = { date, pageViews: 0, signups: 0, clicks: 0, talentProfileViews: 0 };
      byDate.set(date, point);
    }
    if (r.event_name === "page_view") point.pageViews += 1;
    else if (r.event_name === "signup") point.signups += 1;
    else if (r.event_name === "click") point.clicks += 1;
    else if (r.event_name === "talent_profile_view") point.talentProfileViews += 1;
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Top pages (sitewide) ───────────────────────────────────────────────────
// "Where do events/clicks pile up" — page_view + click counts, and total/avg
// time-on-page, aggregated by path across every visitor. Time-on-page reuses
// clusterPageVisits()/totalDurationByPage() — but those two are written for
// ONE visitor's own timeline (see page-duration-clustering.ts's own comment):
// naively feeding them every visitor's heartbeats pooled together would let
// two different people's same-path heartbeats that happen to land close in
// time get merged into one fictitious "visit". So heartbeats are grouped by
// visitor key FIRST, clustered per visitor, THEN rolled up by path — the
// same per-visitor clustering fetchAdminVisitorDetail does, just for every
// visitor at once instead of one.

export interface AdminTopPage {
  path:        string;
  views:       number;
  clicks:      number;
  totalTimeMs: number;
  avgTimeMs:   number;
}

const TOP_PAGES_SCAN_LIMIT = 20_000;

export async function fetchAdminTopPages(range: AdminUserActivityDateRange = {}): Promise<AdminTopPage[]> {
  let query = adminClient
    .from("user_events")
    .select("event_name, metadata, user_id, session_id, created_at")
    .in("event_name", ["page_view", "click", "page_engagement"])
    .limit(TOP_PAGES_SCAN_LIMIT);
  query = applyUserActivityDateRange(query, range);

  const { data: rows, error } = await query;
  if (error || !rows?.length) return [];

  const views = new Map<string, number>();
  const clicks = new Map<string, number>();
  const engagementByVisitor = new Map<string, EngagementSample[]>();

  for (const r of rows) {
    const m = (r.metadata ?? {}) as Record<string, unknown>;
    const path = typeof m.path === "string" ? m.path : null;
    if (!path) continue;

    if (r.event_name === "page_view") {
      views.set(path, (views.get(path) ?? 0) + 1);
    } else if (r.event_name === "click") {
      clicks.set(path, (clicks.get(path) ?? 0) + 1);
    } else {
      const key = r.user_id ?? `guest:${r.session_id}`;
      const list = engagementByVisitor.get(key) ?? [];
      list.push({ path, duration_ms: typeof m.duration_ms === "number" ? m.duration_ms : 0, created_at: r.created_at });
      engagementByVisitor.set(key, list);
    }
  }

  const timeByPath = new Map<string, { totalMs: number; visitCount: number }>();
  for (const samples of engagementByVisitor.values()) {
    for (const v of clusterPageVisits(samples)) {
      const existing = timeByPath.get(v.path);
      if (existing) { existing.totalMs += v.durationMs; existing.visitCount += 1; }
      else timeByPath.set(v.path, { totalMs: v.durationMs, visitCount: 1 });
    }
  }

  const allPaths = new Set<string>([...views.keys(), ...clicks.keys(), ...timeByPath.keys()]);
  return [...allPaths]
    .map((path) => {
      const t = timeByPath.get(path);
      return {
        path,
        views:       views.get(path) ?? 0,
        clicks:      clicks.get(path) ?? 0,
        totalTimeMs: t?.totalMs ?? 0,
        avgTimeMs:   t && t.visitCount > 0 ? Math.round(t.totalMs / t.visitCount) : 0,
      };
    })
    .sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks));
}

// ─── Signup breakdown (role + talent category) ──────────────────────────────
// "How many of the signups are UGC vs Model" — signup events only carry
// `role` (talent|brand, see app/api/events/route.ts's metadata schema); a
// talent's category isn't decided at signup, it's whatever talent_profiles.
// category is RIGHT NOW for that user (a second join, talent signups only)
// — so this is "current category mix of everyone who signed up in range",
// not "what they picked at signup time". Good enough for "how many UGC
// signed up this month", not meant to survive someone changing category
// after the fact and still calling it a historical breakdown.

export interface AdminSignupBreakdown {
  byRole:     { role: string; count: number }[];
  byCategory: { category: string; count: number }[];
}

const SIGNUP_BREAKDOWN_SCAN_LIMIT = 10_000;

export async function fetchAdminSignupBreakdown(range: AdminUserActivityDateRange = {}): Promise<AdminSignupBreakdown> {
  let query = adminClient
    .from("user_events")
    .select("user_id, metadata")
    .eq("event_name", "signup")
    .limit(SIGNUP_BREAKDOWN_SCAN_LIMIT);
  query = applyUserActivityDateRange(query, range);

  const { data: rows, error } = await query;
  if (error || !rows?.length) return { byRole: [], byCategory: [] };

  const roleCounts = new Map<string, number>();
  const talentUserIds: string[] = [];
  for (const r of rows) {
    const m = (r.metadata ?? {}) as Record<string, unknown>;
    const role = typeof m.role === "string" ? m.role : "unknown";
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
    if (role === "talent" && r.user_id) talentUserIds.push(r.user_id);
  }

  let byCategory: { category: string; count: number }[] = [];
  if (talentUserIds.length) {
    const { data: talentRows } = await adminClient
      .from("talent_profiles")
      .select("user_id, category")
      .in("user_id", talentUserIds);
    const categoryCounts = new Map<string, number>();
    for (const t of talentRows ?? []) {
      const category = t.category ?? "unknown";
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
    byCategory = [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  return {
    byRole: [...roleCounts.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count),
    byCategory,
  };
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
  /** True the moment a `profiles` row exists for them — i.e. they finished
   * registration, independent of whether they ever completed their profile
   * afterward (see AdminVisitorDetail.profileData for that). */
  registered: boolean;
  role:       string | null;
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
    ? await adminClient.from("profiles").select("id, handle, full_name, role").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return [...byKey.entries()]
    .map(([key, v]) => ({
      key,
      userId:     v.userId,
      sessionId:  v.sessionId,
      handle:     v.userId ? profileMap[v.userId]?.handle ?? null : null,
      fullName:   v.userId ? profileMap[v.userId]?.full_name ?? null : null,
      // A user_events row with a user_id always came from a signed-in
      // request, and profiles.id === auth.users.id 1:1 — so a match here
      // (or even just v.userId being set) means they finished registration,
      // not merely that they're "logged in right now."
      registered: Boolean(v.userId),
      role:       v.userId ? profileMap[v.userId]?.role ?? null : null,
      firstSeen:  v.first,
      lastSeen:   v.last,
      eventCount: v.count,
    }))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

// ─── Single-visitor detail ──────────────────────────────────────────────────

/** What a registered visitor has actually filled in so far — profiles'
 * columns plus, for a talent, the handful of talent_profiles fields an
 * admin would otherwise have to open the full editor to see. null fields
 * are rendered as "not filled yet", not hidden — that gap is the point of
 * showing this at all (2026-08-31: "what data did they fill in"). */
export interface AdminVisitorProfileData {
  role:         string | null;
  phoneNumber:  string | null;
  city:         string | null;
  bio:          string | null;
  category:     string | null;
  specialties:  string[] | null;
  availability: string | null;
}

export interface AdminVisitorDetail {
  key:        string;
  userId:     string | null;
  sessionId:  string;
  handle:     string | null;
  fullName:   string | null;
  registered: boolean;
  /** null for a guest who never signed up — there is nothing to show. */
  profileData: AdminVisitorProfileData | null;
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
  let profileData: AdminVisitorProfileData | null = null;
  if (userId) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("handle, full_name, role, phone_number, city, bio")
      .eq("id", userId)
      .maybeSingle();
    handle = profile?.handle ?? null;
    fullName = profile?.full_name ?? null;

    if (profile) {
      let category: string | null = null;
      let specialties: string[] | null = null;
      let availability: string | null = null;
      if (profile.role === "talent") {
        const { data: tp } = await adminClient
          .from("talent_profiles")
          .select("category, specialties, availability")
          .eq("user_id", userId)
          .maybeSingle();
        category = tp?.category ?? null;
        specialties = tp?.specialties?.length ? tp.specialties : null;
        availability = tp?.availability ?? null;
      }
      profileData = {
        role:         profile.role ?? null,
        phoneNumber:  profile.phone_number ?? null,
        city:         profile.city ?? null,
        bio:          profile.bio ?? null,
        category,
        specialties,
        availability,
      };
    }
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
    registered: Boolean(userId),
    profileData,
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

// ─── New-signup profile-completion nudge ───────────────────────────────────────
// Backs the Dashboard's "new registrations" card — every active talent with
// zero portfolio_items, regardless of approval status, newest first. Same
// criteria this session used by hand (scripts/_tmp_find_incomplete_talents,
// _tmp_find_today_incomplete) before it became a standing feature — a
// profile with no photos/videos never crosses COMPLETION_THRESHOLDS.
// appearInSearch (60) no matter what else is filled in, so it's the single
// highest-value nudge to send a fresh signup.

export interface AdminIncompleteSignup {
  userId:          string;
  fullName:        string | null;
  handle:          string | null;
  email:           string | null;
  createdAt:       string;
  talentStatus:    string;
  alreadyReminded: boolean;
}

const INCOMPLETE_SIGNUPS_SCAN_LIMIT = 200;

export async function fetchAdminIncompleteSignups(): Promise<AdminIncompleteSignup[]> {
  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, created_at")
    .eq("role", "talent")
    .eq("account_status", "active")
    .order("created_at", { ascending: false })
    .limit(INCOMPLETE_SIGNUPS_SCAN_LIMIT);
  if (error || !profiles?.length) return [];

  const userIds = profiles.map((p) => p.id);
  const { data: tps } = await adminClient
    .from("talent_profiles")
    .select("id, user_id, status")
    .in("user_id", userIds);
  const tpByUser = Object.fromEntries((tps ?? []).map((t) => [t.user_id, t]));

  const tpIds = (tps ?? []).map((t) => t.id);
  const { data: portfolioRows } = tpIds.length
    ? await adminClient.from("portfolio_items").select("talent_id").in("talent_id", tpIds)
    : { data: [] };
  const portfolioCount: Record<string, number> = {};
  for (const row of portfolioRows ?? []) portfolioCount[row.talent_id] = (portfolioCount[row.talent_id] ?? 0) + 1;

  const { data: reminded } = await adminClient
    .from("email_log")
    .select("recipient_id")
    .eq("template", "complete_profile_reminder")
    .eq("status", "sent")
    .in("recipient_id", userIds);
  const remindedSet = new Set((reminded ?? []).map((r) => r.recipient_id));

  const targets = profiles
    .map((p) => {
      const tp = tpByUser[p.id];
      return { profile: p, tp, portfolioCount: tp ? portfolioCount[tp.id] ?? 0 : 0 };
    })
    .filter(({ tp, portfolioCount }) => tp && portfolioCount === 0);

  // Auth emails aren't in `profiles` — one lookup per row, same pattern the
  // one-off backfill scripts used. Small scale (new signups, not the whole
  // user base) so N sequential admin API calls is fine.
  const withEmail = await Promise.all(
    targets.map(async ({ profile, tp }) => {
      const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);
      return {
        userId:          profile.id,
        fullName:        profile.full_name,
        handle:          profile.handle,
        email:           authUser?.user?.email ?? null,
        createdAt:       profile.created_at,
        talentStatus:    tp!.status,
        alreadyReminded: remindedSet.has(profile.id),
      };
    })
  );

  return withEmail;
}

// ─── New media uploaded — pending talents who now have portfolio content ──────
// The counterpart to fetchAdminIncompleteSignups: instead of "who still has
// zero photos/videos", this is "who has added at least one since — go review
// and approve them". Scoped to status = 'pending' only, since an
// approved/rejected/suspended talent isn't waiting on this decision anymore.

export interface AdminNewMediaUpload {
  userId:          string;
  talentProfileId: string;
  fullName:        string | null;
  handle:          string | null;
  email:           string | null;
  registeredAt:    string;
  photoCount:      number;
  videoCount:      number;
  latestUploadAt:  string;
}

export async function fetchAdminNewMediaUploads(): Promise<AdminNewMediaUpload[]> {
  const { data: tps, error } = await adminClient
    .from("talent_profiles")
    .select("id, user_id, status")
    .eq("status", "pending");
  if (error || !tps?.length) return [];

  const tpIds = tps.map((t) => t.id);
  const { data: portfolioRows } = await adminClient
    .from("portfolio_items")
    .select("talent_id, media_type, created_at")
    .in("talent_id", tpIds);

  const stats: Record<string, { photo: number; video: number; latest: string }> = {};
  for (const row of portfolioRows ?? []) {
    const s = (stats[row.talent_id] ??= { photo: 0, video: 0, latest: row.created_at });
    if (row.media_type === "video") s.video++; else s.photo++;
    if (row.created_at > s.latest) s.latest = row.created_at;
  }

  const targets = tps
    .map((tp) => ({ tp, stat: stats[tp.id] }))
    .filter((t): t is { tp: typeof tps[number]; stat: NonNullable<typeof t.stat> } => !!t.stat);
  if (!targets.length) return [];

  const userIds = targets.map((t) => t.tp.user_id);
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, created_at")
    .in("id", userIds);
  const profileById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  // Same bounded one-lookup-per-row pattern as fetchAdminIncompleteSignups —
  // small set (pending talents with new uploads, not the whole user base).
  const withEmail = await Promise.all(
    targets.map(async ({ tp, stat }) => {
      const profile = profileById[tp.user_id];
      const { data: authUser } = await adminClient.auth.admin.getUserById(tp.user_id);
      return {
        userId:          tp.user_id,
        talentProfileId: tp.id,
        fullName:        profile?.full_name ?? null,
        handle:          profile?.handle ?? null,
        email:           authUser?.user?.email ?? null,
        registeredAt:    profile?.created_at ?? stat.latest,
        photoCount:      stat.photo,
        videoCount:      stat.video,
        latestUploadAt:  stat.latest,
      };
    })
  );

  return withEmail.sort((a, b) => (a.latestUploadAt < b.latestUploadAt ? 1 : -1));
}

// ─── Bio phone-number alert ─────────────────────────────────────────────────
// Backs the Dashboard's "phone numbers in bio" card — a talent writing a
// direct phone number into their bio lets a brand contact them outside the
// platform's own chat/booking pipeline (CLAUDE.md §10.1), which is exactly
// what the fee-earning flow depends on staying inside the app. Detection
// itself is pure (bio-phone-detection.ts) — this only fetches the two bio
// columns (profiles.bio is where the live edit UI writes today,
// talent_profiles.bio is legacy but still checked, see CLAUDE.md's "two
// JSONB grab-bags" section for the general pattern of this app carrying old
// fields forward) and scans every active talent, same bounded-scan posture
// as fetchAdminIncompleteSignups right above.

export interface AdminBioPhoneAlert {
  userId:          string;
  talentProfileId: string | null;
  fullName:        string | null;
  handle:          string | null;
  bio:             string;
  detectedNumbers: string[];
}

const BIO_PHONE_SCAN_LIMIT = 300;

export async function fetchAdminBioPhoneAlerts(): Promise<AdminBioPhoneAlert[]> {
  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, bio")
    .eq("role", "talent")
    .limit(BIO_PHONE_SCAN_LIMIT);
  if (error || !profiles?.length) return [];

  const userIds = profiles.map((p) => p.id);
  const { data: tps } = await adminClient
    .from("talent_profiles")
    .select("id, user_id, bio")
    .in("user_id", userIds);
  const tpByUser = Object.fromEntries((tps ?? []).map((t) => [t.user_id, t]));

  const alerts: AdminBioPhoneAlert[] = [];
  for (const p of profiles) {
    const tp = tpByUser[p.id];
    const combinedBio = [p.bio, tp?.bio].filter((b): b is string => !!b).join("\n");
    const matches = extractPhoneCandidates(combinedBio);
    if (matches.length === 0) continue;

    alerts.push({
      userId: p.id,
      talentProfileId: tp?.id ?? null,
      fullName: p.full_name,
      handle: p.handle,
      bio: combinedBio,
      detectedNumbers: matches.map((m) => m.raw),
    });
  }

  return alerts;
}

// ─── Admin booking detail ───────────────────────────────────────────────────
// Everything /admin/bookings/[id] shows: the booking core row, brief,
// deliverables, payment, review, the booking_history audit trail, and the
// raw chat transcript — each actor (brand/talent/admin) resolved to a
// display name via the same bounded-scan + batch-join pattern as everything
// else in this file (CLAUDE.md §11 rule 10).
export async function fetchAdminBookingDetail(id: string): Promise<AdminBookingFull | null> {
  const { data: booking, error } = await adminClient
    .from("bookings")
    .select("id, status, amount, service_type, notes, created_at, paid_at, completed_at, brand_id, talent_id, talent_user_id, job_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !booking) return null;

  const [
    brandRes,
    tpRes,
    jobRes,
    briefRes,
    delivRes,
    payRes,
    reviewRes,
    historyRes,
    convRes,
  ] = await Promise.all([
    adminClient.from("profiles").select("full_name, handle").eq("id", booking.brand_id).maybeSingle(),
    booking.talent_id
      ? adminClient.from("talent_profiles").select("user_id").eq("id", booking.talent_id).maybeSingle()
      : Promise.resolve({ data: null }),
    booking.job_id
      ? adminClient.from("jobs").select("id, title").eq("id", booking.job_id).maybeSingle()
      : Promise.resolve({ data: null }),
    adminClient.from("booking_briefs").select("*").eq("booking_id", id).maybeSingle(),
    adminClient.from("deliverables").select("*").eq("booking_id", id).order("created_at", { ascending: false })
      .then((res) => (res.error?.code === "PGRST205" ? { data: [] as Record<string, unknown>[] } : res)),
    adminClient.from("payments").select("*").eq("booking_id", id).maybeSingle(),
    adminClient.from("reviews").select("*").eq("booking_id", id).maybeSingle(),
    adminClient.from("booking_history").select("*").eq("booking_id", id).order("created_at", { ascending: true }),
    adminClient.from("conversations").select("id").eq("brand_id", booking.brand_id).eq("talent_id", booking.talent_user_id ?? "").maybeSingle(),
  ]);

  const talentUserId = tpRes.data?.user_id ?? booking.talent_user_id ?? null;
  const talentRes = talentUserId
    ? await adminClient.from("profiles").select("full_name, handle").eq("id", talentUserId).maybeSingle()
    : { data: null };

  const messagesRes = convRes.data
    ? await adminClient.from("messages").select("id, content, created_at, sender_id").eq("conversation_id", convRes.data.id).order("created_at", { ascending: true })
    : { data: [] as { id: string; content: string; created_at: string; sender_id: string }[] };

  // One batch for every profile referenced across history + messages, so an
  // admin who changed a status shows a name instead of a bare uuid.
  const actorIds = [
    ...new Set([
      ...(historyRes.data ?? []).map((h) => h.changed_by).filter(Boolean),
      ...(messagesRes.data ?? []).map((m) => m.sender_id).filter(Boolean),
    ]),
  ] as string[];
  const { data: actorProfiles } = actorIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle").in("id", actorIds)
    : { data: [] };
  const actorMap = Object.fromEntries((actorProfiles ?? []).map((p) => [p.id, { full_name: p.full_name, handle: p.handle }]));

  return {
    id:           booking.id,
    status:       booking.status,
    amount:       booking.amount,
    service_type: booking.service_type,
    notes:        booking.notes,
    created_at:   booking.created_at,
    paid_at:      booking.paid_at,
    completed_at: booking.completed_at,
    brand:        brandRes.data ?? null,
    talent:       talentRes.data ?? null,
    job:          jobRes.data ?? null,
    brief:        briefRes.data ?? null,
    deliverables: delivRes.data ?? [],
    payment:      payRes.data ?? null,
    review:       reviewRes.data ?? null,
    history: (historyRes.data ?? []).map((h) => ({
      id:          h.id,
      from_status: h.from_status,
      to_status:   h.to_status,
      note:        h.note,
      created_at:  h.created_at,
      changedBy:   h.changed_by ? actorMap[h.changed_by] ?? null : null,
    })),
    messages: (messagesRes.data ?? []).map((m) => ({
      id:         m.id,
      content:    m.content,
      created_at: m.created_at,
      sender:     m.sender_id ? actorMap[m.sender_id] ?? null : null,
    })),
  };
}

// ─── Talent Actions CRM ──────────────────────────────────────────────────────
// Contact log for an already-onboarded talent (any category) — who on the
// team called/messaged them, what happened, and an optional follow-up date
// that triggers a reminder notification once due. Mirrors the leads CRM's
// lead_actions (features/leads/services/leads.service.ts) but without the
// stage/assignee machinery, which doesn't apply here.

interface TalentActionRow {
  id: string;
  talent_id: string;
  action_type: string;
  note: string | null;
  performed_by: string | null;
  follow_up_at: string | null;
  notified_at: string | null;
  created_at: string;
}

async function talentActionNamesFor(userIds: (string | null)[]): Promise<Record<string, string | null>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return {};
  const { data } = await adminClient.from("profiles").select("id, full_name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
}

function toTalentAction(row: TalentActionRow, names: Record<string, string | null>): TalentAction {
  return {
    id:              row.id,
    talentId:        row.talent_id,
    actionType:      row.action_type,
    note:            row.note,
    performedBy:     row.performed_by,
    performedByName: row.performed_by ? names[row.performed_by] ?? null : null,
    followUpAt:      row.follow_up_at,
    notifiedAt:      row.notified_at,
    createdAt:       row.created_at,
  };
}

export async function fetchTalentActions(talentProfileId: string): Promise<TalentAction[]> {
  const { data, error } = await adminClient
    .from("talent_actions")
    .select("*")
    .eq("talent_id", talentProfileId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const names = await talentActionNamesFor((data as TalentActionRow[]).map((r) => r.performed_by));
  return (data as TalentActionRow[]).map((row) => toTalentAction(row, names));
}

export async function addTalentAction(talentProfileId: string, input: AddTalentActionInput): Promise<TalentAction | null> {
  const { data, error } = await adminClient
    .from("talent_actions")
    .insert({
      talent_id:    talentProfileId,
      action_type:  input.actionType,
      note:         input.note ?? null,
      performed_by: input.performedBy,
      follow_up_at: input.followUpAt ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[admin] addTalentAction failed:", error?.message);
    return null;
  }

  await adminClient.from("talent_action_audit_log").insert({
    talent_action_id: data.id, talent_id: talentProfileId, changed_by: input.performedBy,
    action: "created", new_value: data,
  });

  const names = await talentActionNamesFor([data.performed_by]);
  return toTalentAction(data as TalentActionRow, names);
}

/** Editable by any admin, not just the action's author — a shared team
 *  schedule, same posture as the leads CRM's updateActionFollowUp. */
export async function updateTalentActionFollowUp(actionId: string, followUpAt: string | null): Promise<boolean> {
  const { error } = await adminClient
    .from("talent_actions")
    .update({ follow_up_at: followUpAt, notified_at: null })
    .eq("id", actionId);
  return !error;
}

export interface UpdateTalentActionInput {
  actionType?: string;
  note?: string | null;
  followUpAt?: string | null;
}

/** Full edit (type/note/follow-up), same "any admin can edit" posture as
 *  updateTalentActionFollowUp above. Changing follow_up_at also clears
 *  notified_at — a re-dated reminder should fire again, not stay silenced
 *  by a stale notification from the old date. `changedBy` is only for the
 *  audit trail — this table has no per-admin ownership check. */
export async function updateTalentAction(actionId: string, input: UpdateTalentActionInput, changedBy: string | null): Promise<boolean> {
  const patch: Record<string, unknown> = {};
  if (input.actionType !== undefined) patch.action_type = input.actionType;
  if (input.note !== undefined) patch.note = input.note;
  if (input.followUpAt !== undefined) {
    patch.follow_up_at = input.followUpAt;
    patch.notified_at = null;
  }
  if (Object.keys(patch).length === 0) return true;

  const { data: before } = await adminClient.from("talent_actions").select("*").eq("id", actionId).single();
  const { data: after, error } = await adminClient.from("talent_actions").update(patch).eq("id", actionId).select("*").single();
  if (error) return false;

  if (before) {
    await adminClient.from("talent_action_audit_log").insert({
      talent_action_id: actionId, talent_id: before.talent_id, changed_by: changedBy,
      action: "updated", old_value: before, new_value: after,
    });
  }
  return true;
}

export async function deleteTalentAction(actionId: string, changedBy: string | null): Promise<boolean> {
  const { data: before } = await adminClient.from("talent_actions").select("*").eq("id", actionId).single();
  const { error } = await adminClient.from("talent_actions").delete().eq("id", actionId);
  if (error) return false;

  if (before) {
    await adminClient.from("talent_action_audit_log").insert({
      talent_action_id: null, talent_id: before.talent_id, changed_by: changedBy,
      action: "deleted", old_value: before,
    });
  }
  return true;
}

/** Full change history for one talent's CRM actions — edits and deletes,
 *  newest first. A deleted action's full snapshot lives in oldValue even
 *  though the row itself is gone (talent_action_id → NULL via ON DELETE
 *  SET NULL, the log entry survives independently). */
export async function fetchTalentActionAuditLog(talentProfileId: string): Promise<TalentActionAuditEntry[]> {
  const { data, error } = await adminClient
    .from("talent_action_audit_log")
    .select("*")
    .eq("talent_id", talentProfileId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const names = await talentActionNamesFor(data.map((r) => r.changed_by));
  return data.map((r) => ({
    id: r.id,
    action: r.action,
    changedByName: r.changed_by ? names[r.changed_by] ?? null : null,
    oldValue: r.old_value,
    newValue: r.new_value,
    createdAt: r.created_at,
  }));
}

export interface DueTalentFollowUp {
  actionId:    string;
  talentId:    string;
  talentName:  string | null;
  performedBy: string | null;
}

export async function fetchDueTalentFollowUps(): Promise<DueTalentFollowUp[]> {
  const nowIso = new Date().toISOString();
  const { data: actions } = await adminClient
    .from("talent_actions")
    .select("id, talent_id, performed_by, follow_up_at")
    .lte("follow_up_at", nowIso)
    .is("notified_at", null);

  if (!actions?.length) return [];

  const talentIds = Array.from(new Set(actions.map((a) => a.talent_id)));
  const { data: talentRows } = await adminClient
    .from("talent_profiles").select("id, user_id").in("id", talentIds);
  const userIdByTalentId = Object.fromEntries((talentRows ?? []).map((r) => [r.id, r.user_id]));

  const userIds = Object.values(userIdByTalentId).filter((id): id is string => !!id);
  const { data: profileRows } = userIds.length
    ? await adminClient.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const nameByUserId = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p.full_name]));

  return actions.map((a) => {
    const userId = userIdByTalentId[a.talent_id];
    return {
      actionId:    a.id,
      talentId:    a.talent_id,
      talentName:  userId ? nameByUserId[userId] ?? null : null,
      performedBy: a.performed_by,
    };
  });
}

export async function markTalentActionsNotified(actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) return;
  await adminClient.from("talent_actions").update({ notified_at: new Date().toISOString() }).in("id", actionIds);
}

// ─── Talent Brand Collaborations (admin-managed) ─────────────────────────────
// talent_brands is populated with brand_name from the talent's own "Collaborated
// Brands" editor (see lib/talent-brands-sync.ts) but logo_url and verified are
// admin-only — a talent can type any company name, so only an admin marking a
// row verified (and optionally uploading its real logo) makes it trustworthy
// enough to show a logo badge on the public profile.

interface TalentBrandRow {
  id: string;
  talent_profile_id: string;
  brand_name: string;
  logo_url: string | null;
  year_collaborated: string | null;
  sort_order: number;
  verified: boolean | null;
  created_at: string;
}

function toAdminTalentBrand(row: TalentBrandRow): AdminTalentBrand {
  return {
    id: row.id,
    brandName: row.brand_name,
    logoUrl: row.logo_url,
    yearCollaborated: row.year_collaborated,
    sortOrder: row.sort_order,
    verified: Boolean(row.verified),
  };
}

export async function fetchTalentBrands(talentProfileId: string): Promise<AdminTalentBrand[]> {
  const { data, error } = await adminClient
    .from("talent_brands")
    .select("*")
    .eq("talent_profile_id", talentProfileId)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as TalentBrandRow[]).map(toAdminTalentBrand);
}

export async function addTalentBrand(talentProfileId: string, brandName: string): Promise<AdminTalentBrand | null> {
  const { data: existing } = await adminClient
    .from("talent_brands")
    .select("sort_order")
    .eq("talent_profile_id", talentProfileId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await adminClient
    .from("talent_brands")
    .insert({ talent_profile_id: talentProfileId, brand_name: brandName, sort_order: nextSort })
    .select("*")
    .single();
  if (error || !data) return null;
  return toAdminTalentBrand(data as TalentBrandRow);
}

export interface UpdateTalentBrandInput {
  brandName?: string;
  logoUrl?: string | null;
  yearCollaborated?: string | null;
  verified?: boolean;
}

export async function updateTalentBrand(brandId: string, input: UpdateTalentBrandInput): Promise<boolean> {
  const patch: Record<string, unknown> = {};
  if (input.brandName !== undefined) patch.brand_name = input.brandName;
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
  if (input.yearCollaborated !== undefined) patch.year_collaborated = input.yearCollaborated;
  if (input.verified !== undefined) patch.verified = input.verified;
  if (Object.keys(patch).length === 0) return true;

  const { error } = await adminClient.from("talent_brands").update(patch).eq("id", brandId);
  return !error;
}

export async function deleteTalentBrand(brandId: string): Promise<boolean> {
  const { error } = await adminClient.from("talent_brands").delete().eq("id", brandId);
  return !error;
}
