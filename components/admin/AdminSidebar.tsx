"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import { useAdminIdentity } from "@/contexts/AdminIdentityContext";
import type { AdminResourceKey, PermissionMap } from "@/lib/auth/admin-resources";
import { ADMIN_LIGHT } from "./adminLightTheme";
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contact2,
  Handshake,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  ListTree,
  LogOut,
  Mail,
  Newspaper,
  HeartPulse,
  Package as PackageIcon,
  Quote,
  Settings,
  ShieldCheck,
  FileClock,
  SlidersHorizontal,
  Star,
  User,
  Users,
  X,
} from "lucide-react";

export type SidebarMode = "expanded" | "collapsed" | "hover";

const TX = {
  ar: {
    dashboard: "لوحة التحكم",
    leads: "العملاء المحتملين",
    candidates: "المرشحين",
    talents: "المواهب",
    talentDemand: "طلب أنواع المواهب",
    userActivity: "نشاط المستخدمين",
    healthCheck: "الفحص الصحي",
    brands: "الشركات",
    bookings: "الحجوزات",
    reviews: "التقييمات",
    verifications: "طلبات التحقق",
    pendingData: "بيانات قيد المراجعة",
    blog: "المقالات",
    testimonials: "آراء الصفحة الرئيسية",
    brandMoments: "لحظات البراندات",
    support: "تذاكر الدعم",
    emails: "الإيميلات",
    categories: "التصنيفات",
    packages: "الباقات",
    profileConfig: "إعدادات الملفات",
    notifications: "الإشعارات",
    notificationsLog: "سجل الإشعارات",
    roles: "الأدوار والصلاحيات",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    modeExpanded: "مفتوحة دائماً",
    modeCollapsed: "مصغّرة دائماً",
    modeHover: "تفاعلية عند التمرير",
    groupCrm: "CRM",
    groupTalents: "المواهب",
    groupBookings: "الحجوزات والتقييمات",
    groupBrands: "الشركات",
    groupComms: "التواصل",
    groupAnalytics: "التحليلات",
    groupContent: "محتوى الصفحة الرئيسية",
  },
  en: {
    dashboard: "Dashboard",
    leads: "Leads",
    candidates: "Candidates",
    talents: "Talents",
    talentDemand: "Talent Type Demand",
    userActivity: "User Activity",
    healthCheck: "Health Check",
    brands: "Brands",
    bookings: "Bookings",
    reviews: "Reviews",
    verifications: "Verifications",
    pendingData: "Pending Data",
    blog: "Blog",
    testimonials: "Testimonials",
    brandMoments: "Brand Moments",
    support: "Support Tickets",
    emails: "Emails",
    packages: "Packages",
    categories: "Categories",
    trustedBrands: "Trusted Brands",
    profileConfig: "Profile Config",
    notifications: "Notifications",
    notificationsLog: "Notification Log",
    roles: "Roles & Permissions",
    settings: "Settings",
    logout: "Logout",
    modeExpanded: "Always expanded",
    modeCollapsed: "Always collapsed",
    modeHover: "Interactive (hover)",
    groupCrm: "CRM",
    groupTalents: "Talents",
    groupBookings: "Bookings & Reviews",
    groupBrands: "Brands",
    groupComms: "Communication",
    groupAnalytics: "Analytics",
    groupContent: "Home Page Content",
  },
};

