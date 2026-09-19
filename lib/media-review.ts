// Portfolio media moderation — shared, client-safe helpers.
//
// `portfolio_items.is_approved` is the single "visible on the public profile"
// switch (every public read already filters on it). `review_status` is the review
// trail around it (pending | approved | rejected) added by
// supabase/migrations/20260919_media_moderation.sql. Until that migration is
// applied `review_status` is absent, so the status falls back to `is_approved`.

export type MediaReviewStatus = "pending" | "approved" | "rejected";

export const MEDIA_REVIEW_STATUSES: readonly MediaReviewStatus[] = ["pending", "approved", "rejected"];

export function mediaReviewStatus(row: { review_status?: string | null; is_approved?: boolean | null }): MediaReviewStatus {
  const s = row.review_status;
  if (s === "pending" || s === "approved" || s === "rejected") return s;
  return row.is_approved ? "approved" : "pending";
}
