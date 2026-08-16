"use client";

// ─── Preview banner ─────────────────────────────────────────────────────────
// Sits above the real, shared TalentProfileShell when the OWNER opens their
// own not-yet-approved listing. The profile below is rendered exactly as a
// public visitor would eventually see it — this banner is the only thing
// that tells the owner it isn't public yet.

import { useSite } from "@/contexts/SiteContext";
import type { ModerationStatus } from "@/features/profiles/types/raw";

export default function PendingPreviewBanner({
  status,
  rejectionReason,
}: {
  status: ModerationStatus | null;
  rejectionReason?: string | null;
}) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const isRejected = status === "rejected";

  const BG     = isRejected ? "rgba(239,68,68,0.12)" : "rgba(244,183,64,0.12)";
  const BORDER = isRejected ? "rgba(239,68,68,0.35)" : "rgba(244,183,64,0.35)";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";

  // Exact spec copy for "pending" — status text carries its own "Preview —"
  // prefix already, so the rejected variant (not in the original spec) uses
  // an equivalent prefix rather than inventing a different banner shape.
  const message = isRejected
    ? (rejectionReason
        ? (ar ? `معاينة — لم تتم الموافقة على ملفك. السبب: ${rejectionReason}` : `Preview — Your profile was not approved. Reason: ${rejectionReason}`)
        : (ar ? "معاينة — لم تتم الموافقة على ملفك الشخصي." : "Preview — Your profile was not approved."))
    : (ar
        ? "معاينة — ملفك الشخصي في انتظار الموافقة وغير ظاهر للعامة حتى الآن."
        : "Preview — Your profile is awaiting approval and is not visible publicly yet.");

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      role="status"
      style={{
        maxWidth: 1440,
        margin: "16px auto 0",
        padding: "12px 20px",
        backgroundColor: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        color: TEXT,
        fontFamily: "'Cairo', sans-serif",
        fontSize: 13.5,
        fontWeight: 700,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