// A flat item, or an item collapsible under a group header — ordered by
// priority both across groups and within each one (daily moderation/action
// queues first, occasional-edit content last), per 2026-08-31 sidebar
// decluttering request. Collapsed-rail mode (SIDEBAR_W_COLLAPSED) flattens
// this back to one icon column — see flattenNavItems() — so a narrow rail
// never has to render a group header with no room for its label.
const NAV_ITEM = {
  dashboard:        { key: "dashboard",        href: "/admin",                    icon: LayoutDashboard },
  leads:            { key: "leads",            href: "/admin/leads",              icon: Contact2 },
  candidates:       { key: "candidates",       href: "/admin/candidates",         icon: Briefcase },
  talents:          { key: "talents",          href: "/admin/talents",            icon: Users },
  verifications:    { key: "verifications",    href: "/admin/verifications",      icon: ShieldCheck },
  pendingData:      { key: "pendingData",      href: "/admin/pending-data",       icon: FileClock },
  talentDemand:     { key: "talentDemand",     href: "/admin/talent-demand",      icon: BarChart3 },
  bookings:         { key: "bookings",         href: "/admin/bookings",           icon: CalendarCheck },
  reviews:          { key: "reviews",          href: "/admin/reviews",            icon: Star },
  brands:           { key: "brands",           href: "/admin/brands",             icon: Building2 },
  trustedBrands:    { key: "trustedBrands",    href: "/admin/trusted-brands",     icon: Handshake, fallback: "براندات موثوقة" },
  support:          { key: "support",          href: "/admin/support",            icon: LifeBuoy },
  emails:           { key: "emails",           href: "/admin/emails",             icon: Mail },
  notifications:    { key: "notifications",    href: "/admin/notifications",      icon: Bell },
  notificationsLog: { key: "notificationsLog", href: "/admin/notifications-log",  icon: History },
  userActivity:     { key: "userActivity",     href: "/admin/user-activity",      icon: Activity },
  healthCheck:      { key: "healthCheck",      href: "/admin/health-check",       icon: HeartPulse },
  blog:             { key: "blog",             href: "/admin/blog",               icon: Newspaper },
  testimonials:     { key: "testimonials",     href: "/admin/testimonials",       icon: Quote },
  brandMoments:     { key: "brandMoments",     href: "/admin/brand-moments",      icon: Camera },
  categories:       { key: "categories",       href: "/admin/categories",         icon: ListTree },
  packages:         { key: "packages",         href: "/admin/packages",           icon: PackageIcon },
  profileConfig:    { key: "profileConfig",    href: "/admin/profile-config",     icon: SlidersHorizontal },
  roles:            { key: "roles",            href: "/admin/roles",              icon: KeyRound },
  settings:         { key: "settings",         href: "/admin/settings",           icon: Settings },
} as const;

type NavItemDef = (typeof NAV_ITEM)[keyof typeof NAV_ITEM];
type NavEntry =
  | { type: "item"; item: NavItemDef }
  | { type: "group"; key: string; labelKey: keyof typeof TX["ar"]; icon: typeof Users; items: NavItemDef[] };

const NAV_STRUCTURE: NavEntry[] = [
  { type: "item", item: NAV_ITEM.dashboard },
  { type: "group", key: "crmGroup", labelKey: "groupCrm", icon: Contact2,
    items: [NAV_ITEM.leads, NAV_ITEM.candidates] },
  { type: "group", key: "talentsGroup", labelKey: "groupTalents", icon: Users,
    items: [NAV_ITEM.talents, NAV_ITEM.verifications, NAV_ITEM.pendingData, NAV_ITEM.talentDemand] },
  { type: "group", key: "bookingsGroup", labelKey: "groupBookings", icon: CalendarCheck,
    items: [NAV_ITEM.bookings, NAV_ITEM.reviews] },
  { type: "group", key: "brandsGroup", labelKey: "groupBrands", icon: Building2,
    items: [NAV_ITEM.brands, NAV_ITEM.trustedBrands] },
  { type: "group", key: "commsGroup", labelKey: "groupComms", icon: Mail,
    items: [NAV_ITEM.support, NAV_ITEM.emails, NAV_ITEM.notifications, NAV_ITEM.notificationsLog] },
  { type: "group", key: "analyticsGroup", labelKey: "groupAnalytics", icon: BarChart3,
    items: [NAV_ITEM.userActivity, NAV_ITEM.healthCheck] },
  { type: "group", key: "contentGroup", labelKey: "groupContent", icon: LayoutGrid,
    items: [NAV_ITEM.blog, NAV_ITEM.testimonials, NAV_ITEM.brandMoments, NAV_ITEM.categories, NAV_ITEM.packages, NAV_ITEM.profileConfig] },
  { type: "item", item: NAV_ITEM.roles },
  { type: "item", item: NAV_ITEM.settings },
];

