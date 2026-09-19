"use client";

// Review state of a portfolio upload, shown on the owner's own media grids
// (/profile/me and the complete-profile wizard). Approved items show nothing;
// pending ones say they're waiting for an admin, rejected ones say why. Only the
// owner ever sees these — the public profile never receives non-approved media.

import { mediaReviewStatus } from "@/lib/media-review";

interface Props {
  item: { review_status?: string | null; is_approved?: boolean | null; rejection_reason?: string | null };
  lang: "ar" | "en";
}

const TX = {
  ar: { pending: "قيد المراجعة", rejected: "مرفوض" },
  en: { pending: "Pending review", rejected: "Rejected" },
};

export default function MediaReviewBadge({ item, lang }: Props) {
  const status = mediaReviewStatus(item);
  if (status === "approved") return null;
  const rejected = status === "rejected";
  return (
    <span
      title={rejected && item.rejection_reason ? item.rejection_reason : undefined}
      style={{
        position: "absolute", bottom: 6, insetInlineStart: 6, insetInlineEnd: 6, textAlign: "center",
        padding: "3px 6px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, lineHeight: 1.3,
        backgroundColor: rejected ? "rgba(220,38,38,0.92)" : "rgba(244,183,64,0.95)",
        color: rejected ? "#fff" : "#1a1206",
      }}
    >
      {TX[lang][status]}
    </span>
  );
}

/** One-line explainer shown under a grid when any item is waiting or rejected. */
export function mediaReviewNotice(items: { review_status?: string | null; is_approved?: boolean | null }[], lang: "ar" | "en"): string | null {
  const statuses = items.map(mediaReviewStatus);
  if (!statuses.some((s) => s !== "approved")) return null;
  const hasRejected = statuses.includes("rejected");
  if (lang === "ar") {
    return hasRejected
      ? "الملفات اللي عليها \"قيد المراجعة\" مش ظاهرة للعامة لحد ما الأدمن يوافق عليها. الملفات المرفوضة اتسحبت — احذفها وارفع بدلها."
      : "الملفات اللي عليها \"قيد المراجعة\" مش ظاهرة للعامة لحد ما الأدمن يوافق عليها.";
  }
  return hasRejected
    ? "Files marked \"Pending review\" stay hidden from the public until an admin approves them. Rejected files were pulled — delete them and upload replacements."
    : "Files marked \"Pending review\" stay hidden from the public until an admin approves them.";
}
