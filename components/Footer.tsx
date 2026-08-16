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