/**
 * Filters the nav down to what this admin can actually see. `permissions`
 * comes from the server (AdminPermissionsContext, set by the (admin) layout)
 * so this is correct on the very first render — never a wider flash that
 * narrows down a beat later. `permissions === null` means full access
 * (unrestricted admin) — everything shows. A non-null map hides any
 * item/group with no read permission for its key, except "roles" and
 * "settings" — see canSee() below.
 */
function filterNavStructure(structure: NavEntry[], permissions: PermissionMap | null): NavEntry[] {
  if (permissions === null) return structure;

  // "roles" and "settings" are both special-cased outside the matrix —
  // neither is in ADMIN_RESOURCE_KEYS. "roles" is always hidden for a
  // restricted admin; "settings" is always shown (see ADMIN_ROUTE_MAP's
  // comment — every admin can always reach their own account settings).
  const canSee = (item: NavItemDef) => {
    if (item.key === "roles") return false;
    if (item.key === "settings") return true;
    return !!permissions[item.key as AdminResourceKey]?.canRead;
  };

  return structure.flatMap((entry): NavEntry[] => {
    if (entry.type === "item") return canSee(entry.item) ? [entry] : [];
    const items = entry.items.filter(canSee);
    return items.length > 0 ? [{ ...entry, items }] : [];
  });
}

/** Collapsed-rail view ignores grouping entirely — just every item's icon, in
 * the same priority order, same as before this change. */
function flattenNavItems(structure: NavEntry[]): NavItemDef[] {
  return structure.flatMap((entry) => (entry.type === "item" ? [entry.item] : entry.items));
}

const GROUP_STORAGE_KEY = "admin-sidebar-open-groups";

interface Props {
  open: boolean;
  mode: SidebarMode;
  onClose: () => void;
  onModeChange: (mode: SidebarMode) => void;
}

export const SIDEBAR_W_OPEN = 240;
export const SIDEBAR_W_COLLAPSED = 64;
// Width / seam / chevron all share this curve so the rail, the floating edge
// button and the seam glow move as one. RAIL_FADE_MS: labels fade out this
// long before the content flips to the icon-only column.
const RAIL_EASE = "0.35s cubic-bezier(0.4, 0, 0.2, 1)";
const RAIL_FADE_MS = 160;

const MODE_OPTIONS: { mode: SidebarMode }[] = [
  { mode: "expanded" },
  { mode: "collapsed" },
  { mode: "hover" },
];

