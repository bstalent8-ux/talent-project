// ─── Admin: portfolio media moderation queue ───────────────────────────────
// Reads for /admin/pending-data. Service-role reads only — authorization for the
// page is the (admin) layout + middleware, and for writes the route handler in
// app/api/admin/pending-media. `portfolio_items.is_approved` is the public switch;
// `review_status` (migration 20260919_media_moderation.sql) is the review trail.
// Before that migration is applied the queue still works off `is_approved`
// (pending = not approved; nothing can be "rejected" yet).

import { adminClient } from "@/lib/supabase/admin";
import { mediaReviewStatus, type MediaReviewStatus } from "@/lib/media-review";

export type PendingMediaStatus = MediaReviewStatus | "all";
export type PendingMediaType = "photo" | "video" | "all";
/** What the queue is showing: portfolio media, or talents' new profile photos. */
export type PendingKind = "media" | "avatar";

export interface AdminPendingMedia {
  id:              string;
  url:             string;
  mediaType:       "photo" | "video";
  caption:         string | null;
  createdAt:       string;
  status:          MediaReviewStatus;
  rejectionReason: string | null;
  reviewedAt:      string | null;
  /** Avatar reviews only: the approved photo that stays live until this one is approved. */
  currentUrl?:     string | null;
  talent: {
    talentId:  string;
    userId:    string;
    name:      string;
    handle:    string | null;
    category:  string | null;
    avatarUrl: string | null;
    /** talent_profiles.status — a suspended/pending profile is worth knowing about. */
    profileStatus: string | null;
  };
}

export interface PendingMediaCounts { pending: number; approved: number; rejected: number }

const isMissingReviewColumn = (message?: string | null) => Boolean(message && /review_status|rejection_reason|reviewed_at/.test(message));

export async function fetchPendingMediaCounts(): Promise<PendingMediaCounts & { migrated: boolean }> {
  // GET with limit(1) rather than a HEAD count: a HEAD response has no body, so a
  // missing-column error would come back with an empty message and be undetectable.
  const count = async (status: MediaReviewStatus) =>
    adminClient.from("portfolio_items").select("id", { count: "exact" }).eq("review_status", status).limit(1);

  const [p, a, r] = await Promise.all([count("pending"), count("approved"), count("rejected")]);
  if (p.error && isMissingReviewColumn(p.error.message)) {
    // Not migrated: derive from is_approved.
    const [pending, approved] = await Promise.all([
      adminClient.from("portfolio_items").select("id", { count: "exact" }).eq("is_approved", false).limit(1),
      adminClient.from("portfolio_items").select("id", { count: "exact" }).eq("is_approved", true).limit(1),
    ]);
    return { pending: pending.count ?? 0, approved: approved.count ?? 0, rejected: 0, migrated: false };
  }
  return { pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0, migrated: true };
}

/** Talent ids whose name / handle matches `q` (portfolio_items has no name of its own). */
async function talentIdsMatching(q: string): Promise<string[]> {
  const like = q.replace(/[%_,()]/g, " ").trim();
  if (!like) return [];
  const { data: people } = await adminClient
    .from("profiles")
    .select("id")
    .eq("role", "talent")
    .or(`full_name.ilike.%${like}%,handle.ilike.%${like}%`)
    .limit(200);
  const userIds = (people ?? []).map((p) => p.id as string);
  if (userIds.length === 0) return [];
  const { data: tps } = await adminClient.from("talent_profiles").select("id").in("user_id", userIds);
  return (tps ?? []).map((t) => t.id as string);
}

