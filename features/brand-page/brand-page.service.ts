import "server-only";

// ─── Brand public page — everything beyond the profile DTO ───────────────────
// The DTO (ProfileService) carries the brand's identity and core columns. This
// module adds the facts the redesigned /brand/[id] page shows that live in
// other tables: open jobs, collaboration stats, talents worked with,
// verification facts, similar brands and talent reviews.
//
// Every read is independent and fault-tolerant: a missing table/column (a
// not-yet-applied migration, CLAUDE.md §6) or a failed query degrades that one
// block to empty/null — it never takes the page down.

import { adminClient } from "@/lib/supabase/admin";
import { fallbackCategories } from "@/features/categories/services/category.service";
import { safePublicDisplayName } from "@/lib/public-display-name";

export interface BrandExtras {
  coverUrl:    string | null;
  tagline:     string | null;
  companySize: string | null;
  foundedYear: number | null;
  tags:        string[];
}

export interface BrandJob {
  id:           string;
  title:        string;
  category:     string | null;
  budgetMin:    number | null;
  budgetMax:    number | null;
  currency:     string;
  applyBy:      string | null;
  createdAt:    string;
  applicants:   number;
}

export interface BrandTalent {
  id:       string;
  handle:   string;
  name:     string;
  avatar:   string | null;
  category: string | null;
  rating:   number | null;
}

export interface SimilarBrand {
  userId:   string;
  handle:   string | null;
  name:     string;
  avatar:   string | null;
  industry: string | null;
}

export interface BrandReview {
  id:        string;
  rating:    number;
  comment:   string | null;
  createdAt: string;
  author:    { name: string; avatar: string | null };
}

export interface BrandReviewSummary {
  count:           number;
  average:         number;
  communication:   number | null;
  professionalism: number | null;
  payment:         number | null;
  latest:          BrandReview[];
}

export interface BrandPageData {
  extras:            BrandExtras;
  categoryLabel:     { ar: string; en: string } | null;
  jobs:              BrandJob[];
  openJobsCount:     number;
  collaborations:    number;
  talentsWorkedWith: number;
  talents:           BrandTalent[];
  verification: {
    email:    boolean;
    business: boolean;
    payment:  boolean;
  };
  followerCount:     number;
  similar:           SimilarBrand[];
  reviews:           BrandReviewSummary | null;
}

const DONE_STATUSES = ["completed", "paid"];
const EMPTY_EXTRAS: BrandExtras = { coverUrl: null, tagline: null, companySize: null, foundedYear: null, tags: [] };

async function safe<T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.error(`[brand-page] ${label} failed`, e);
    return fallback;
  }
}

async function loadExtras(brandUserId: string): Promise<BrandExtras> {
  const { data, error } = await adminClient
    .from("brand_profiles")
    .select("cover_url, tagline, company_size, founded_year, tags")
    .eq("user_id", brandUserId)
    .maybeSingle();
  // 42703 = column missing: 20260926_brand_public_page.sql not applied yet.
  if (error) {
    if (error.code !== "42703") console.error("[brand-page] extras", error);
    return EMPTY_EXTRAS;
  }
  return {
    coverUrl:    data?.cover_url ?? null,
    tagline:     data?.tagline ?? null,
    companySize: data?.company_size ?? null,
    foundedYear: data?.founded_year ?? null,
    tags:        Array.isArray(data?.tags) ? data.tags.filter((t: unknown) => typeof t === "string" && t.trim()) : [],
  };
}

async function loadJobs(brandUserId: string): Promise<{ jobs: BrandJob[]; total: number }> {
  const { data, count, error } = await adminClient
    .from("jobs")
    .select("id, title, category, budget_min, budget_max, currency, end_date, created_at", { count: "exact" })
    .eq("brand_id", brandUserId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) throw error;

  const ids = (data ?? []).map((j) => j.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: apps } = await adminClient.from("job_applications").select("job_id").in("job_id", ids);
    for (const a of apps ?? []) counts[a.job_id] = (counts[a.job_id] ?? 0) + 1;
  }

  return {
    total: count ?? ids.length,
    jobs: (data ?? []).map((j) => ({
      id:         j.id,
      title:      j.title,
      category:   j.category ?? null,
      budgetMin:  j.budget_min ?? null,
      budgetMax:  j.budget_max ?? null,
      currency:   j.currency ?? "EGP",
      applyBy:    j.end_date ?? null,
      createdAt:  j.created_at,
      applicants: counts[j.id] ?? 0,
    })),
  };
}