export default function AdminSidebar({ open, mode, onClose, onModeChange }: Props) {
  const pathname = usePathname();
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  // Both server-computed by the (admin) layout and handed down via context
  // — see AdminPermissionsContext.tsx / AdminIdentityContext.tsx. Correct on
  // the very first render: no client fetch, no per-navigation round trip,
  // nothing to narrow down from after a wider flash.
  const permissions = useAdminPermissions();
  const { name: adminName, avatarUrl: adminAvatar } = useAdminIdentity();
  const [isHovering, setIsHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Hovering the edge toggle button brings a white highlight up over the
  // blue seam fade (light mode only) — a hover affordance on the boundary
  // itself, not a permanent visual.
  const [edgeHover, setEdgeHover] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);

  // Which accordion groups the admin has manually opened — read after mount
  // only (same reasoning as sidebarMode in AdminShell: localStorage isn't
  // available during edge/server render and seeding from it would mismatch
  // hydration). A group with the active route in it is force-open below
  // regardless of this set, so navigating into a collapsed group always
  // reveals it without permanently changing what's stored.
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GROUP_STORAGE_KEY);
      if (saved) setOpenGroups(new Set(JSON.parse(saved) as string[]));
    } catch {
      // ignore — falls back to all-collapsed
    }
  }, []);

  function toggleGroup(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  // hover mode starts collapsed and expands only while the pointer is over
  // the rail — expanded/collapsed modes ignore hover entirely.
  const collapsed = mode === "hover" ? !isHovering : mode === "collapsed";

  const [animate, setAnimate] = useState(false);
  const [lag, setLag] = useState(collapsed);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!animate) { setLag(collapsed); return; }
    if (collapsed) {
      setClosing(true);
      const id = setTimeout(() => { setLag(true); setClosing(false); }, RAIL_FADE_MS);
      return () => clearTimeout(id);
    }
    setClosing(false);
    setLag(false);
  }, [collapsed, animate]);
  const rail = animate ? lag : collapsed;

  function changeMode(next: SidebarMode) {
    setAnimate(true);
    onModeChange(next);
  }

  // Rendered through a portal (below) so it isn't clipped by the sidebar's
  // own overflow-x:hidden — a collapsed 64px rail can't contain a menu wide
  // enough to show the three mode labels. Position is computed from the
  // button's real screen position since a portaled element has no layout
  // relationship to it anymore.
  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left });
    setMenuOpen((o) => !o);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (portalMenuRef.current && !portalMenuRef.current.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const visibleNavStructure = filterNavStructure(NAV_STRUCTURE, permissions);

  // Was a fixed dark-navy rail regardless of theme (a deliberate exception,
  // not a themed surface — same class as auth's photo hero band). The
  // 2026-09-08 redesign asked for light mode specifically to match a new
  // blue/white reference design, dark mode untouched — so this is now a
  // real theme fork instead of a fixed color.
  // 2026-09-24 rebrand: a Dark Chocolate rail in both themes (a step deeper
  // in dark mode), with the Muted Peach active pill the public navbar uses.
  const BG = dark ? "#140E0B" : ADMIN_LIGHT.sidebarBg;
  const ACTIVE = ADMIN_LIGHT.sidebarActiveText;
  const ACTIVE_TINT = ADMIN_LIGHT.sidebarActiveBg;
  const DESTRUCTIVE = "color-mix(in srgb, var(--color-error) 80%, white)";
  const DESTRUCTIVE_HOVER = "color-mix(in srgb, var(--color-error) 8%, transparent)";
  const MUTED = ADMIN_LIGHT.sidebarText;
  const HOVER = ADMIN_LIGHT.sidebarHover;

  // Plain startsWith would make /admin/notifications-log also light up the
  // /admin/notifications composer (a real string-prefix collision, not a
  // hypothetical one) — require an exact match or a "/" boundary.
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  const width = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_OPEN;

  // Shared by top-level items and grouped ones — `indent` only applies when
  // expanded (a rail rail flattens everything to one icon column, see
  // flattenNavItems, so there's nothing to indent under there).
  function renderNavLink(item: NavItemDef, indent: boolean) {
    const { key, href, icon: Icon } = item;
    const fallback = "fallback" in item ? item.fallback : undefined;
    const active = isActive(href);
    const label = (t as Record<string, string>)[key] ?? fallback ?? key;
    return (
      <Link
        key={key}
        href={href}
        onClick={onClose}
        title={rail ? label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: rail ? "center" : "flex-start",
          gap: rail ? 0 : 12,
          padding: rail ? "10px 0" : "10px 12px",
          marginInlineStart: !rail && indent ? 14 : 0,
          borderRadius: 10,
          color: active ? ACTIVE : MUTED,
          backgroundColor: active ? ACTIVE_TINT : "transparent",
          border: active ? `1px solid ${ADMIN_LIGHT.sidebarActiveBorder}` : "1px solid transparent",
          boxShadow: active ? "0 6px 16px rgba(231,165,138,0.22)" : "none",
          // Glass pill (light mode only) — dark mode's ACTIVE_TINT is
          // already an opaque-ish flat tint over a flat navy bg, nothing to
          // blur there.
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: active ? 600 : 400,
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
        onMouseEnter={(event) => {
          if (!active) {
            event.currentTarget.style.backgroundColor = HOVER;
            if (!dark) {
              event.currentTarget.style.backdropFilter = "blur(10px)";
              event.currentTarget.style.setProperty("-webkit-backdrop-filter", "blur(10px)");
            }
          }
        }}
        onMouseLeave={(event) => {
          if (!active) {
            event.currentTarget.style.backgroundColor = "transparent";
            if (!dark) {
              event.currentTarget.style.backdropFilter = "none";
              event.currentTarget.style.setProperty("-webkit-backdrop-filter", "none");
            }
          }
        }}
      >
        <Icon size={18} style={{ flexShrink: 0 }} />
        {!rail && <span className="admin-rail-label">{label}</span>}
      </Link>
    );
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    // Hard navigation — drops client state and, with the auth cookies
    // signOut() just cleared, stops the back button from bfcache-restoring
    // an admin page that still looks signed in.
    window.location.href = "/login";
  }

  return (
    <>
      {open && (
        <div
          className="admin-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 39,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside
        className={`admin-sidebar${open ? " admin-sidebar-open" : ""}${animate ? " admin-rail-animate" : ""}`}
        data-rail={closing ? "closing" : "idle"}
        onMouseEnter={() => { if (mode === "hover") { setAnimate(true); setIsHovering(true); } }}
        onMouseLeave={() => mode === "hover" && setIsHovering(false)}
        style={{
          width,
          height: "100vh",
          // Light mode: a photo (the same /assets/auth-hero.avif used on the
          // login page's brand panel) with a blue gradient overlay for text
          // contrast — nav items sit on it as frosted-glass pills (see
          // renderNavLink below). Dark mode: unchanged flat navy.
          background: dark
            ? `radial-gradient(120% 60% at 0% 0%, rgba(8,127,131,0.28) 0%, transparent 60%), ${BG}`
            : ADMIN_LIGHT.sidebarPhotoBackground,
          borderInlineEnd: "1px solid rgba(245,238,219,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          transition: animate ? `width ${RAIL_EASE}, transform 0.2s ease-out` : "transform 0.2s ease-out",
          zIndex: 40,
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {/* Brand mark — the cream wordmark variant, since the rail is Dark
            Chocolate in both themes. Hidden on the rail icon rail. */}
        {!rail && (
          <Link href="/admin" onClick={onClose} aria-label="Talents" className="admin-rail-label" style={{ display: "flex", padding: "0 20px 22px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/talents-logo-dark.webp" alt="Talents" style={{ height: 34, width: "auto" }} />
          </Link>
        )}

        <div
          style={{
            padding: rail ? "0 12px 28px" : "0 16px 28px",
            display: "flex",
            justifyContent: rail ? "center" : "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              position: "relative",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: "50%",
                boxShadow: `0 0 10px 1px ${ACTIVE}`,
                border: `2px solid ${ACTIVE}`,
                opacity: 0.8,
              }}
            />
            {adminAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={adminAvatar}
                alt="Admin"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  // Own fallback colors, not ACTIVE_TINT/ACTIVE — those are
                  // now a translucent glass pill + white text for nav items
                  // in light mode, which would wash a white-on-white icon
                  // out here. This wants a solid, opaque circle regardless.
                  backgroundColor: ACTIVE_TINT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <User size={18} color={ACTIVE} />
              </div>
            )}
          </div>

          {!rail && (
            <div
              className="admin-rail-label"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flex: 1,
                marginLeft: ar ? 20 : 12,
                marginRight: ar ? 12 : 20,
              }}
            >
              <span
                style={{
                  color: "#F5EEDB",
                  fontWeight: 700,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {adminName}
              </span>
              <span style={{ color: "#E7A58A", fontWeight: 500, fontSize: 11, marginTop: 1 }}>
                {ar ? "مسؤول النظام" : "System Admin"}
              </span>
            </div>
          )}

          {!rail && (
            <button
              className="admin-close-btn"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "none", flexShrink: 0 }}
              type="button"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {rail
            ? flattenNavItems(visibleNavStructure).map((item) => renderNavLink(item, false))
            : visibleNavStructure.map((entry) => {
                if (entry.type === "item") return renderNavLink(entry.item, false);

                const GroupIcon = entry.icon;
                const groupLabel = t[entry.labelKey];
                const hasActiveItem = entry.items.some((it) => isActive(it.href));
                const isOpen = hasActiveItem || openGroups.has(entry.key);

                return (
                  <div key={entry.key}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(entry.key)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: MUTED,
                        fontSize: 14,
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.backgroundColor = HOVER;
                        if (!dark) {
                          event.currentTarget.style.backdropFilter = "blur(10px)";
                          event.currentTarget.style.setProperty("-webkit-backdrop-filter", "blur(10px)");
                        }
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.backgroundColor = "transparent";
                        if (!dark) {
                          event.currentTarget.style.backdropFilter = "none";
                          event.currentTarget.style.setProperty("-webkit-backdrop-filter", "none");
                        }
                      }}
                    >
                      <GroupIcon size={18} style={{ flexShrink: 0 }} />
                      <span className="admin-rail-label" style={{ flex: 1, textAlign: "start" }}>{groupLabel}</span>
                      <ChevronDown
                        size={14}
                        style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                        {entry.items.map((it) => renderNavLink(it, true))}
                      </div>
                    )}
                  </div>
                );
              })}
        </nav>

        <div style={{ padding: "8px 8px 0" }}>
          <button
            type="button"
            onClick={handleLogout}
            title={rail ? t.logout : undefined}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: rail ? "center" : "flex-start",
              gap: rail ? 0 : 12,
              padding: rail ? "10px 0" : "10px 12px",
              borderRadius: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: DESTRUCTIVE,
              textDecoration: "none",
              fontSize: 14,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = DESTRUCTIVE_HOVER;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!rail && <span className="admin-rail-label">{t.logout}</span>}
          </button>
        </div>

        <div className="admin-collapse-btn" style={{ margin: "12px 8px 0", alignSelf: "stretch" }}>
          <button
            ref={buttonRef}
            onClick={openMenu}
            title={ar ? "طريقة عرض القائمة" : "Sidebar display mode"}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              borderRadius: 10,
              background: menuOpen ? HOVER : "none",
              border: "1px solid rgba(245,238,219,0.12)",
              cursor: "pointer",
              color: menuOpen ? "#F5EEDB" : MUTED,
              transition: "all 0.2s",
            }}
            type="button"
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = HOVER;
              event.currentTarget.style.color = "#F5EEDB";
            }}
            onMouseLeave={(event) => {
              if (!menuOpen) {
                event.currentTarget.style.backgroundColor = "transparent";
                event.currentTarget.style.color = MUTED;
              }
            }}
          >
            {rail
              ? (ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
              : (ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>
      </aside>

      {/* Soft blue→page-background fade over the seam — light mode only
          (dark mode's sidebar and page bg are both already dark, no hard
          edge to soften there). Same `position: fixed` + sibling-of-<aside>
          trick as the edge toggle below, for the same overflow-hidden-
          clipping reason. `pointer-events: none` so it never blocks clicks
          on the content or the toggle button sitting on top of it. */}
      {!dark && (
        <div
          className="admin-seam-glow"
          style={{
            position: "fixed",
            top: 0,
            left: width - 36,
            width: 72,
            height: "100vh",
            background: `linear-gradient(90deg, ${ADMIN_LIGHT.sidebarBg} 0%, transparent 100%)`,
            pointerEvents: "none",
            zIndex: 20,
            transition: animate ? `left ${RAIL_EASE}` : "none",
          }}
        />
      )}

      {/* White highlight — hidden until the edge toggle button is hovered,
          then fades in ON TOP of the blue fade above (higher z-index),
          light mode only. Purely decorative (pointer-events: none), driven
          by the button's own onMouseEnter/Leave below. */}
      {!dark && (
        <div
          className="admin-seam-glow"
          style={{
            position: "fixed",
            top: 0,
            left: width - 36,
            width: 72,
            height: "100vh",
            background: "linear-gradient(90deg, transparent 0%, rgba(231,165,138,0.55) 55%, transparent 100%)",
            opacity: edgeHover ? 1 : 0,
            pointerEvents: "none",
            zIndex: 22,
            transition: animate ? `left ${RAIL_EASE}, opacity 0.25s ease` : "opacity 0.25s ease",
          }}
        />
      )}

      {/* Floating edge toggle — sits ON the seam between the sidebar and the
          content, not inside the topbar. `position: fixed` (not relative to
          <aside>, whose own overflow-x:hidden would clip anything sticking
          out past its edge) at `width - 14`, using the SAME `width`/
          `collapsed` this component already computed for itself (correct
          even in "hover" mode, where the true rendered width depends on
          live mouse-hover state AdminShell has no way to know) — the
          sidebar's own solid color renders unbroken right up to (and
          behind) this button, no gap. Desktop only: mobile's off-canvas
          drawer still opens via AdminTopbar's hamburger. */}
      <button
        type="button"
        className="admin-edge-toggle"
        onClick={() => changeMode(mode === "collapsed" ? "expanded" : "collapsed")}
        onMouseEnter={() => setEdgeHover(true)}
        onMouseLeave={() => setEdgeHover(false)}
        title={ar ? "طي/فتح الشريط الجانبي" : "Collapse/expand sidebar"}
        style={{
          position: "fixed",
          top: 28,
          left: width - 14,
          zIndex: 45,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : ADMIN_LIGHT.border}`,
          background: dark ? "#2B211D" : ADMIN_LIGHT.card,
          color: dark ? "#F5EEDB" : ADMIN_LIGHT.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          transition: animate ? `left ${RAIL_EASE}` : "none",
        }}
      >
        {/* One chevron that turns over, instead of swapping icons. */}
        <ChevronLeft
          size={15}
          style={{ transform: collapsed !== ar ? "rotate(180deg)" : "none", transition: animate ? `transform ${RAIL_EASE}` : "none" }}
        />
      </button>

      {/* Portaled to <body> — the sidebar's own overflow-x:hidden would
          otherwise clip this the moment it's wider than a collapsed 64px
          rail. Position is computed screen coordinates, not relative CSS,
          since a portaled node has no layout tie to the button anymore. */}
      {menuOpen && menuPos && createPortal(
        <div
          ref={portalMenuRef}
          style={{
            position: "fixed",
            bottom: menuPos.bottom,
            left: menuPos.left,
            minWidth: 200,
            backgroundColor: dark ? "#2B211D" : ADMIN_LIGHT.card,
            border: dark ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${ADMIN_LIGHT.border}`,
            borderRadius: 10,
            padding: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            zIndex: 1000,
          }}
        >
          {MODE_OPTIONS.map(({ mode: m }) => {
            const label = m === "expanded" ? t.modeExpanded : m === "collapsed" ? t.modeCollapsed : t.modeHover;
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => { changeMode(m); setMenuOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 7,
                  background: active ? ACTIVE_TINT : "none",
                  border: "none",
                  cursor: "pointer",
                  color: active ? (dark ? "#E7A58A" : ADMIN_LIGHT.primary) : (dark ? "#F5EEDB" : ADMIN_LIGHT.text),
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  whiteSpace: "nowrap",
                  textAlign: "start",
                }}
                onMouseEnter={(event) => { if (!active) event.currentTarget.style.backgroundColor = dark ? HOVER : ADMIN_LIGHT.tableHead; }}
                onMouseLeave={(event) => { if (!active) event.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {label}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      <style>{`
        .admin-collapse-btn { display: flex !important; }

        /* Rail toggle: labels fade out just before the rail closes and fade
           back in just after it starts opening (only once the admin has
           actually toggled it — see \`animate\` in AdminSidebar). */
        .admin-sidebar .admin-rail-label { transition: opacity 0.16s ease; }
        .admin-sidebar[data-rail="closing"] .admin-rail-label { opacity: 0; }
        .admin-sidebar.admin-rail-animate .admin-rail-label { animation: adminRailLabelIn 0.3s ease 0.12s both; }
        @keyframes adminRailLabelIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: none; }
        }
        [dir="rtl"] .admin-sidebar.admin-rail-animate .admin-rail-label { animation-name: adminRailLabelInRtl; }
        @keyframes adminRailLabelInRtl {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-sidebar,
          .admin-edge-toggle,
          .admin-edge-toggle svg,
          .admin-seam-glow,
          .admin-sidebar .admin-rail-label { transition: none !important; animation: none !important; }
        }

        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            width: ${SIDEBAR_W_OPEN}px !important;
            transform: translateX(-100%);
          }
          .admin-sidebar.admin-sidebar-open {
            transform: translateX(0) !important;
          }
          .admin-overlay { display: block !important; }
          .admin-close-btn { display: flex !important; }
          .admin-collapse-btn { display: none !important; }
          .admin-edge-toggle { display: none !important; }
          .admin-seam-glow { display: none !important; }

          [dir="rtl"] .admin-sidebar {
            left: auto; right: 0;
            transform: translateX(100%);
          }
          [dir="rtl"] .admin-sidebar.admin-sidebar-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}
