"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import styles from "./CommunityPage.module.css";

export interface StoryPost {
  id: string;
  user_id: string;
  post_type: "story";
  content: string | null;
  media_url: string | null;
  created_at: string;
  author: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  lang: "ar" | "en";
  stories: StoryPost[];
  canPost: boolean;
  onAdd: () => void;
}

const STORY_DURATION_MS = 5000;

const TX = {
  ar: { add: "أضف", story: "Story" },
  en: { add: "Add", story: "Story" },
} as const;

// Groups flat story rows (newest-first, from the API) into one entry per
// author, each carrying that author's stories oldest-first — so the viewer
// plays them in the order they were posted, the way every other story UI does.
function groupByAuthor(stories: StoryPost[]) {
  const byAuthor = new Map<string, StoryPost[]>();
  for (const s of stories) {
    const list = byAuthor.get(s.user_id) ?? [];
    list.push(s);
    byAuthor.set(s.user_id, list);
  }
  return [...byAuthor.entries()].map(([userId, list]) => ({
    userId,
    author: list[0].author,
    stories: [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  }));
}

export default function StoryBar({ lang, stories, canPost, onAdd }: Props) {
  const t = TX[lang];
  const groups = groupByAuthor(stories);
  const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(null);

  if (groups.length === 0 && !canPost) return null;

  return (
    <>
      <div className={styles.storyBar}>
        {canPost && (
          <button type="button" className={styles.storyBarItem} onClick={onAdd}>
            <span className={`${styles.storyRing} ${styles.storyRingAdd}`}>
              <Plus size={20} color="var(--color-primary)" />
            </span>
            <span className={styles.storyLabel}>{t.add}</span>
          </button>
        )}
        {groups.map((g, i) => (
          <button key={g.userId} type="button" className={styles.storyBarItem} onClick={() => setOpenGroupIdx(i)}>
            <span className={styles.storyRing}>
              <img
                className={styles.storyAvatar}
                src={g.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.author?.full_name ?? g.userId}`}
                alt=""
              />
            </span>
            <span className={styles.storyLabel}>{g.author?.full_name ?? t.story}</span>
          </button>
        ))}
      </div>

      {openGroupIdx !== null && (
        <StoryViewer
          groups={groups}
          startIndex={openGroupIdx}
          onClose={() => setOpenGroupIdx(null)}
        />
      )}
    </>
  );
}

function StoryViewer({
  groups, startIndex, onClose,
}: {
  groups: ReturnType<typeof groupByAuthor>;
  startIndex: number;
  onClose: () => void;
}) {
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  function goNextStory() {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }

  function goPrevStory() {
    if (!group) return;
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx((i) => i - 1);
      setStoryIdx(prevGroup.stories.length - 1);
    }
  }

  useEffect(() => {
    setProgress(0);
    startRef.current = performance.now();
    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNextStory();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, storyIdx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrevStory();
      if (e.key === "ArrowRight") goNextStory();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, storyIdx]);

  if (!group || !story) return null;

  return (
    <div className={styles.storyViewerBackdrop} onClick={onClose}>
      <div className={styles.storyViewerCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.storyProgressRow}>
          {group.stories.map((_, i) => (
            <div key={i} className={styles.storyProgressTrack}>
              <div
                className={styles.storyProgressFill}
                style={{ width: `${i < storyIdx ? 100 : i === storyIdx ? progress : 0}%` }}
              />
            </div>
          ))}
        </div>

        <div className={styles.storyHeaderRow}>
          <div className={styles.storyHeaderAuthor}>
            <img
              src={group.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.author?.full_name ?? group.userId}`}
              alt=""
            />
            {group.author?.full_name ?? ""}
          </div>
          <button type="button" className={styles.storyCloseBtn} onClick={onClose} aria-label="close">
            <X size={16} />
          </button>
        </div>

        <div className={styles.storyMediaArea}>
          {story.media_url ? (
            <img src={story.media_url} alt="" />
          ) : (
            <p className={styles.storyTextOnly}>{story.content}</p>
          )}
        </div>

        {story.media_url && story.content && (
          <p className={styles.storyCaption}>{story.content}</p>
        )}

        <button type="button" className={styles.storyNavZone} style={{ insetInlineStart: 0 }} onClick={goPrevStory} aria-label="previous" />
        <button type="button" className={styles.storyNavZone} style={{ insetInlineEnd: 0 }} onClick={goNextStory} aria-label="next" />
      </div>
    </div>
  );
}