export async function fetchPendingMediaPage(opts: {
  status:   PendingMediaStatus;
  type:     PendingMediaType;
  q?:       string;
  page:     number;
  pageSize: number;
}): Promise<{ items: AdminPendingMedia[]; total: number }> {
  const { status, type, q, page, pageSize } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let idFilter: string[] | null = null;
  if (q && q.trim()) {
    idFilter = await talentIdsMatching(q);
    if (idFilter.length === 0) return { items: [], total: 0 };
  }

  const build = (useReviewColumn: boolean) => {
    let query = adminClient
      .from("portfolio_items")
      .select("*", { count: "exact" });
    if (status !== "all") {
      query = useReviewColumn
        ? query.eq("review_status", status)
        : query.eq("is_approved", status === "approved");
    }
    if (type !== "all") query = query.eq("media_type", type);
    if (idFilter) query = query.in("talent_id", idFilter);
    // Review queue is first-in-first-out; the history tabs show newest first.
    return query.order("created_at", { ascending: status === "pending" }).range(from, to);
  };

  let res = await build(true);
  if (res.error && isMissingReviewColumn(res.error.message)) res = await build(false);
  if (res.error) throw new Error(res.error.message);

  const rows = (res.data ?? []) as Record<string, any>[];
  const talentIds = [...new Set(rows.map((r) => r.talent_id as string))];

  const { data: tps } = talentIds.length
    ? await adminClient.from("talent_profiles").select("id, user_id, category, status").in("id", talentIds)
    : { data: [] as any[] };
  const userIds = [...new Set((tps ?? []).map((t) => t.user_id as string))];
  const { data: people } = userIds.length
    ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url").in("id", userIds)
    : { data: [] as any[] };

  const tpById = new Map((tps ?? []).map((t) => [t.id as string, t]));
  const personById = new Map((people ?? []).map((p) => [p.id as string, p]));

  const items: AdminPendingMedia[] = rows.map((r) => {
    const tp = tpById.get(r.talent_id);
    const person = tp ? personById.get(tp.user_id) : null;
    return {
      id:              r.id,
      url:             r.url,
      mediaType:       r.media_type === "video" ? "video" : "photo",
      caption:         r.caption ?? null,
      createdAt:       r.created_at,
      status:          mediaReviewStatus(r),
      rejectionReason: r.rejection_reason ?? null,
      reviewedAt:      r.reviewed_at ?? null,
      talent: {
        talentId:      r.talent_id,
        userId:        tp?.user_id ?? "",
        name:          person?.full_name ?? "—",
        handle:        person?.handle ?? null,
        category:      tp?.category ?? null,
        avatarUrl:     person?.avatar_url ?? null,
        profileStatus: tp?.status ?? null,
      },
    };
  });

  return { items, total: res.count ?? 0 };
}

// ─── Profile-photo reviews ──────────────────────────────────────────────────
// A talent's new profile photo is parked in profiles.pending_avatar_url until an
// admin approves it (20260919_avatar_moderation.sql). Items reuse the media shape:
// `id` is the PROFILE id, `url` the new photo, `currentUrl` the live one.

export interface AvatarReviewCounts { pending: number; rejected: number; migrated: boolean }

export async function fetchAvatarReviewCounts(): Promise<AvatarReviewCounts> {
  const count = async (status: "pending" | "rejected") =>
    adminClient.from("profiles").select("id", { count: "exact" }).eq("role", "talent").eq("avatar_review_status", status).limit(1);
  const [p, r] = await Promise.all([count("pending"), count("rejected")]);
  if (p.error) return { pending: 0, rejected: 0, migrated: false };
  return { pending: p.count ?? 0, rejected: r.count ?? 0, migrated: true };
}

export async function fetchAvatarReviewPage(opts: {
  status:   "pending" | "rejected" | "all";
  q?:       string;
  page:     number;
  pageSize: number;
}): Promise<{ items: AdminPendingMedia[]; total: number }> {
  const { status, q, page, pageSize } = opts;
  const from = (page - 1) * pageSize;

  let query = adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, pending_avatar_url, avatar_review_status, avatar_rejection_reason, avatar_submitted_at, avatar_reviewed_at", { count: "exact" })
    .eq("role", "talent");
  query = status === "all" ? query.in("avatar_review_status", ["pending", "rejected"]) : query.eq("avatar_review_status", status);
  const like = (q ?? "").replace(/[%_,()]/g, " ").trim();
  if (like) query = query.or(`full_name.ilike.%${like}%,handle.ilike.%${like}%`);

  const res = await query.order("avatar_submitted_at", { ascending: status === "pending", nullsFirst: false }).range(from, from + pageSize - 1);
  if (res.error) return { items: [], total: 0 };

  const rows = (res.data ?? []) as Record<string, any>[];
  const userIds = rows.map((r) => r.id as string);
  const { data: tps } = userIds.length
    ? await adminClient.from("talent_profiles").select("id, user_id, category, status").in("user_id", userIds)
    : { data: [] as any[] };
  const tpByUser = new Map((tps ?? []).map((t) => [t.user_id as string, t]));

  const items: AdminPendingMedia[] = rows
    .filter((r) => r.pending_avatar_url)
    .map((r) => {
      const tp = tpByUser.get(r.id);
      return {
        id:              r.id,
        url:             r.pending_avatar_url,
        mediaType:       "photo",
        caption:         null,
        createdAt:       r.avatar_submitted_at ?? new Date().toISOString(),
        status:          r.avatar_review_status === "rejected" ? "rejected" : "pending",
        rejectionReason: r.avatar_rejection_reason ?? null,
        reviewedAt:      r.avatar_reviewed_at ?? null,
        currentUrl:      r.avatar_url ?? null,
        talent: {
          talentId:      tp?.id ?? "",
          userId:        r.id,
          name:          r.full_name ?? "—",
          handle:        r.handle ?? null,
          category:      tp?.category ?? null,
          avatarUrl:     r.avatar_url ?? null,
          profileStatus: tp?.status ?? null,
        },
      };
    });

  return { items, total: res.count ?? items.length };
}
