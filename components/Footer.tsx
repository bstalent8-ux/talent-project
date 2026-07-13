"use client";

import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { ArrowUpRight } from "lucide-react";

// ─── Translation map ──────────────────────────────────────────────────────────

const TX = {
  ar: {
    tagline: "ربط البراندات بأفضل المواهب في العالم العربي",
    sections: {
      platform: "المنصة",
      company:  "الشركة",
      legal:    "قانوني",
    },
    links: {
      home:      "الرئيسية",
      explore:   "استكشف المواهب",
      become:    "كن موهوباً",
      brands:    "للشركات",
      community: "المجتمع",
      jobs:      "وظائف",
      about:     "من نحن",
      contact:   "تواصل معنا",
      blog:      "المدونة",
      terms:     "الشروط والأحكام",
      privacy:   "سياسة الخصوصية",
      cookies:   "سياسة الكوكيز",
    },
    social: "تابعنا",
    copyright: (year: number) => `© ${year} Talents. جميع الحقوق محفوظة.`,
    madeWith: "صُنع بـ ❤️ للمواهب العربية",
  },
  en: {
    tagline: "Connecting brands with top Arabic talent",
    sections: {
      platform: "Platform",
      company:  "Company",
      legal:    "Legal",
    },
    links: {
      home:      "Home",
      explore:   "Explore Talents",
      become:    "Become a Talent",
      brands:    "For Brands",
      community: "Community",
      jobs:      "Jobs",
      about:     "About Us",
      contact:   "Contact",
      blog:      "Blog",
      terms:     "Terms of Service",
      privacy:   "Privacy Policy",
      cookies:   "Cookie Policy",
    },
    social: "Follow us",
    copyright: (year: number) => `© ${year} Talents. All rights reserved.`,
    madeWith: "Made with ❤️ for Arab talent",
  },
} as const;

type LinksMap = { [K in keyof (typeof TX)["ar"]["links"]]: string };

const PLATFORM_LINKS = (t: LinksMap) => [
  { label: t.home,      href: "/home" },
  { label: t.explore,   href: "/explore" },
  { label: t.become,    href: "/become-talent" },
  { label: t.brands,    href: "/brands" },
  { label: t.community, href: "/community" },
  { label: t.jobs,      href: "/jobs" },
];

const COMPANY_LINKS = (t: LinksMap) => [
  { label: t.about,   href: "/about" },
  { label: t.contact, href: "/contact" },
  { label: t.blog,    href: "/blog" },
];

const LEGAL_LINKS = (t: LinksMap) => [
  { label: t.terms,   href: "/terms" },
  { label: t.privacy, href: "/privacy" },
  { label: t.cookies, href: "/cookies" },
];

