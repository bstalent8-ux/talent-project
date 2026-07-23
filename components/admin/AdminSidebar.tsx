"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import {
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package as PackageIcon,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  X,
} from "lucide-react";

const TX = {
  ar: {
    dashboard: "لوحة التحكم",
    talents: "المواهب",
    brands: "الشركات",
    bookings: "الحجوزات",
    reviews: "التقييمات",
    verifications: "طلبات التحقق",
    packages: "الباقات",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
  },
  en: {
    dashboard: "Dashboard",
    talents: "Talents",
    brands: "Brands",
    bookings: "Bookings",
    reviews: "Reviews",
    verifications: "Verifications",
    packages: "Packages",
    settings: "Settings",
    logout: "Logout",
  },
};

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "talents", href: "/admin/talents", icon: Users },
  { key: "brands", href: "/admin/brands", icon: Building2 },
  { key: "bookings", href: "/admin/bookings", icon: CalendarCheck },
  { key: "reviews", href: "/admin/reviews", icon: Star },
  { key: "verifications", href: "/admin/verifications", icon: ShieldCheck },
  { key: "packages", href: "/admin/packages", icon: PackageIcon },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const;

interface Props {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const SIDEBAR_W_OPEN = 240;
export const SIDEBAR_W_COLLAPSED = 64;

export default function AdminSidebar({ open, collapsed, onClose, onToggle }: Props) {
  const pathname = usePathname();
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);

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

  const BG = dark ? "#060c18" : "#0f172a";
  const ACTIVE = "#00D26A";
  const MUTED = "rgba(255,255,255,0.55)";
  const HOVER = "rgba(255,255,255,0.07)";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const width = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_OPEN;

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
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
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
            transition: "padding 0.28s",
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
                  backgroundColor: "rgba(0,210,106,0.15)",
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
          {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                onClick={onClose}
                title={collapsed ? t[key] : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  borderRadius: 10,
                  color: active ? ACTIVE : MUTED,
                  backgroundColor: active ? "rgba(0,210,106,0.1)" : "transparent",
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
                {!collapsed && <span style={{ opacity: 1, transition: "opacity 0.2s" }}>{t[key]}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "8px 8px 0" }}>
          <Link
            href="/login"
            title={collapsed ? t.logout : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 12,
              padding: collapsed ? "10px 0" : "10px 12px",
              borderRadius: 10,
              color: "rgba(239,68,68,0.8)",
              textDecoration: "none",
              fontSize: 14,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && t.logout}
          </Link>
        </div>

        <button
          className="admin-collapse-btn"
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            margin: "12px 8px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            borderRadius: 10,
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            color: MUTED,
            transition: "all 0.2s",
            alignSelf: "stretch",
          }}
          type="button"
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = HOVER;
            event.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "transparent";
            event.currentTarget.style.color = MUTED;
          }}
        >
          {collapsed
            ? (ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
            : (ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>
      </aside>

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
