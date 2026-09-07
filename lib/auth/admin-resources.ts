// ─── Admin RBAC — shared types (CLIENT-SAFE) ────────────────────────────────
// Pulled out of lib/auth/permissions.ts specifically so client components
// (AdminSidebar.tsx) can import the resource-key list and permission-map
// shape without pulling lib/supabase/admin.ts's service-role client into the
// browser bundle — CLAUDE.md rule 3 forbids that import from any "use
// client" file, even transitively through a types-only import.

/** Mirrors AdminSidebar.tsx's NAV_ITEM keys — kept in lockstep deliberately,
 *  see the RBAC migration's comment. Add a key here AND there together.
 *  "settings" is deliberately NOT in this list — see the note by
 *  ADMIN_ROUTE_MAP below, it's every admin's own account page, not a
 *  manageable tab. `admin_role_permissions` still has old seed rows for a
 *  'settings' key from before this change; they're just inert now. */
export const ADMIN_RESOURCE_KEYS = [
  "dashboard", "leads", "candidates", "talents", "verifications", "talentDemand", "bookings", "reviews",
  "brands", "trustedBrands", "support", "emails", "notifications", "notificationsLog",
  "userActivity", "testimonials", "brandMoments", "categories", "packages", "profileConfig",
] as const;
export type AdminResourceKey = (typeof ADMIN_RESOURCE_KEYS)[number];

export type PermissionAction = "read" | "create" | "update" | "delete";

export interface ResourcePermission {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/** `null` means "full access" (unrestricted admin) — distinct from an empty
 *  map, which would mean "restricted admin with zero tabs granted". */
export type PermissionMap = Partial<Record<AdminResourceKey, ResourcePermission>>;

// ─── Page-level route <-> resource mapping ──────────────────────────────────
// Mirrors AdminSidebar.tsx's NAV_ITEM hrefs exactly — used by middleware.ts to
// decide whether a restricted admin may even LOAD a given /admin/* page, not
// just whether they can call its mutating API routes. Keep both in lockstep:
// a new admin page needs an entry here too, or a restricted admin can browse
// straight past a hidden sidebar link by typing the URL.
//
// "/admin/settings" is intentionally absent — like "/admin/roles" and
// "/admin/no-access", resolveResourceKeyForPath() returns null for it, so
// middleware never blocks it and it's never in firstReadableRoute()'s
// candidate list either. Every admin can always change their own name,
// photo, and password no matter what role they're on — the promote-admin
// card on that same page has its own separate super-admin-only check
// (isSuperAdmin in the page itself), so this doesn't reopen that hole.
export const ADMIN_ROUTE_MAP: Record<AdminResourceKey, string> = {
  dashboard: "/admin",
  leads: "/admin/leads",
  candidates: "/admin/candidates",
  talents: "/admin/talents",
  verifications: "/admin/verifications",
  talentDemand: "/admin/talent-demand",
  bookings: "/admin/bookings",
  reviews: "/admin/reviews",
  brands: "/admin/brands",
  trustedBrands: "/admin/trusted-brands",
  support: "/admin/support",
  emails: "/admin/emails",
  notifications: "/admin/notifications",
  notificationsLog: "/admin/notifications-log",
  userActivity: "/admin/user-activity",
  testimonials: "/admin/testimonials",
  brandMoments: "/admin/brand-moments",
  categories: "/admin/categories",
  packages: "/admin/packages",
  profileConfig: "/admin/profile-config",
};

// Same priority order as AdminSidebar.tsx's flattened NAV_STRUCTURE — used to
// pick where a restricted admin lands when their current page isn't one of
// their granted tabs (first one they can actually read). "settings" isn't a
// candidate here either, for the same reason it isn't in ADMIN_ROUTE_MAP.
export const ADMIN_NAV_PRIORITY: AdminResourceKey[] = [
  "dashboard", "leads", "candidates", "talents", "verifications", "talentDemand", "bookings", "reviews",
  "brands", "trustedBrands", "support", "emails", "notifications", "notificationsLog",
  "userActivity", "testimonials", "brandMoments", "categories", "packages", "profileConfig",
];

/** Longest-prefix match against ADMIN_ROUTE_MAP, with an exact-or-"/"-boundary
 *  rule (mirrors AdminSidebar's own isActive()) so "/admin/notifications-log"
 *  doesn't get swallowed by the "/admin/notifications" prefix. Returns null
 *  for a path that isn't one of the tracked tabs (e.g. "/admin/roles", which
 *  has its own super-admin-only gate and isn't part of this permission set). */
export function resolveResourceKeyForPath(pathname: string): AdminResourceKey | null {
  let best: AdminResourceKey | null = null;
  let bestLen = -1;
  for (const key of ADMIN_RESOURCE_KEYS) {
    const href = ADMIN_ROUTE_MAP[key];
    const matches = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
    if (matches && href.length > bestLen) {
      best = key;
      bestLen = href.length;
    }
  }
  return best;
}

/** First tab (in priority order) the given permission map allows reading —
 *  used to redirect a restricted admin away from a page they can't access
 *  instead of bouncing them in a loop. `null` if the map grants nothing at
 *  all (an edge case: a role with an empty matrix). */
export function firstReadableRoute(map: PermissionMap): string | null {
  for (const key of ADMIN_NAV_PRIORITY) {
    if (map[key]?.canRead) return ADMIN_ROUTE_MAP[key];
  }
  return null;
}
