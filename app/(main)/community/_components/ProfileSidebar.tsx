"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, UserPen, UserRoundPlus } from "lucide-react";
import { cdnImage } from "@/lib/images";
import type { MyProfileSnapshot } from "@/hooks/useMyProfile";
import styles from "./CommunityPage.module.css";

export type MeSnapshot = MyProfileSnapshot;

interface Props {
  lang: "ar" | "en";
  userId: string | null;
  me: MeSnapshot | null;
  onGuestCta: () => void;
}

const TX = {
  ar: {
    talent: "موهبة", brand: "براند",
    editProfile: "تعديل الملف الشخصي",
    followers: "متابِعون", following: "متابَعون", rating: "التقييم",
    guestTitle: "انضم إلى المجتمع",
    guestSub: "أنشئ حساباً لمتابعة النقاشات، نشر الفرص، ومشاركة عملك.",
    guestCta: "إنشاء حساب",
  },
  en: {
    talent: "Talent", brand: "Brand",
    editProfile: "Edit profile",
    followers: "Followers", following: "Following", rating: "Rating",
    guestTitle: "Join the community",
    guestSub: "Create an account to follow discussions, post opportunities, and share your work.",
    guestCta: "Create account",
  },
} as const;

export default function ProfileSidebar({ lang, userId, me, onGuestCta }: Props) {
  const t = TX[lang];
  const [followCounts, setFollowCounts] = useState<{ followerCount: number; followingCount: number } | null>(null);

  useEffect(() => {
    if (!userId) { setFollowCounts(null); return; }
    let cancelled = false;
    fetch(`/api/community/follow?target=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setFollowCounts({ followerCount: data.followerCount, followingCount: data.followingCount }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  if (!userId) {
    return (
      <div className={styles.guestCard}>
        <p style={{ fontWeight: 900, color: "var(--text-primary)" }}>{t.guestTitle}</p>
        <p>{t.guestSub}</p>
        <button type="button" className={`${styles.button} ${styles.buttonSubmit}`} onClick={onGuestCta}>
          <UserRoundPlus size={16} />
          {t.guestCta}
        </button>
      </div>
    );
  }

  if (!me) {
    return <div className={styles.profileCard} style={{ minHeight: 220 }} />;
  }

  const tp = me.talentProfile;
  const isTalent = me.role === "talent" && !!tp;
  const statCount = isTalent ? 3 : 2;

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileCardTop}>
        <div className={styles.profileCardAvatarWrap}>
          {me.avatar_url ? (
            <img className={styles.profileCardAvatar} src={cdnImage(me.avatar_url, 96)} alt="" />
          ) : (
            <span className={styles.profileCardAvatarFallback}><UserPen size={20} aria-hidden="true" /></span>
          )}
          {me.is_verified && (
            <span className={styles.profileCardVerified}><Check size={10} strokeWidth={3.5} /></span>
          )}
        </div>
        <span className={styles.profileCardName}>{me.full_name}</span>
        <span className={styles.profileCardRole}>{me.role === "brand" ? t.brand : t.talent}</span>
        {me.city && <span className={styles.profileCardLocation}>{me.city}</span>}
      </div>

      <div className={styles.profileStatsRow} style={{ gridTemplateColumns: `repeat(${statCount}, 1fr)` }}>
        <div className={styles.profileStat}>
          <div className={styles.profileStatValue}>{(followCounts?.followerCount ?? 0).toLocaleString()}</div>
          <div className={styles.profileStatLabel}>{t.followers}</div>
        </div>
        <div className={styles.profileStat}>
          <div className={styles.profileStatValue}>{(followCounts?.followingCount ?? 0).toLocaleString()}</div>
          <div className={styles.profileStatLabel}>{t.following}</div>
        </div>
        {isTalent && (
          <div className={styles.profileStat}>
            <div className={styles.profileStatValue}>{tp!.avg_rating ? tp!.avg_rating.toFixed(1) : "—"}</div>
            <div className={styles.profileStatLabel}>{t.rating}</div>
          </div>
        )}
      </div>

      <Link href="/profile/me" className={styles.editProfileBtn}>
        {t.editProfile}
      </Link>
    </div>
  );
}
