import { adminClient } from "@/lib/supabase/admin";
import type { AdminTalent, AdminDashboardStats, AdminBooking, AdminReview } from "../types";

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const safe = async (q: { then: unknown }) => {
    try { const r = await (q as Promise<{ data: unknown[] | null }>); return (r.data ?? []).length; } catch { return 0; }
  };

  const [talents, brands, bookings, reviews, pending] = await Promise.all([
    safe(adminClient.from("talent_profiles").select("id")),
    safe(adminClient.from("profiles").select("id").eq("role", "brand")),
    safe(adminClient.from("bookings").select("id")),
    safe(adminClient.from("reviews").select("id")),
    safe(adminClient.from("talent_verifications").select("id").eq("status", "pending")),
  ]);

  return {
    pending,
    approved:  talents,
    rejected:  0,
    suspended: 0,
    brands,
    bookings,
    reviews,
  };
}

export async function fetchAdminTalents(statusFilter?: string): Promise<AdminTalent[]> {
  const { data } = await adminClient
    .from("profiles")
    .select(`
      id, handle, full_name, avatar_url, city, created_at,
      is_approved, is_suspended, is_verified, balance,
      talent_profiles (
        id, category, avg_rating, total_reviews
      )
    `)
    .eq("role", "talent")
    .order("created_at", { ascending: false });

  return (data ?? []).flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
    if (!tp) return [];

    const isApproved   = (p as Record<string, unknown>).is_approved   as boolean ?? true;
    const isSuspended  = (p as Record<string, unknown>).is_suspended  as boolean ?? false;
    const accountStatus = isSuspended ? "suspended" : isApproved ? "active" : "pending";
    const status: AdminTalent["status"] = "approved";
    if (statusFilter && statusFilter !== "all" && status !== statusFilter) return [];

    return [{
      profileId:       p.id,
      talentProfileId: tp.id,
      fullName:        p.full_name,
      handle:          p.handle,
      avatarUrl:       p.avatar_url,
      category:        tp.category,
      city:            p.city,
      createdAt:       p.created_at,
      status,
      approvedAt:      null,
      rejectionReason: null,
      avgRating:       tp.avg_rating    ?? null,
      totalReviews:    tp.total_reviews ?? null,
      accountStatus,
      blockReason:     null,
      isVerified:      (p as Record<string, unknown>).is_verified    as boolean ?? false,
      balance:         (p as Record<string, unknown>).balance        as number  ?? 0,
    }];
  });
}

export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  // Step 1: fetch raw bookings
  const { data: bookings, error } = await adminClient
    .from("bookings")
    .select("id, status, created_at, amount, notes, brief_url, paid_at, completed_at, brand_id, talent_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !bookings?.length) return [];

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

  return bookings.map(b => {
    const userId = tpMap[b.talent_id];
    return {
      ...b,
      brand:  brandMap[b.brand_id]  ?? null,
      talent: userId ? talentMap[userId] : null,
    };
  }) as AdminBooking[];
}

export async function fetchAdminReviews(): Promise<AdminReview[]> {
  // Step 1: fetch reviews (try with new columns first)
  let reviews: Record<string, unknown>[] = [];
  const { data, error } = await adminClient
    .from("reviews")
    .select("id, rating, comment, status, proof_link, review_type, created_at, brand_id, talent_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!error && data) {
    reviews = data as Record<string, unknown>[];
  } else {
    // Fallback without new columns
    const { data: basic } = await adminClient
      .from("reviews")
      .select("id, rating, comment, created_at, brand_id, talent_id")
      .order("created_at", { ascending: false })
      .limit(200);
    reviews = (basic ?? []).map(r => ({ ...r, status: "approved", proof_link: null, review_type: "brand" }));
  }

  if (!reviews.length) return [];

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

  return reviews.map(r => {
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

export async function fetchAdminVerifications(): Promise<AdminVerification[]> {
  // Step 1: fetch verification requests
  const { data: verifications, error } = await adminClient
    .from("talent_verifications")
    .select("id, talent_id, status, submitted_at, id_document_url, selfie_url, social_proof, rejection_reason")
    .order("submitted_at", { ascending: false });

  if (error || !verifications?.length) return [];

  // Step 2: fetch matching profiles in one query
  const talentIds = [...new Set(verifications.map(v => v.talent_id))];
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, is_verified")
    .in("id", talentIds);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  return verifications.map((v) => {
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

export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  const { data } = await adminClient
    .from("profiles")
    .select(`
      id, full_name, handle, city, created_at,
      brand_status, tax_document_url, brand_rejection_reason,
      is_approved, is_suspended
    `)
    .eq("role", "brand")
    .order("created_at", { ascending: false });

  return (data ?? []).map((b) => {
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
}
