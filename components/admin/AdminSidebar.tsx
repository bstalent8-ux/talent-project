"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  ListTree,
  LogOut,
  Package as PackageIcon,
  Quote,
  Settings,
  ShieldCheck,
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
    talents: "المواهب",
    talentDemand: "طلب أنواع المواهب",
    brands: "الشركات",
    bookings: "الحجوزات",
    reviews: "التقييمات",
    verifications: "طلبات التحقق",
    testimonials: "آراء الصفحة الرئيسية",
    brandMoments: "لحظات البراندات",
    support: "تذاكر الدعم",
    categories: "التصنيفات",
    packages: "الباقات",
    profileConfig: "إعدادات الملفات",
    notifications: "الإشعارات",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    modeExpanded: "مفتوحة دائماً",
    modeCollapsed: "مصغّرة دائماً",
    modeHover: "تفاعلية عند التمرير",
  },
  en: {
    dashboard: "Dashboard",
    talents: "Talents",
    talentDemand: "Talent Type Demand",
    brands: "Brands",
    bookings: "Bookings",
    reviews: "Reviews",
    verifications: "Verifications",
    testimonials: "Testimonials",
    brandMoments: "Brand Moments",
    support: "Support Tickets",
    packages: "Packages",
    categories: "Categories",
    trustedBrands: "Trusted Brands",
    profileConfig: "Profile Config",
    notifications: "Notifications",
    settings: "Settings",
    logout: "Logout",
    modeExpanded: "Always expanded",
    modeCollapsed: "Always collapsed",
    modeHover: "Interactive (hover)",
  },
};

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "support", href: "/admin/support", icon: LifeBuoy },
  { key: "talents", href: "/admin/talents", icon: Users },
  { key: "talentDemand", href: "/admin/talent-demand", icon: BarChart3 },
  { key: "brands", href: "/admin/brands", icon: Building2 },
  { key: "bookings", href: "/admin/bookings", icon: CalendarCheck },
  { key: "reviews", href: "/admin/reviews", icon: Star },
  { key: "verifications", href: "/admin/verifications", icon: ShieldCheck },
  { key: "testimonials", href: "/admin/testimonials", icon: Quote },
  { key: "brandMoments", href: "/admin/brand-moments", icon: Camera },
  { key: "categories", href: "/admin/categories", icon: ListTree },
  { key: "packages", href: "/admin/packages", icon: PackageIcon },
  { key: "trustedBrands", href: "/admin/trusted-brands", icon: Handshake, fallback: "براندات موثوقة" },
  { key: "profileConfig", href: "/admin/profile-config", icon: SlidersHorizontal },
  { key: "notifications", href: "/admin/notifications", icon: Bell },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const;

interface Props {
  open: boolean;
  mode: SidebarMode;
  onClose: () => void;
  onModeChange: (mode: SidebarMode) => void;
}

export const SIDEBAR_W_OPEN = 240;
export const SIDEBAR_W_COLLAPSED = 64;

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

  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);

  // hover mode starts collapsed and expands only while the pointer is over
  // the rail — expanded/collapsed modes ignore hover entirely.
  const collapsed = mode === "hover" ? !isHovering : mode === "collapsed";

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

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          setAdminName(profile.full_name ?? null);
          setAdminAvatar(profile.avatar_url ?? null);
        }
      })
      .catch(() => {});
  }, []);

  // The sidebar shell is deliberately always dark navy, regardless of
  // [data-theme] — a fixed nav rail, not a themed surface (same class of
  // exception as auth's photo hero band). Only the accent/status colours
  // below come from the canonical token palette.
  const BG = dark ? "#060c18" : "#0f172a";
  const ACTIVE = "var(--color-primary)";
  const ACTIVE_TINT = "color-mix(in srgb, var(--color-primary) 15%, transparent)";
  const DESTRUCTIVE = "color-mix(in srgb, var(--color-error) 80%, white)";
  const DESTRUCTIVE_HOVER = "color-mix(in srgb, var(--color-error) 8%, transparent)";
  const MUTED = "rgba(255,255,255,0.55)";
  const HOVER = "rgba(255,255,255,0.07)";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const width = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_OPEN;

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
        className={`admin-sidebar${open ? " admin-sidebar-open" : ""}`}
        onMouseEnter={() => mode === "hover" && setIsHovering(true)}
        onMouseLeave={() => mode === "hover" && setIsHovering(false)}
        style={{
          width,
          height: "100vh",
          backgroundColor: BG,
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          transition: mode === "hover" ? "width 0.15s ease-out, transform 0.2s ease-out" : "transform 0.2s ease-out",
          zIndex: 40,
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: collapsed ? "0 12px 28px" : "0 16px 28px",
            display: "flex",
            justifyContent: collapsed ? "center" : "space-between",
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

          {!collapsed && (
            <div
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
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {adminName}
              </span>
              <span style={{ color: ACTIVE, fontWeight: 500, fontSize: 11, marginTop: 1 }}>
                {ar ? "مسؤول النظام" : "System Admin"}
              </span>
            </div>
          )}

          {!collapsed && (
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
          {NAV_ITEMS.map((item) => {
            const { key, href, icon: Icon } = item;
            const fallback = "fallback" in item ? item.fallback : undefined;
            const active = isActive(href);
            const label = (t as Record<string, string>)[key] ?? fallback ?? key;
            return (
              <Link
                key={key}
                href={href}
                onClick={onClose}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  borderRadius: 10,
                  color: active ? ACTIVE : MUTED,
                  backgroundColor: active ? ACTIVE_TINT : "transparent",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: active ? 700 : 400,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(event) => {
                  if (!active) event.currentTarget.style.backgroundColor = HOVER;
                }}
                onMouseLeave={(event) => {
                  if (!active) event.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ opacity: 1, transition: "opacity 0.2s" }}>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "8px 8px 0" }}>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? t.logout : undefined}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 12,
              padding: collapsed ? "10px 0" : "10px 12px",
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
            {!collapsed && t.logout}
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
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: menuOpen ? "#fff" : MUTED,
              transition: "all 0.2s",
            }}
            type="button"
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = HOVER;
              event.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(event) => {
              if (!menuOpen) {
                event.currentTarget.style.backgroundColor = "transparent";
                event.currentTarget.style.color = MUTED;
              }
            }}
          >
            {collapsed
              ? (ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
              : (ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>
      </aside>

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
            backgroundColor: dark ? "#0d1420" : "#1a2332",
            border: "1px solid rgba(255,255,255,0.12)",
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
                onClick={() => { onModeChange(m); setMenuOpen(false); }}
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
                  color: active ? ACTIVE : "#fff",
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  whiteSpace: "nowrap",
                  textAlign: "start",
                }}
                onMouseEnter={(event) => { if (!active) event.currentTarget.style.backgroundColor = HOVER; }}
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