async function loadCollaborations(brandUserId: string) {
  const { data, error } = await adminClient
    .from("bookings")
    .select("talent_user_id, completed_at, created_at")
    .eq("brand_id", brandUserId)
    .in("status", DONE_STATUSES)
    .order("completed_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  const rows = data ?? [];
  const talentIds = [...new Set(rows.map((r) => r.talent_user_id).filter(Boolean))] as string[];

  let talents: BrandTalent[] = [];
  if (talentIds.length) {
    const firstFour = talentIds.slice(0, 4);
    const [{ data: profiles }, { data: tps }] = await Promise.all([
      adminClient.from("profiles").select("id, handle, full_name, avatar_url").in("id", firstFour),
      adminClient.from("talent_profiles").select("user_id, category, avg_rating").in("user_id", firstFour),
    ]);
    const cat = Object.fromEntries((tps ?? []).map((t) => [t.user_id, t.category]));
    const rating = Object.fromEntries((tps ?? []).map((t) => [t.user_id, t.avg_rating]));
    const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    talents = firstFour.flatMap((id) => {
      const p = byId[id];
      if (!p?.handle) return [];
      return [{
        id,
        handle:   p.handle,
        name:     safePublicDisplayName(p.full_name, p.handle, "Talent"),
        avatar:   p.avatar_url ?? null,
        category: cat[id] ?? null,
        rating:   typeof rating[id] === "number" && rating[id] > 0 ? rating[id] : null,
      }];
    });
  }

  return { collaborations: rows.length, talentsWorkedWith: talentIds.length, talents };
}

async function loadVerification(brandUserId: string, businessApproved: boolean) {
  const [{ data: authUser }, { count: paidCount }] = await Promise.all([
    adminClient.auth.admin.getUserById(brandUserId),
    adminClient
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("client_id", brandUserId)
      .in("status", ["held", "released"]),
  ]);
  return {
    email:    Boolean(authUser?.user?.email_confirmed_at),
    business: businessApproved,
    payment:  (paidCount ?? 0) > 0,
  };
}

async function loadFollowers(brandUserId: string): Promise<number> {
  const { count, error } = await adminClient
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("followee_id", brandUserId);
  if (error) return 0;
  return count ?? 0;
}

async function loadSimilar(brandUserId: string, categoryId: string | null, industry: string | null): Promise<SimilarBrand[]> {
  let query = adminClient
    .from("brand_profiles")
    .select("user_id, company_name, industry, category_id")
    .eq("status", "approved")
    .neq("user_id", brandUserId)
    .limit(3);
  if (categoryId) query = query.eq("category_id", categoryId);
  else if (industry) query = query.eq("industry", industry);

  const { data, error } = await query;
  if (error) throw error;
  const ids = (data ?? []).map((b) => b.user_id);
  if (!ids.length) return [];

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, handle, full_name, avatar_url, account_status")
    .in("id", ids);
  const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (data ?? []).flatMap((b) => {
    const p = byId[b.user_id];
    if (!p || ["blocked", "suspended", "rejected"].includes(p.account_status ?? "")) return [];
    return [{
      userId:   b.user_id,
      handle:   p.handle ?? null,
      name:     b.company_name || safePublicDisplayName(p.full_name, p.handle, "Brand"),
      avatar:   p.avatar_url ?? null,
      industry: b.industry ?? null,
    }];
  });
}

async function loadReviews(brandUserId: string): Promise<BrandReviewSummary | null> {
  const { data, error } = await adminClient
    .from("brand_reviews")
    .select("id, rating, communication, professionalism, payment, comment, created_at, talent_user_id")
    .eq("brand_id", brandUserId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  // 42P01 / PGRST205 = table missing (migration not applied) → no real reviews yet.
  if (error) {
    if (error.code !== "42P01" && error.code !== "PGRST205") console.error("[brand-page] reviews", error);
    return null;
  }
  const rows = data ?? [];
  if (!rows.length) return null;

  const avg = (key: "rating" | "communication" | "professionalism" | "payment") => {
    const vals = rows.map((r) => r[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };

  const latestRows = rows.slice(0, 2);
  const { data: authors } = await adminClient
    .from("profiles")
    .select("id, handle, full_name, avatar_url")
    .in("id", latestRows.map((r) => r.talent_user_id));
  const byId = Object.fromEntries((authors ?? []).map((p) => [p.id, p]));

  return {
    count:           rows.length,
    average:         avg("rating") ?? 0,
    communication:   avg("communication"),
    professionalism: avg("professionalism"),
    payment:         avg("payment"),
    latest: latestRows.map((r) => ({
      id:        r.id,
      rating:    r.rating,
      comment:   r.comment ?? null,
      createdAt: r.created_at,
      author: {
        name:   safePublicDisplayName(byId[r.talent_user_id]?.full_name, byId[r.talent_user_id]?.handle, "Talent"),
        avatar: byId[r.talent_user_id]?.avatar_url ?? null,
      },
    })),
  };
}

export async function getBrandPageData(input: {
  brandUserId:      string;
  categoryId:       string | null;
  industry:         string | null;
  businessApproved: boolean;
}): Promise<BrandPageData> {
  const { brandUserId, categoryId, industry, businessApproved } = input;

  const [extras, jobs, collabs, verification, followerCount, similar, reviews] = await Promise.all([
    safe("extras", EMPTY_EXTRAS, () => loadExtras(brandUserId)),
    safe("jobs", { jobs: [], total: 0 }, () => loadJobs(brandUserId)),
    safe("collaborations", { collaborations: 0, talentsWorkedWith: 0, talents: [] as BrandTalent[] }, () => loadCollaborations(brandUserId)),
    safe("verification", { email: false, business: businessApproved, payment: false }, () => loadVerification(brandUserId, businessApproved)),
    safe("followers", 0, () => loadFollowers(brandUserId)),
    safe("similar", [] as SimilarBrand[], () => loadSimilar(brandUserId, categoryId, industry)),
    safe("reviews", null as BrandReviewSummary | null, () => loadReviews(brandUserId)),
  ]);

  const cat = categoryId ? fallbackCategories.find((c) => c.id === categoryId) : null;

  return {
    extras,
    categoryLabel:     cat ? { ar: cat.label_ar, en: cat.label_en } : null,
    jobs:              jobs.jobs,
    openJobsCount:     jobs.total,
    collaborations:    collabs.collaborations,
    talentsWorkedWith: collabs.talentsWorkedWith,
    talents:           collabs.talents,
    verification,
    followerCount,
    similar,
    reviews,
  };
}
