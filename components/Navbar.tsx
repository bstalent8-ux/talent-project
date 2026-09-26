"use client";

import Image from "next/image";
import NeonRing from "@/components/NeonRing";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  Heart,
  LayoutDashboard,
  Languages,
  LogIn,
  LogOut,
  MessageCircle,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRoundPlus,
  UserPen,
  X,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { useSite } from "@/contexts/SiteContext";
import { useLangSwitch } from "@/hooks/useLangSwitch";
import { useIsMobile } from "@/hooks/useIsMobile";
import { reset as resetMyProfileStore, useMyProfile } from "@/hooks/useMyProfile";
import { resetNotificationStore } from "@/hooks/notifications";
import { cdnImage } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import styles from "./SiteChrome.module.css";

// Rebrand nav (2026-09): About · Discover Talents · Community · Packages ·
// Contact. Home is the logo link; "Projects" (/bookings) and "Brands" left the
// bar and stay reachable from the account menu / their own routes. `soon`
// still renders a "Soon" tag when set — none are flagged right now.
const NAV_LINKS: Record<"ar" | "en", { label: string; href: string; soon?: boolean }[]> = {
  ar: [
    { label: "عن المنصة", href: "/about" },
    { label: "اكتشف المواهب", href: "/explore" },
    { label: "المجتمع", href: "/community" },
    { label: "الباقات", href: "/packages" },
    { label: "تواصل معنا", href: "/contact" },
  ],
  en: [
    { label: "About", href: "/about" },
    { label: "Discover Talents", href: "/explore" },
    { label: "Community", href: "/community" },
    { label: "Packages", href: "/packages" },
    { label: "Contact", href: "/contact" },
  ],
};