// SVG social icons (lucide doesn't bundle brand icons)
const SOCIAL: { svg: string; href: string; label: string }[] = [
  {
    label: "Instagram",
    href: "#",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>`,
  },
  {
    label: "X / Twitter",
    href: "#",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  },
  {
    label: "YouTube",
    href: "#",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  },
  {
    label: "LinkedIn",
    href: "#",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
  {
    label: "Email",
    href: "#",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Footer() {
  const { lang, dark } = useSite();
  const t   = TX[lang];
  const ar  = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const year = new Date().getFullYear();

  // Theme tokens
  const BG        = dark ? "#060d18"            : "#f8fafc";
  const BORDER    = dark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const TEXT      = dark ? "#f1f5f9"            : "#0f172a";
  const MUTED     = dark ? "#64748b"            : "#94a3b8";
  const LINK_CLR  = dark ? "#94a3b8"            : "#475569";
  const LINK_HOV  = dark ? "#f1f5f9"            : "#0f172a";
  const SURFACE   = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const GREEN     = "#00D26A";
  const GOLD      = "#F4B740";

  const sectionTitle: React.CSSProperties = {
    color:         TEXT,
    fontSize:      12,
    fontWeight:    800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom:  16,
  };

  const linkStyle: React.CSSProperties = {
    color:          LINK_CLR,
    fontSize:       14,
    textDecoration: "none",
    display:        "flex",
    alignItems:     "center",
    gap:            4,
    transition:     "color 0.15s",
    fontFamily:     "'Cairo', sans-serif",
    fontWeight:     400,
  };

  return (
    <footer
      dir={dir}
      style={{
        backgroundColor: BG,
        borderTop:       `1px solid ${BORDER}`,
        fontFamily:      "'Cairo', sans-serif",
        paddingTop:      48,
        paddingBottom:   32,
      }}
    >
      <div style={{
        maxWidth: 1280,
        margin:   "0 auto",
        padding:  "0 24px",
      }}>

        {/* ── Top grid ── */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "clamp(200px,28%,300px) 1fr 1fr 1fr",
          gap:                 40,
          marginBottom:        48,
          flexWrap:            "wrap",
        } as React.CSSProperties}>

          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img
                src={dark ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
                alt="Talents"
                style={{ height: 32, width: "auto", display: "block" }}
              />
            </div>

            <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, maxWidth: 220, margin: "0 0 20px" }}>
              {t.tagline}
            </p>

            {/* Social icons */}
            <p style={{ ...sectionTitle, marginBottom: 10 }}>{t.social}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SOCIAL.map(({ svg, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  style={{
                    width:           34,
                    height:          34,
                    borderRadius:    8,
                    backgroundColor: SURFACE,
                    border:          `1px solid ${BORDER}`,
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    color:           MUTED,
                    transition:      "all 0.15s",
                    textDecoration:  "none",
                    flexShrink:      0,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = GREEN;
                    (e.currentTarget as HTMLElement).style.borderColor = GREEN;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = MUTED;
                    (e.currentTarget as HTMLElement).style.borderColor = BORDER;
                  }}
                >
                  <span
                    style={{ width: 15, height: 15, display: "flex" }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <LinkColumn
            title={t.sections.platform}
            links={PLATFORM_LINKS(t.links)}
            titleStyle={sectionTitle}
            linkStyle={linkStyle}
            hoverColor={GREEN}
            accent={GREEN}
          />

          {/* Company links */}
          <LinkColumn
            title={t.sections.company}
            links={COMPANY_LINKS(t.links)}
            titleStyle={sectionTitle}
            linkStyle={linkStyle}
            hoverColor={GREEN}
            accent={GREEN}
          />

          {/* Legal links */}
          <LinkColumn
            title={t.sections.legal}
            links={LEGAL_LINKS(t.links)}
            titleStyle={sectionTitle}
            linkStyle={linkStyle}
            hoverColor={GREEN}
            accent={GREEN}
          />
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, backgroundColor: BORDER, marginBottom: 24 }} />

        {/* ── Bottom bar ── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            12,
        }}>
          <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
            {t.copyright(year)}
          </p>

          <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
            {t.madeWith}
          </p>

          {/* Quick legal links inline */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {LEGAL_LINKS(t.links).map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{ color: MUTED, fontSize: 12, textDecoration: "none" }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = GREEN)}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = MUTED)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile responsive ── */}
      <style>{`
        @media (max-width: 900px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 540px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
          }
          footer > div > div:last-child {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </footer>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function LinkColumn({
  title,
  links,
  titleStyle,
  linkStyle,
  hoverColor,
  accent,
}: {
  title: string;
  links: { label: string; href: string }[];
  titleStyle: React.CSSProperties;
  linkStyle: React.CSSProperties;
  hoverColor: string;
  accent: string;
}) {
  return (
    <div>
      <p style={titleStyle}>{title}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              style={linkStyle}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = hoverColor;
                const arrow = el.querySelector("svg");
                if (arrow) (arrow as SVGElement & { style: CSSStyleDeclaration }).style.opacity = "1";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = linkStyle.color as string;
                const arrow = el.querySelector("svg");
                if (arrow) (arrow as SVGElement & { style: CSSStyleDeclaration }).style.opacity = "0";
              }}
            >
              {label}
              <ArrowUpRight
                size={12}
                style={{ opacity: 0, transition: "opacity 0.15s", color: accent, flexShrink: 0 }}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
