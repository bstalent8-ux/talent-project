"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  LayoutDashboard,
  Languages,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserRoundPlus,
  UserPen,
  X,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { resetNotificationStore } from "@/hooks/notifications";
import { cdnImage } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import styles from "./SiteChrome.module.css";

const NAV_LINKS = {
  ar: [
    { label: "الرئيسية", href: "/home" },
    { label: "استكشاف", href: "/explore" },
    { label: "المجتمع", href: "/community" },
    { label: "وظائف", href: "/jobs" },
    { label: "للشركات", href: "/brands" },
    { label: "مشاريعي", href: "/bookings" },
  ],
  en: [
    { label: "Home", href: "/home" },
    { label: "Explore", href: "/explore" },
    { label: "Community", href: "/community" },
    { label: "Jobs", href: "/jobs" },
    { label: "Brands", href: "/brands" },
    { label: "Projects", href: "/bookings" },
    { label: "Pricing", href: "/packages" },
  ],
};

NAV_LINKS.ar.push({ label: "الأسعار", href: "/packages" });

const TX = {
  ar: {
    search: "ابحث عن مواهب أو خدمات...",
    book: "احجز الآن",
    editProfile: "تعديل الملف الشخصي",
    logout: "تسجيل الخروج",
    login: "دخول",
    register: "حساب جديد",
    lang: "Ar",
    menu: "فتح القائمة",
    close: "إغلاق القائمة",
    theme: "تغيير الوضع",
  },
  en: {
    search: "Search talents or services...",
    book: "Book Now",
    editProfile: "Edit Profile",
    logout: "Log Out",
    login: "Login",
    register: "Register",
    lang: "En",
    menu: "Open menu",
    close: "Close menu",
    theme: "Toggle theme",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar({
  initialAvatarUrl: _initialAvatarUrl,
  initialFullName: _initialFullName,
  initialProfileLoaded = false,
}: {
  initialAvatarUrl?: string | null;
  initialFullName?: string | null;
  initialProfileLoaded?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile(980);
  const { lang, toggleLang, dark, toggleMode } = useSite();
  const { loading: authLoading, isGuest, user } = useGuestGuard();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(_initialAvatarUrl ?? null);
  const [avatarLoaded, setAvatarLoaded] = useState(initialProfileLoaded || !!_initialAvatarUrl);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = TX[lang];
  const links = NAV_LINKS[lang];
  const dashboardLabel = lang === "ar" ? "\u0645\u0644\u0641\u064a" : "My Profile";
  const adminPanelLabel = lang === "ar" ? "\u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629" : "Admin Panel";
  const role = user?.role ?? null;
  const cta = authLoading
    ? null
    : role === "admin"
      ? { href: "/admin", label: adminPanelLabel, Icon: ShieldCheck }
      : role === "talent"
        ? { href: "/profile/me", label: dashboardLabel, Icon: LayoutDashboard }
        : role === "brand" || role === "client"
          ? { href: "/explore", label: t.book, Icon: CalendarCheck }
          : { href: "/register", label: t.register, Icon: UserRoundPlus };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (initialProfileLoaded || _initialAvatarUrl || _initialFullName) {
      setAvatarLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          if (!cancelled) setAvatarLoaded(true);
          return;
        }

        const { profile } = await res.json();
        if (cancelled) return;
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        setAvatarLoaded(true);
      } catch {
        if (!cancelled) setAvatarLoaded(true);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [_initialAvatarUrl, _initialFullName, initialProfileLoaded]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  async function handleLogout() {
    resetNotificationStore();
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <nav
        className={cx(styles.siteNav, dark ? styles.darkChrome : styles.lightChrome)}
        dir={dir}
        aria-label={lang === "ar" ? "التنقل الرئيسي" : "Primary navigation"}
      >
        <div className={styles.brandWrap}>
          <Link className={styles.logoLink} href="/home" aria-label="Talents">
            <Image
              src={dark ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
              alt="Talents"
              width={110}
              height={32}
              style={{ objectFit: "contain", width: "auto", height: 32 }}
              priority
            />
          </Link>
        </div>

        {!isMobile && (
          <div className={styles.navLinks}>
            {links.map((item) => {
              const isActive = pathname === item.href;
              const link = (
                <Link
                  className={cx(styles.navLink, isActive && styles.navLinkActive)}
                  href={item.href}
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
              return item.href.startsWith("/bookings")
                ? <ProtectedAction key={item.href} action="access_dashboard">{link}</ProtectedAction>
                : link;
            })}
          </div>
        )}

        <div className={styles.navControls}>
          <button className={styles.iconButton} onClick={toggleLang} type="button" aria-label="Toggle language">
            <Languages size={15} />
            {t.lang}
          </button>

          <button className={styles.iconButton} onClick={toggleMode} type="button" aria-label={t.theme}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!isGuest && <NotificationBell />}

          {authLoading ? null : isGuest ? (
            <Link className={styles.iconButton} href="/login" aria-label={t.login}>
              <LogIn size={16} aria-hidden="true" />
            </Link>
          ) : (
            <div className={styles.avatarWrap} ref={dropdownRef}>
              <button
                className={styles.avatarButton}
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-label={_initialFullName || "Profile"}
                aria-expanded={dropdownOpen}
              >
                {!avatarLoaded && <span className={styles.spinner} aria-hidden="true" />}
                {avatarUrl && (
                  <img
                    className={styles.avatarImage}
                    src={cdnImage(avatarUrl, 96)}
                    alt={_initialFullName || "avatar"}
                    onLoad={() => setAvatarLoaded(true)}
                    onError={() => setAvatarLoaded(true)}
                  />
                )}
                {avatarLoaded && !avatarUrl && <UserPen size={16} aria-hidden="true" />}
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <ProtectedAction action="access_profile_management">
                    <Link className={styles.dropdownItem} href="/profile/me">
                      <UserPen size={16} />
                      {t.editProfile}
                    </Link>
                  </ProtectedAction>
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
              {cta.label}
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
