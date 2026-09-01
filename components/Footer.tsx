"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import SupportTicketModal from "@/components/support/SupportTicketModal";
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
    href: "https://www.instagram.com/talents_/?hl=en",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>`,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61592844622900",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.57 1.53-4 3.87-4 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.8-1.68 1.62V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12z"/></svg>`,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@talents_platform",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>`,
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
                  <a
                    className={styles.socialLink}
                    href={href}
                    aria-label={label}
                    title={label}
                    key={label}
                    {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    <span className={styles.socialIcon} dangerouslySetInnerHTML={{ __html: svg }} />
                  </a>
                ))}
              </div>
            </div>

            <SupportTicketModal page="footer" />
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
