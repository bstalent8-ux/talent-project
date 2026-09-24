"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Check, UserPlus } from "lucide-react";
import type { CommunityOfferPost } from "./types";
import styles from "./CommunityPage.module.css";

interface SuggestedTalent {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  category: string | null;
}

interface Props {
  lang: "ar" | "en";
  trendingTags: { tag: string; count: number }[];
  offers: CommunityOfferPost[];
  onTagClick: (tag: string) => void;
  viewerId: string | null;
  onRequireAuth: () => void;
}

const TX = {
  ar: {
    trending: "الأكثر تداولاً", posts: "منشور",
    ending: "عروض تنتهي قريباً", noEnding: "لا توجد عروض بموعد انتهاء حالياً",
    endsIn: "ينتهي خلال", suggested: "مواهب مقترحة",
    follow: "تواصل", following: "متصل",
  },
  en: {
    trending: "Trending in Talents", posts: "posts",
    ending: "Offers ending soon", noEnding: "No offers with a deadline right now",
    endsIn: "Ends in", suggested: "Suggested talents",
    follow: "Connect", following: "Connected",
  },
} as const;

function timeLeft(iso: string, ar: boolean): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return ar ? "منتهي" : "ended";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}${ar ? "س" : "h"}`;
  const days = Math.floor(hours / 24);
  return `${days}${ar ? "ي" : "d"} ${hours % 24}${ar ? "س" : "h"}`;
}

export default function TrendingSidebar({ lang, trendingTags, offers, onTagClick, viewerId, onRequireAuth }: Props) {
  const t = TX[lang];
  const ar = lang === "ar";
  const [talents, setTalents] = useState<SuggestedTalent[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/community/suggested-talents?limit=4")
      .then((r) => (r.ok ? r.json() : { talents: [] }))
      .then((data) => { if (!cancelled) setTalents(data.talents ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!viewerId || talents.length === 0) return;
    let cancelled = false;
    Promise.all(talents.map((tal) =>
      fetch(`/api/community/follow?target=${tal.id}`).then((r) => (r.ok ? r.json() : null)).then((d) => [tal.id, !!d?.isFollowing] as const)
    )).then((entries) => {
      if (cancelled) return;
      setFollowing(Object.fromEntries(entries));
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerId, talents.map((t) => t.id).join(",")]);

  async function toggleFollow(id: string) {
    if (!viewerId) { onRequireAuth(); return; }
    setPending((p) => ({ ...p, [id]: true }));
    const wasFollowing = !!following[id];
    try {
      const res = wasFollowing
        ? await fetch(`/api/community/follow?followeeId=${id}`, { method: "DELETE" })
        : await fetch("/api/community/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followeeId: id }) });
      if (res.ok) setFollowing((p) => ({ ...p, [id]: !wasFollowing }));
    } finally {
      setPending((p) => ({ ...p, [id]: false }));
    }
  }

  const endingSoon = [...offers]
    .filter((o) => o.expires_at)
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())
    .slice(0, 3);

  return (
    <>
      {trendingTags.length > 0 && (
        <div className={styles.sideCard}>
          <div className={styles.sideCardHead}>
            <h3 className={styles.sideCardTitle}>{t.trending}</h3>
          </div>
          {trendingTags.map(({ tag, count }, i) => (
            <button
              key={tag}
              type="button"
              className={styles.trendingRow}
              style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", textAlign: ar ? "right" : "left", padding: "0.5rem 0" }}
              onClick={() => onTagClick(tag)}
            >
              <span className={styles.trendingRank}>{i + 1}</span>
              <span className={styles.trendingInfo}>
                <span className={styles.trendingTag}>#{tag}</span>
                <span className={styles.trendingCount}>{count} {t.posts}</span>
              </span>
              <TrendingUp size={14} className={styles.trendingArrow} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.sideCard}>
        <div className={styles.sideCardHead}>
          <h3 className={styles.sideCardTitle}>{t.ending}</h3>
        </div>
        {endingSoon.length === 0 ? (
          <p className={styles.sideCardEmpty}>{t.noEnding}</p>
        ) : (
          endingSoon.map((offer) => (
            <div key={offer.id} className={styles.endingItem}>
              <img
                className={styles.endingThumb}
                src={offer.media_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${offer.id}`}
                alt=""
              />
              <span className={styles.endingInfo}>
                <span className={styles.endingTitle}>{offer.title}</span>
                <span className={styles.endingCountdown}>{t.endsIn} {timeLeft(offer.expires_at!, ar)}</span>
              </span>
              <span className={styles.endingPrice}>
                {offer.price ? `${offer.price.toLocaleString()} EGP` : ""}
              </span>
            </div>
          ))
        )}
      </div>

      {talents.length > 0 && (
        <div className={styles.sideCard}>
          <div className={styles.sideCardHead}>
            <h3 className={styles.sideCardTitle}>{t.suggested}</h3>
          </div>
          {talents.map((tal) => {
            const isFollowing = !!following[tal.id];
            return (
              <div key={tal.id} className={styles.suggestedItem}>
                <Link href={`/talent/${tal.handle}`}>
                  <img
                    className={styles.suggestedAvatar}
                    src={tal.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tal.name}`}
                    alt=""
                  />
                </Link>
                <Link href={`/talent/${tal.handle}`} className={styles.suggestedInfo} style={{ textDecoration: "none" }}>
                  <span className={styles.suggestedName}>{tal.name}</span>
                  {tal.category && <span className={styles.suggestedRole}>{tal.category}</span>}
                </Link>
                <button
                  type="button"
                  className={styles.suggestedLinkBtn}
                  disabled={pending[tal.id]}
                  onClick={() => toggleFollow(tal.id)}
                  style={isFollowing ? { color: "var(--color-primary)", borderColor: "var(--color-primary)" } : undefined}
                >
                  {isFollowing ? <Check size={12} /> : <UserPlus size={12} />}
                  {isFollowing ? t.following : t.follow}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
