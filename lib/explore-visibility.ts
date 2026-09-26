// ─── Explore visibility ───────────────────────────────────────────────────────
// Why an APPROVED talent still doesn't show on /explore. Mirrors, rule for rule,
// what the public list applies on top of approval:
//   • features/talent-profile/services/public-talents.service.ts — needs a
//     handle, is_suspended = false, account_status not blocked/suspended/rejected
//   • app/(main)/explore/_components/ExploreClient.tsx — category ugc or model
// The admin talents table uses it so "approved 55, Explore shows 53" is explained
// per row. Change it together with those two files.

export type ExploreHiddenReason = "no_handle" | "suspended" | "account_blocked" | "category";

export function exploreHiddenReason(t: {
  status:         string | null | undefined;
  handle:         string | null | undefined;
  isSuspended:    boolean | null | undefined;
  accountStatus:  string | null | undefined;
  category:       string | null | undefined;
}): ExploreHiddenReason | null {
  if (t.status !== "approved") return null; // not approved: hidden for the obvious reason
  if (!t.handle) return "no_handle";
  if (t.isSuspended) return "suspended";
  if (t.accountStatus && ["blocked", "suspended", "rejected"].includes(t.accountStatus)) return "account_blocked";
  const c = (t.category ?? "").toLowerCase();
  if (c !== "ugc" && c !== "model") return "category";
  return null;
}
