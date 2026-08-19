"use client";
import { Star, MapPin, BadgeCheck, Zap, Crown, Send, SearchX, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TalentCard } from "../page";
import { cdnImage } from "@/lib/images";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import { useGuestGuard } from "@/contexts/GuestGuard";
import styles from "./ExplorePage.module.css";

interface Props {
  lang: "ar" | "en";
  talents: TalentCard[];
  myRole?: string | null;
  myId?: string | null;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (talentId: string) => void;
  onSendBrief?: (talent: TalentCard) => void;
}

function TalentCardItem({
  talent, lang, myRole, favoriteIds, onToggleFavorite, onSendBrief,
}: {
  talent: TalentCard;
  lang: "ar" | "en";
  myRole?: string | null;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (talentId: string) => void;
  onSendBrief?: (t: TalentCard) => void;
}) {
  const initial = talent.name.charAt(0).toUpperCase();
  const favorited = favoriteIds?.has(talent.id) ?? false;
  const router = useRouter();
  const { isGuest } = useGuestGuard();

  // Explore lists many talents on one page, so the generic guest-auth
  // redirect (which returns to the CURRENT page — see GuestGuard.tsx's
  // go()) can't carry "which card" through the round trip. Sending a guest
  // straight to this talent's own profile with the same next/resume
  // convention every profile page already consumes preserves that context
  // without touching the shared auth gate itself.
  const profileHref = canonicalTalentPath(talent.category, talent.handle);

  function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) {
      router.push(`/login?next=${encodeURIComponent(`${profileHref}?resume=favorite_talent`)}`);
      return;
    }
    onToggleFavorite?.(talent.id);
  }

  return (
    <Link href={profileHref} className={styles.talentCard}>
      {/* Media */}
      <div className={styles.talentMedia}>
        {talent.avatar_url ? (
          <img src={cdnImage(talent.avatar_url, 400)} alt={talent.name} loading="lazy" />
        ) : (
          <div className={styles.talentInitial}>{initial}</div>
        )}

        <div className={styles.mediaBadges}>
          {talent.premium && (
            <span className={`${styles.mediaBadge} ${styles.badgePremium}`}>
              <Crown size={10} />
              {lang === "ar" ? "بريميوم" : "Premium"}
            </span>
          )}
          {talent.fast_response && (
            <span className={`${styles.mediaBadge} ${styles.badgeFast}`}>
              <Zap size={10} />
              {lang === "ar" ? "رد سريع" : "Fast reply"}
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            className={styles.heartBtn}
            aria-label={favorited ? (lang === "ar" ? "في المفضلة" : "Favorited") : (lang === "ar" ? "إضافة للمفضلة" : "Favorite")}
            onClick={handleFavoriteClick}
          >
            <Heart size={12} className={favorited ? styles.heartActive : undefined} fill={favorited ? "currentColor" : "none"} />
          </button>
        )}

        {talent.rating > 0 && (
          <span className={styles.ratingChip}>
            <Star size={9} fill="currentColor" />
            {talent.rating.toFixed(1)}
            <span className={styles.ratingCount}>({talent.review_count})</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className={styles.talentBody}>
        <h3 className={styles.talentName}>
          <span>{talent.name}</span>
          {talent.verified && <BadgeCheck size={13} />}
        </h3>

        {talent.category && <span className={styles.talentCategory}>{talent.category}</span>}

        {talent.location && (
          <span className={styles.talentLocation}>
            <MapPin size={10} />
            {talent.location}
          </span>
        )}

        {/* One tag — the single key specialty, not a 2-tag row */}
        {talent.specialties.length > 0 && (
          <div className={styles.specialtyRow}>
            <span className={styles.specialtyTag}>{talent.specialties[0]}</span>
          </div>
        )}

        <div className={styles.talentFooter}>
          <div>
            <p className={styles.priceLabel}>{lang === "ar" ? "يبدأ من" : "Starting at"}</p>
            <p className={styles.priceValue}>
              {talent.starting_price
                ? `${talent.starting_price.toLocaleString()} ${lang === "ar" ? "ج.م" : "EGP"}`
                : lang === "ar" ? "اطلب عرض سعر" : "Get quote"}
            </p>
          </div>
          <span className={styles.bookBtn}>{lang === "ar" ? "احجز" : "Book"}</span>
        </div>

        {myRole === "brand" && onSendBrief && (
          <button
            type="button"
            className={styles.briefBtn}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSendBrief(talent); }}
          >
            <Send size={12} />
            {lang === "ar" ? "إرسال بريف" : "Send brief"}
          </button>
        )}
      </div>
    </Link>
  );
}

export default function ExploreGrid({ lang, talents, myRole, favoriteIds, onToggleFavorite, onSendBrief }: Props) {
  if (talents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}><SearchX size={26} /></span>
        <p className={styles.emptyTitle}>
          {lang === "ar" ? "لا توجد نتائج مطابقة" : "No talents match your filters"}
        </p>
        <p className={styles.emptyText}>
          {lang === "ar" ? "جرّب تغيير الفلاتر أو إعادة الضبط" : "Try adjusting or resetting your filters."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.talentGrid}>
      {talents.map((talent) => (
        <TalentCardItem
          key={talent.id}
          talent={talent}
          lang={lang}
          myRole={myRole}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onSendBrief={onSendBrief}
        />
      ))}
    </div>
  );
}