const TX = {
  ar: {
    search: "ابحث عن مواهب أو خدمات...",
    book: "احجز الآن",
    editProfile: "تعديل الملف الشخصي",
    accountSettings: "إعدادات الحساب",
    favorites: "المفضلة",
    messages: "الرسائل",
    dashboardTalent: "لوحة التحكم",
    dashboardBrand: "لوحة تحكم البراند",
    logout: "تسجيل الخروج",
    login: "دخول",
    register: "إنشاء حساب",
    lang: "Ar",
    menu: "فتح القائمة",
    close: "إغلاق القائمة",
    theme: "تغيير الوضع",
    soon: "قريباً",
  },
  en: {
    search: "Search talents or services...",
    book: "Book Now",
    editProfile: "Edit Profile",
    accountSettings: "Account Settings",
    favorites: "Favorites",
    messages: "Messages",
    dashboardTalent: "Dashboard",
    dashboardBrand: "Brand Dashboard",
    logout: "Log Out",
    login: "Login",
    register: "Sign Up",
    lang: "En",
    menu: "Open menu",
    close: "Close menu",
    theme: "Toggle theme",
    soon: "Soon",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Two stacked copies of the label; CSS slides the track up on hover (text roll).
function Flip({ children }: { children: string }) {
  return (
    <span className={styles.flip}>
      <span className={styles.flipTrack}>
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile(980);
  const { lang, dark, toggleMode } = useSite();
  // Wipe-out / type-in language switch, mirrored onto <html> (see globals.css).
  const { phase: langPhase, switchLang } = useLangSwitch({ global: true });
  const { loading: authLoading, isGuest, user } = useGuestGuard();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { profile: myProfile, loading: profileLoading } = useMyProfile();
  const avatarUrl = myProfile?.avatar_url ?? null;
  const fullName = myProfile?.full_name ?? null;
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = TX[lang];
  const links = NAV_LINKS[lang].filter((item) => !item.href.startsWith("/bookings") || !isGuest);
  const role = user?.role ?? null;
  const cta = authLoading
    ? null
    : role === "admin" || role === "talent"
      ? null
      : role === "brand" || role === "client"
        ? { href: "/explore", label: t.book, Icon: CalendarCheck }
        : { href: "/register", label: t.register, Icon: UserRoundPlus };

  // Both roles land on the same /dashboard route — it renders role-aware
  // content itself (see app/(main)/dashboard). Previously this pointed talent
  // at /profile/me (the profile EDITOR) and brand at /explore (the public
  // marketplace) — neither was a dashboard. Label stays role-specific.
  const dashboardMenuItem = role === "admin"
    ? null
    : role === "brand" || role === "client"
      ? { href: "/dashboard", label: t.dashboardBrand, Icon: LayoutDashboard }
      : { href: "/dashboard", label: t.dashboardTalent, Icon: LayoutDashboard };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // avatarUrl/fullName now come from the shared useMyProfile() store (one
  // fetch for the whole tab — see hooks/useMyProfile.ts). This just reveals
  // the fallback icon once that store has resolved and there's no photo to
  // wait on; when there IS a photo, the <img>'s own onLoad/onError below
  // flips avatarLoaded instead, so the spinner holds until pixels are ready.
  useEffect(() => {
    if (!profileLoading && !avatarUrl) setAvatarLoaded(true);
  }, [profileLoading, avatarUrl]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  async function handleLogout() {
    resetNotificationStore();
    resetMyProfileStore();
    await createClient().auth.signOut();
    // Hard navigation, not router.push: drops every bit of client-side
    // state (React tree, router cache) and — combined with the auth
    // cookies signOut() just cleared — stops the browser's back button
    // from bfcache-restoring a page that still looks signed in.
    window.location.href = "/login";
  }

  return (
    <>
      <nav
        className={cx(styles.siteNav, dark ? styles.darkChrome : styles.lightChrome)}
        dir={dir}
        aria-label={lang === "ar" ? "التنقل الرئيسي" : "Primary navigation"}
      >
        <NeonRing period={5} />
        <div className={styles.brandWrap}>
          <Link className={styles.logoLink} href="/home" aria-label="Talents">
            <Image
              src={dark ? "/assets/talents-logo-dark.webp" : "/assets/talents-logo-light.webp"}
              alt="Talents"
              unoptimized
              width={108}
              height={34}
              style={{ objectFit: "contain", width: "auto", height: 34 }}
              priority
            />
          </Link>
        </div>

        {!isMobile && (
          <div className={styles.navLinks} data-lang-wipe>
            {links.map((item) => {
              const isActive = pathname === item.href;
              const link = (
                <Link
                  className={cx(styles.navLink, isActive && styles.navLinkActive)}
                  href={item.href}
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Flip>{item.label}</Flip>
                  {item.soon && <span className={styles.navSoonBadge}>{t.soon}</span>}
                </Link>
              );
              return item.href.startsWith("/bookings")
                ? <ProtectedAction key={item.href} action="access_dashboard">{link}</ProtectedAction>
                : link;
            })}
          </div>
        )}

        <div className={styles.navControls}>
          <button className={styles.iconButton} onClick={switchLang} disabled={langPhase !== "idle"} type="button" aria-label="Toggle language">
            <Languages size={15} />
            {t.lang}
          </button>

          <button className={styles.iconButton} onClick={toggleMode} type="button" aria-label={t.theme}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!isGuest && <NotificationBell />}

          {authLoading ? (
            // Client auth hasn't resolved yet — same box the real avatar
            // button renders into, so nothing shifts once it does.
            <span className={styles.avatarButton} aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className={styles.spinner} />
            </span>
          ) : isGuest ? (
            <Link className={styles.iconButton} href="/login" aria-label={t.login}>
              <LogIn size={16} aria-hidden="true" />
            </Link>
          ) : (
            <div className={styles.avatarWrap} ref={dropdownRef}>
              <button
                className={styles.avatarButton}
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label={fullName || "Profile"}
                aria-expanded={dropdownOpen}
              >
                {!avatarLoaded && <span className={styles.spinner} aria-hidden="true" />}
                {avatarUrl && (
                  <img
                    className={styles.avatarImage}
                    src={cdnImage(avatarUrl, 96)}
                    alt={fullName || "avatar"}
                    onLoad={() => setAvatarLoaded(true)}
                    onError={() => setAvatarLoaded(true)}
                  />
                )}
                {avatarLoaded && !avatarUrl && <UserPen size={16} aria-hidden="true" />}
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  {dashboardMenuItem && (
                    <Link className={styles.dropdownItem} href={dashboardMenuItem.href}>
                      <dashboardMenuItem.Icon size={16} />
                      {dashboardMenuItem.label}
                    </Link>
                  )}
                  <Link className={styles.dropdownItem} href="/favorites">
                    <Heart size={16} />
                    {t.favorites}
                  </Link>
                  <Link className={styles.dropdownItem} href="/chat">
                    <MessageCircle size={16} />
                    {t.messages}
                  </Link>
                  <Link className={styles.dropdownItem} href="/settings">
                    <Settings size={16} />
                    {t.accountSettings}
                  </Link>
                  <button className={cx(styles.dropdownItem, styles.dangerItem)} onClick={handleLogout} type="button">
                    <LogOut size={16} />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          )}

          {!isMobile && cta && (
            <Link className={styles.bookButton} href={cta.href} aria-label={cta.label}>
              <cta.Icon size={17} aria-hidden="true" />
              <Flip>{cta.label}</Flip>
            </Link>
          )}

          {isMobile && (
            <button
              className={styles.mobileMenuButton}
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
              aria-label={menuOpen ? t.close : t.menu}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div className={cx(styles.mobileMenu, dark ? styles.darkChrome : styles.lightChrome)} dir={dir}>
          <form className={styles.mobileSearch} action="/explore" role="search">
            <Search size={16} aria-hidden="true" />
            <input name="q" placeholder={t.search} type="search" aria-label={t.search} />
          </form>

          {links.map((item) => {
            const isActive = pathname === item.href;
            const link = (
              <Link
                className={cx(styles.mobileLink, isActive && styles.mobileLinkActive)}
                href={item.href}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
                {item.soon && <span className={styles.navSoonBadge}>{t.soon}</span>}
              </Link>
            );
            return item.href.startsWith("/bookings")
              ? <ProtectedAction key={item.href} action="access_dashboard">{link}</ProtectedAction>
              : link;
          })}

          {cta && (
            <Link className={styles.bookButton} href={cta.href} aria-label={cta.label}>
              <cta.Icon size={17} aria-hidden="true" />
              {cta.label}
            </Link>
          )}
        </div>
      )}

      <div className={styles.navSpacer} />
    </>
  );
}
