"use client";

// ─── BrandProfileShell ────────────────────────────────────────────────────────
// The public brand page as a talent sees it: hero (cover, identity, actions,
// links) over a two-column body — the brand's story on the main side, facts on
// the rail. Real data comes from the profile DTO + getBrandPageData(); blocks
// without a backend yet render sample content under a "Preview" chip (see
// ./preview.ts), never silently.

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Globe, MapPin, MessageCircle, ArrowRight, ArrowLeft, UserPlus, UserCheck, Share2, Check, PencilLine } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
import type { BrandPublicCore, PublicProfileDTO } from "@/features/profiles/types/dto";
import type { BrandPageData } from "@/features/brand-page/brand-page.service";
import { SocialLinks } from "./SocialLinks";
import {
  AboutCard, OpportunitiesCard, CollaborationsCard, ReviewsCard,
  StatsCard, TrustCard, TalentsCard, SimilarCard,
} from "./BrandSections";
import s from "./brandPage.module.css";

const TX = {
  ar: {
    follow: "متابعة البراند", following: "متابَع", message: "مراسلة", opportunities: "عرض الفرص",
    authFollow: "أنشئ حساباً لمتابعة البراندات.", authMessage: "أنشئ حساباً لمراسلة البراند.",
    share: "مشاركة", copied: "تم نسخ الرابط", edit: "تعديل الصفحة",
  },
  en: {
    follow: "Follow Brand", following: "Following", message: "Message", opportunities: "View Opportunities",
    authFollow: "Create a free account to follow brands.", authMessage: "Create a free account to message this brand.",
    share: "Share", copied: "Link copied", edit: "Edit page",
  },
};

function safeHref(url: string | null): string | null {
  if (!url) return null;
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(t)) return `https://${t}`;
  return null;
}

export default function BrandProfileShell({ profile, page }: { profile: PublicProfileDTO; page: BrandPageData }) {
  const { lang } = useSite();
  const ar = lang === "ar";
  const tx = TX[ar ? "ar" : "en"];
  const { user, loading: authLoading, requestAuth } = useGuestGuard();
  const core = profile.core as BrandPublicCore;
  const brandId = profile.identity.id;

  const name = core.companyName?.trim() || profile.identity.fullName || "Brand";
  const kind = page.extras.tagline || core.industry || (page.categoryLabel ? page.categoryLabel[ar ? "ar" : "en"] : null);
  const tags = page.extras.tags.length
    ? page.extras.tags
    : [...new Set([core.industry, page.categoryLabel?.[ar ? "ar" : "en"]].filter(Boolean) as string[])];
  const website = safeHref(core.websiteUrl);
  const isOwn = user?.id === brandId;

  // ─── Follow (real: public.follows via /api/community/follow) ─────────────
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(page.followerCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id || isOwn) return;
    fetch(`/api/community/follow?target=${brandId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setFollowing(!!d.isFollowing); setFollowers(d.followerCount ?? 0); } })
      .catch(() => {});
  }, [user?.id, brandId, isOwn]);

  async function toggleFollow() {
    if (!user?.id) { requestAuth("start_conversation", tx.authFollow); return; }
    setBusy(true);
    const next = !following;
    setFollowing(next);
    setFollowers((n) => n + (next ? 1 : -1));
    const res = next
      ? await fetch("/api/community/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followeeId: brandId }) })
      : await fetch(`/api/community/follow?followeeId=${brandId}`, { method: "DELETE" });
    if (!res.ok) { setFollowing(!next); setFollowers((n) => n + (next ? -1 : 1)); }
    setBusy(false);
  }

  // ─── Message (real: the site-wide chat widget) ──────────────────────────
  function openChat() {
    if (!user?.id) { requestAuth("start_conversation", tx.authMessage); return; }
    window.dispatchEvent(new CustomEvent("open-chat-widget", {
      detail: { otherUserId: brandId, otherUser: { id: brandId, full_name: name, avatar_url: profile.identity.avatarUrl, handle: profile.identity.handle } },
    }));
  }

  // ─── Share (native sheet on phones, clipboard elsewhere) ────────────────
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: name, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* user dismissed the sheet */ }
  }

  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        {/* ─── Hero ─── */}
        <section className={s.hero} data-sec="hero">
          <div className={s.cover}>
            {page.extras.coverUrl
              ? <img src={page.extras.coverUrl} alt="" />
              : <p className={s.coverName} aria-hidden="true">{name}</p>}
          </div>

          <div className={s.heroBody}>
            <div className={s.logo}>
              {profile.identity.avatarUrl ? <img src={profile.identity.avatarUrl} alt={name} /> : name.charAt(0)}
            </div>

            <button type="button" className={s.shareBtn} onClick={share} aria-label={copied ? tx.copied : tx.share} title={copied ? tx.copied : tx.share}>
              {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
            </button>

            <div className={s.identity}>
              <h1 className={s.name}>
                {name}
                {profile.identity.isVerified && <BadgeCheck className={s.verified} size={24} aria-label="Verified" />}
              </h1>
              {kind && <p className={s.kind}>{kind}</p>}
              {profile.identity.city && (
                <span className={s.location}><MapPin size={15} aria-hidden="true" />{profile.identity.city}</span>
              )}
              {tags.length > 0 && (
                <div className={s.tags}>{tags.map((t) => <span key={t} className={s.tag}>{t}</span>)}</div>
              )}
            </div>

            <div className={s.heroSide}>
              {isOwn && (
                <div className={s.actions}>
                  <Link href="/profile/brand-setup" className={`${s.btn} ${s.btnPrimary}`}>
                    <PencilLine size={16} aria-hidden="true" />{tx.edit}
                  </Link>
                </div>
              )}
              {!isOwn && !authLoading && (
                <div className={s.actions}>
                  <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={toggleFollow} disabled={busy} aria-pressed={following}>
                    {following ? <UserCheck size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                    {following ? tx.following : tx.follow}
                    {followers > 0 && <span style={{ opacity: 0.75, fontWeight: 600 }}>· {followers}</span>}
                  </button>
                  <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={openChat}>
                    <MessageCircle size={16} aria-hidden="true" />{tx.message}
                  </button>
                  <a href="#opportunities" className={`${s.btn} ${s.btnAccent}`}>
                    {tx.opportunities}<Arrow size={16} aria-hidden="true" />
                  </a>
                </div>
              )}
              <div className={s.links}>
                {website && (
                  <a className={s.website} href={website} target="_blank" rel="noopener noreferrer nofollow">
                    <Globe size={15} aria-hidden="true" />{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
                <SocialLinks links={core.socialLinks} className={s.social} />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Body ─── */}
        <div className={s.body}>
          <div className={s.main}>
            <AboutCard name={name} bio={profile.identity.bio} industry={core.industry ?? page.categoryLabel?.[ar ? "ar" : "en"] ?? null}
              companySize={page.extras.companySize} foundedYear={page.extras.foundedYear} city={profile.identity.city} />
            <OpportunitiesCard jobs={page.jobs} total={page.openJobsCount} city={profile.identity.city} />
            <CollaborationsCard />
            <ReviewsCard reviews={page.reviews} />
          </div>

          <aside className={s.rail}>
            <StatsCard collaborations={page.collaborations} talentsWorkedWith={page.talentsWorkedWith} reviews={page.reviews} />
            <TrustCard verification={page.verification} collaborations={page.collaborations} />
            <TalentsCard talents={page.talents} total={page.talentsWorkedWith} />
            <SimilarCard brands={page.similar} />
          </aside>
        </div>
      </div>
    </main>
  );
}
