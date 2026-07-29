"use client";
import { Star, MapPin, BadgeCheck, Zap, Crown, Send, SearchX } from "lucide-react";
import Link from "next/link";
import type { TalentCard } from "../page";
import { cdnImage } from "@/lib/images";
import styles from "./ExplorePage.module.css";

interface Props {
  lang: "ar" | "en";
  talents: TalentCard[];
  myRole?: string | null;
  myId?: string | null;
  onSendBrief?: (talent: TalentCard) => void;
}

function TalentCardItem({
  talent, lang, myRole, onSendBrief,
}: {
  talent: TalentCard;
  lang: "ar" | "en";
  myRole?: string | null;
  onSendBrief?: (t: TalentCard) => void;
}) {
  const initial = talent.name.charAt(0).toUpperCase();

  return (
    <Link href={`/talent/${talent.handle}`} className={styles.talentCard}>
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

        {talent.rating > 0 && (
          <span className={styles.ratingChip}>
            <Star size={11} fill="currentColor" />
            {talent.rating.toFixed(1)}
            <span className={styles.ratingCount}>({talent.review_count})</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className={styles.talentBody}>
        <h3 className={styles.talentName}>
          <span>{talent.name}</span>
          {talent.verified && <BadgeCheck size={15} />}
        </h3>

        {talent.category && <span className={styles.talentCategory}>{talent.category}</span>}

        {talent.location && (
          <span className={styles.talentLocation}>
            <MapPin size={11} />
            {talent.location}
          </span>
        )}

        {talent.specialties.length > 0 && (
          <div className={styles.specialtyRow}>
            {talent.specialties.slice(0, 2).map((s) => (
              <span key={s} className={styles.specialtyTag}>{s}</span>
            ))}
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

export default function ExploreGrid({ lang, talents, myRole, onSendBrief }: Props) {
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
          onSendBrief={onSendBrief}
        />
      ))}
    </div>
  );
}
