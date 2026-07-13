"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/notifications/NotificationBell";

const NAV_LINKS = {
  ar: [
    { label: "الرئيسية", href: "/home" },
    { label: "استكشاف",  href: "/explore" },
    { label: "المجتمع",  href: "/community" },
    { label: "وظائف",    href: "/jobs" },
    { label: "للشركات",  href: "/brands" },
    { label: "مشاريعي",  href: "/bookings" },
  ],
  en: [
    { label: "Home",      href: "/home" },
    { label: "Explore",   href: "/explore" },
    { label: "Community", href: "/community" },
    { label: "Jobs",      href: "/jobs" },
    { label: "Brands",    href: "/brands" },
    { label: "Projects",  href: "/bookings" },
  ],
};

const TX = {
  ar: { search: "ابحث عن مواهب أو خدمات...", book: "احجز الآن" },
  en: { search: "Search talents or services...", book: "Book Now" },
};

export default function Navbar({
  initialAvatarUrl: _initialAvatarUrl,
  initialFullName: _initialFullName,
}: {
  initialAvatarUrl?: string | null;
  initialFullName?: string | null;
}) {
  const pathname  = usePathname();
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const { lang, toggleLang, dark, toggleMode } = useSite();

  const [hoveredHref,    setHovered]      = useState<string | null>(null);
  const [avatarUrl,      setAvatarUrl]    = useState<string | null>(_initialAvatarUrl ?? null);
  const [avatarLoaded,   setAvatarLoaded] = useState(!!_initialAvatarUrl);
  const [initialLoad,    setInitialLoad]  = useState(false);
  const [menuOpen,       setMenuOpen]     = useState(false);
  const [dropdownOpen,   setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  const dir  = lang === "ar" ? "rtl" : "ltr";
  const t    = TX[lang];

  const BG     = dark ? "#090e1a"  : "#ffffff";
  const BORDER = dark ? "#1e293b"  : "#e2e8f0";
  const SEARCH = dark ? "#0d1527"  : "#f1f5f9";
  const TEXT   = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED  = dark ? "#94a3b8"  : "#64748b";
  const INP    = dark ? "#f1f5f9"  : "#0f172a";
  const GOLD   = "#FFB800";

  useEffect(() => {
    // Server already passed avatar via props — no need to re-fetch.
    if (_initialAvatarUrl) return;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) { setAvatarLoaded(true); return; }
        const { profile } = await res.json();
        if (profile?.avatar_url) { setAvatarUrl(profile.avatar_url); }
        else                     { setAvatarLoaded(true); }
      } catch { setAvatarLoaded(true); }
    })();
  }, [_initialAvatarUrl]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const links = NAV_LINKS[lang];

  return (
    <>
      <style>{`
        @keyframes underline-in { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes navSpin { to { transform: rotate(360deg); } }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, right: 0, left: 0, zIndex: 50,
        height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 14px" : "0 24px",
        backgroundColor: BG,
        borderBottom: `1px solid ${BORDER}`,
        backdropFilter: "blur(12px)",
        direction: dir,
        transition: "background-color 0.3s, border-color 0.3s",
      }}>

        {/* Logo + Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
             <Image
              // تم تعديل الشرط هنا مباشرة داخل الـ src ليتم تحديث الصورة فور تغير قيمة dark بشكل ديناميكي
              src={dark ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
              alt="Talents"
              width={110}
              height={32}
              style={{ objectFit: "contain", width: "auto", height: 32 }}
              priority
            />
          </Link>

          {/* Search — desktop only */}
          {/* {!isMobile && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              backgroundColor: SEARCH, border: `1px solid ${BORDER}`,
              borderRadius: "8px", padding: "6px 12px", width: "220px",
            }}>
              <svg width="14" height="14" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder={t.search} style={{
                background: "transparent", border: "none", outline: "none",
                color: INP, fontSize: "13px", width: "100%", direction: dir,
                fontFamily: "'Cairo', sans-serif",
              }} />
            </div>
          )} */}
        </div>

        {/* Desktop Nav Links */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            {links.map((item) => {
              const isActive  = pathname === item.href;
              const isHovered = hoveredHref === item.href;
              const highlight = isActive || isHovered;
              return (
                <Link key={item.href} href={item.href}
                  onMouseEnter={() => setHovered(item.href)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: "relative",
                    color: highlight ? GOLD : MUTED,
                    textDecoration: "none", fontSize: "14px",
                    fontWeight: highlight ? 700 : 500,
                    whiteSpace: "nowrap", paddingBottom: "4px",
                    transition: "color 0.2s",
                  }}>
                  {item.label}
                  <span style={{
                    position: "absolute", bottom: 0, right: 0, left: 0,
                    height: "2px", backgroundColor: GOLD, borderRadius: "2px",
                    transform: highlight ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: dir === "rtl" ? "right" : "left",
                    transition: "transform 0.25s ease",
                  }} />
                </Link>
              );
            })}
          </div>
        )}

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "4px" : "6px" }}>

          {/* Lang toggle */}
          <button onClick={toggleLang} style={{
            background: SEARCH, border: `1px solid ${BORDER}`, borderRadius: "6px",
            padding: "4px 8px", cursor: "pointer",
            color: MUTED, fontSize: "11px", fontWeight: 600, fontFamily: "'Cairo', sans-serif",
          }}>
            {lang === "ar" ? "Ar" : "En"}
          </button>

          {/* Mode toggle */}
          <button onClick={toggleMode} style={{
            background: SEARCH, border: `1px solid ${BORDER}`, borderRadius: "6px",
            padding: "4px 7px", cursor: "pointer", fontSize: "12px",
          }}>
            {dark ? "☀️" : "🌙"}
          </button>

          {/* Notifications — desktop only */}
          {!isMobile && <NotificationBell />}

         {/* Avatar + Dropdown */}
<div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
  <button
    onClick={() => setDropdownOpen((o) => !o)}
    style={{
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      border: `2px solid ${dropdownOpen ? GOLD : GOLD}`,
      backgroundColor: dark ? "#111c35" : "#fff8e1",
      color: GOLD,
      fontSize: "12px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      cursor: "pointer",
      padding: 0,
      flexShrink: 0,
      boxShadow: dropdownOpen ? "0 0 0 3px rgba(255,184,0,0.35)" : "none",
      transition: "box-shadow 0.2s",
    }}
  >
    {(initialLoad || !avatarLoaded) && (
      <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: `2px solid ${GOLD}44`, borderTopColor: GOLD, animation: "navSpin 0.7s linear infinite" }} />
    )}
    {avatarUrl && (
      <img src={avatarUrl} alt="avatar" onLoad={() => setAvatarLoaded(true)} onError={() => setAvatarLoaded(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: avatarLoaded ? "block" : "none" }} />
    )}
  </button>

  {dropdownOpen && (
    <div style={{
      position: "absolute",
      top: "calc(100% + 10px)",
      [lang === "ar" ? "left" : "right"]: 0,
      backgroundColor: dark ? "#0d1527" : "#ffffff",
      border: `1px solid ${BORDER}`,
      borderRadius: "12px",
      boxShadow: dark ? "0 12px 40px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)",
      minWidth: "180px",
      overflow: "hidden",
      zIndex: 999,
      animation: "slideDown 0.15s ease",
      fontFamily: "'Cairo',sans-serif",
      direction: lang === "ar" ? "rtl" : "ltr",
    }}>
      <Link
        href="/profile/me"
        onClick={() => setDropdownOpen(false)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 16px", textDecoration: "none",
          color: TEXT, fontSize: "13px", fontWeight: 700,
          borderBottom: `1px solid ${BORDER}`,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dark ? "rgba(255,184,0,0.06)" : "rgba(255,184,0,0.04)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <svg width="15" height="15" fill="none" stroke={GOLD} strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {lang === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}
      </Link>
      <button
        onClick={handleLogout}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 16px", width: "100%", textAlign: lang === "ar" ? "right" : "left",
          background: "none", border: "none", cursor: "pointer",
          color: "#ef4444", fontSize: "13px", fontWeight: 700,
          fontFamily: "'Cairo',sans-serif",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {lang === "ar" ? "تسجيل الخروج" : "Log Out"}
      </button>
    </div>
  )}
</div>

          {/* Book CTA — desktop only */}
          {!isMobile && (
            <Link href="/book" style={{
              backgroundColor: GOLD, color: "#000",
              fontWeight: 700, fontSize: "14px",
              padding: "8px 18px", borderRadius: "8px",
              textDecoration: "none", whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {t.book}
            </Link>
          )}

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{
              background: "none", border: `1px solid ${BORDER}`, borderRadius: "6px",
              padding: "7px 8px", cursor: "pointer",
              display: "flex", flexDirection: "column", gap: "4px",
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: "block", width: "18px", height: "2px",
                  backgroundColor: menuOpen ? GOLD : MUTED,
                  borderRadius: "2px", transition: "background 0.2s",
                  transform: menuOpen && i === 0 ? "rotate(45deg) translate(4px,4px)"
                            : menuOpen && i === 2 ? "rotate(-45deg) translate(4px,-4px)"
                            : menuOpen && i === 1 ? "scaleX(0)" : "none",
                  transformOrigin: "center",
                }} />
              ))}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", top: "60px", left: 0, right: 0, zIndex: 49,
          backgroundColor: BG, borderBottom: `1px solid ${BORDER}`,
          padding: "14px 16px 20px",
          direction: dir, fontFamily: "'Cairo', sans-serif",
          animation: "slideDown 0.2s ease",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {/* Mobile search */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            backgroundColor: SEARCH, border: `1px solid ${BORDER}`,
            borderRadius: "8px", padding: "10px 14px", marginBottom: "8px",
          }}>
            <svg width="14" height="14" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder={t.search} style={{
              background: "transparent", border: "none", outline: "none",
              color: INP, fontSize: "14px", width: "100%",
              fontFamily: "'Cairo', sans-serif",
            }} />
          </div>

          {/* Nav links */}
          {links.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "block", padding: "14px 4px",
                borderBottom: `1px solid ${BORDER}`,
                color: isActive ? GOLD : TEXT,
                textDecoration: "none", fontSize: "15px",
                fontWeight: isActive ? 700 : 500,
              }}>
                {item.label}
              </Link>
            );
          })}

          {/* Book CTA */}
          <Link href="/book" style={{
            display: "block", marginTop: "16px", textAlign: "center",
            backgroundColor: GOLD, color: "#000",
            fontWeight: 700, fontSize: "15px",
            padding: "13px", borderRadius: "10px",
            textDecoration: "none",
          }}>
            {t.book}
          </Link>
        </div>
      )}

      <div style={{ height: "60px" }} />
    </>
  );
}