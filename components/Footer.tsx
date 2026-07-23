"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "./SiteChrome.module.css";

const TX = {
  ar: {
    tagline: "ربط البراندات بأفضل المواهب في العالم العربي",
    sections: {
      platform: "المنصة",
      company: "الشركة",
      legal: "قانوني",
    },
    links: {
      home: "الرئيسية",
      explore: "استكشف المواهب",
      become: "كن موهوباً",
      brands: "للشركات",
      community: "المجتمع",
      jobs: "وظائف",
      about: "من نحن",
      contact: "تواصل معنا",
      blog: "المدونة",
      terms: "الشروط والأحكام",
      privacy: "سياسة الخصوصية",
      cookies: "سياسة الكوكيز",
    },
    social: "تابعنا",
    copyright: (year: number) => `(c) ${year} Talents. جميع الحقوق محفوظة.`,
    madeWith: "صنع للمواهب العربية",
  },
  en: {
    tagline: "Connecting brands with top Arabic talent",
    sections: {
      platform: "Platform",
      company: "Company",
      legal: "Legal",
    },
    links: {
      home: "Home",
      explore: "Explore Talents",
      become: "Become a Talent",
      brands: "For Brands",
      community: "Community",
      jobs: "Jobs",
      about: "About Us",
      contact: "Contact",
      blog: "Blog",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      cookies: "Cookie Policy",
    },
    social: "Follow us",
    copyright: (year: number) => `(c) ${year} Talents. All rights reserved.`,
    madeWith: "Made for Arab talent",
  },
} as const;

type LinksMap = { [K in keyof (typeof TX)["ar"]["links"]]: string };

const PLATFORM_LINKS = (t: LinksMap) => [
  { label: t.home, href: "/home" },
  { label: t.explore, href: "/explore" },
  { label: t.become, href: "/become-talent" },
  { label: t.brands, href: "/brands" },
  { label: t.community, href: "/community" },
  { label: t.jobs, href: "/jobs" },
];

const COMPANY_LINKS = (t: LinksMap) => [
  { label: t.about, href: "/about" },
  { label: t.contact, href: "/contact" },
  { label: t.blog, href: "/blog" },
];

const LEGAL_LINKS = (t: LinksMap) => [
  { label: t.terms, href: "/terms" },
  { label: t.privacy, href: "/privacy" },
  { label: t.cookies, href: "/cookies" },
];

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Footer() {
  const { lang, dark } = useSite();
  const t = TX[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const year = new Date().getFullYear();

  return (
    <footer className={cx(styles.footer, dark ? styles.footerDark : styles.footerLight)} dir={dir}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link className={styles.logoLink} href="/home" aria-label="Talents">
              <Image
                src={dark ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
                alt="Talents"
                width={118}
                height={34}
                style={{ objectFit: "contain", width: "auto", height: 34 }}
              />
            </Link>

            <p className={styles.footerTagline}>{t.tagline}</p>

            <div>
              <p className={styles.footerTitle}>{t.social}</p>
              <div className={styles.socialRow}>
                {SOCIAL.map(({ svg, href, label }) => (
                  <a className={styles.socialLink} href={href} aria-label={label} title={label} key={label}>
                    <span className={styles.socialIcon} dangerouslySetInnerHTML={{ __html: svg }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <LinkColumn title={t.sections.platform} links={PLATFORM_LINKS(t.links)} />
          <LinkColumn title={t.sections.company} links={COMPANY_LINKS(t.links)} />
          <LinkColumn title={t.sections.legal} links={LEGAL_LINKS(t.links)} />
        </div>

        <div className={styles.footerDivider} />

        <div className={styles.footerBottom}>
          <p>{t.copyright(year)}</p>
          <p>{t.madeWith}</p>
          <div className={styles.footerLegal}>
            {LEGAL_LINKS(t.links).map(({ label, href }) => (
              <Link className={styles.footerLink} href={href} key={href}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className={styles.footerTitle}>{title}</p>
      <ul className={styles.footerList}>
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link className={styles.footerLink} href={href}>
              {label}
              <ArrowUpRight size={13} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
