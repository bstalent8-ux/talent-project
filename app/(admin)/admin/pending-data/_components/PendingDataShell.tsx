"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import type { AvatarReviewCounts, PendingKind, PendingMediaCounts, PendingMediaStatus, PendingMediaType } from "@/features/admin/services/pending-media.service";

const STATUS_TABS: PendingMediaStatus[] = ["pending", "rejected", "approved", "all"];
const STATUS_COLOR: Record<PendingMediaStatus, string> = {
  pending: "#E7A58A", rejected: "#EF4444", approved: "#087F83", all: "#4FA7A3",
};
const TYPES: PendingMediaType[] = ["all", "photo", "video"];

const TX = {
  ar: {
    title: "بيانات قيد المراجعة",
    intro: "أي صور أو فيديوهات ترفعها الموهبة لازم تتراجع هنا قبل ما تظهر على بروفايلها العام — حتى لو البروفايل نفسه معتمد.",
    pending: "قيد المراجعة", rejected: "مرفوض", approved: "معتمد", all: "الكل",
    typeAll: "كل الأنواع", photo: "صور", video: "فيديوهات",
    kindMedia: "معرض الأعمال", kindAvatar: "صور البروفايل",
    avatarIntro: "أي صورة بروفايل جديدة بترفعها الموهبة بتفضل هنا، والصورة القديمة المعتمدة هي اللي بتظهر للعامة لحد ما توافق على الجديدة.",
    avatarMigration: "لتفعيل مراجعة صور البروفايل شغّل supabase/migrations/20260919_avatar_moderation.sql في Supabase. لحد ما يتشغل رفع صور البروفايل للمواهب متوقف.",
    search: "ابحث باسم الموهبة أو الـhandle...",
    migration: "لتفعيل حالة \"مرفوض\" وسبب الرفض شغّل ملف الـSQL: supabase/migrations/20260919_media_moderation.sql في Supabase. لحد ما يتشغل، الاعتماد بيشتغل والرفض لأ.",
  },
  en: {
    title: "Pending Data",
    intro: "Every photo or video a talent uploads must be reviewed here before it appears on their public profile — even when the profile itself is already approved.",
    pending: "Pending", rejected: "Rejected", approved: "Approved", all: "All",
    typeAll: "All types", photo: "Photos", video: "Videos",
    kindMedia: "Portfolio media", kindAvatar: "Profile photos",
    avatarIntro: "A new profile photo waits here. The last approved photo stays public until you approve the new one.",
    avatarMigration: "To turn on profile-photo review run supabase/migrations/20260919_avatar_moderation.sql in Supabase. Until then talents can not upload a new profile photo.",
    search: "Search by talent name or handle...",
    migration: "To enable the Rejected state and rejection reasons, run supabase/migrations/20260919_media_moderation.sql in Supabase. Until then approving works but rejecting doesn't.",
  },
};

interface Props {
  kind:     PendingKind;
  avatarCounts: AvatarReviewCounts;
  status:   PendingMediaStatus;
  type:     PendingMediaType;
  q:        string;
  counts:   PendingMediaCounts & { migrated: boolean };
  children: React.ReactNode;
}

// Sidebar + topbar + status tabs + filters — rendered immediately, never suspended.
// Only the media grid (children, wrapped in <Suspense> by page.tsx) shows a skeleton.
export default function PendingDataShell({ kind, avatarCounts, status, type, q, counts, children }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";

  const isAvatar = kind === "avatar";
  const hrefFor = (next: Partial<{ status: string; type: string; q: string; kind: string }>) => {
    const v = { status, type, q, kind, ...next };
    const p = new URLSearchParams();
    if (v.kind === "avatar") p.set("kind", "avatar");
    if (v.status && v.status !== "pending") p.set("status", v.status);
    if (v.type && v.type !== "all") p.set("type", v.type);
    if (v.q) p.set("q", v.q);
    const qs = p.toString();
    return qs ? `/admin/pending-data?${qs}` : "/admin/pending-data";
  };

  // Debounced search draft — typing shouldn't refetch the queue on every keystroke.
  const [draft, setDraft] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setDraft(q); }, [q]);
  function onSearch(value: string) {
    setDraft(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => router.push(hrefFor({ q: value })), 350);
  }

  const count = (s: PendingMediaStatus) => {
    if (isAvatar) return s === "all" ? avatarCounts.pending + avatarCounts.rejected : s === "approved" ? 0 : avatarCounts[s];
    return s === "all" ? counts.pending + counts.approved + counts.rejected : counts[s];
  };
  const tabs = isAvatar ? STATUS_TABS.filter((s) => s !== "approved") : STATUS_TABS;

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {([["media", t.kindMedia, counts.pending], ["avatar", t.kindAvatar, avatarCounts.pending]] as const).map(([k, label, pending]) => {
          const active = kind === k;
          return (
            <Link key={k} href={hrefFor({ kind: k, status: "pending", type: "all", q: "" })} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, textDecoration: "none", fontSize: 13.5, fontWeight: active ? 800 : 500, border: `1px solid ${active ? TEXT : BORDER}`, backgroundColor: active ? (dark ? "#3A2E28" : "#2B211D") : "transparent", color: active ? "#fff" : MUTED }}>
              {label}
              {pending > 0 && <span style={{ minWidth: 20, textAlign: "center", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 800, backgroundColor: "#E7A58A", color: "#111" }}>{pending}</span>}
            </Link>
          );
        })}
      </div>

      <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: "0 0 16px", maxWidth: 760 }}>{isAvatar ? t.avatarIntro : t.intro}</p>

      {isAvatar && !avatarCounts.migrated && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 10, marginBottom: 16, backgroundColor: "rgba(231,165,138,0.12)", border: "1px solid rgba(231,165,138,0.4)", color: dark ? "#E7A58A" : "#7A3B26", fontSize: 12.5, lineHeight: 1.6 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />{t.avatarMigration}
        </div>
      )}

      {!isAvatar && !counts.migrated && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 10, marginBottom: 16, backgroundColor: "rgba(231,165,138,0.12)", border: "1px solid rgba(231,165,138,0.4)", color: dark ? "#E7A58A" : "#7A3B26", fontSize: 12.5, lineHeight: 1.6 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />{t.migration}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((s) => {
            const active = status === s;
            const col = STATUS_COLOR[s];
            return (
              <Link
                key={s}
                href={hrefFor({ status: s })}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 20, textDecoration: "none",
                  border: `1px solid ${active ? col : BORDER}`, backgroundColor: active ? `${col}22` : "transparent",
                  color: active ? col : MUTED, fontSize: 13, fontWeight: active ? 700 : 500,
                }}
              >
                {t[s]}
                <span style={{ minWidth: 20, textAlign: "center", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 800, backgroundColor: s === "pending" && count(s) > 0 ? col : (dark ? "#3A2E28" : "#F1E8D2"), color: s === "pending" && count(s) > 0 ? "#111" : MUTED, fontVariantNumeric: "tabular-nums" }}>
                  {count(s)}
                </span>
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {!isAvatar && <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, border: `1px solid ${BORDER}`, backgroundColor: CARD }}>
            {TYPES.map((ty) => {
              const active = type === ty;
              const label = ty === "all" ? t.typeAll : ty === "photo" ? t.photo : t.video;
              return (
                <Link key={ty} href={hrefFor({ type: ty })} style={{ padding: "5px 12px", borderRadius: 8, textDecoration: "none", fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? TEXT : MUTED, backgroundColor: active ? (dark ? "#3A2E28" : "#F1E8D2") : "transparent" }}>
                  {label}
                </Link>
              );
            })}
          </div>}
          <div style={{ position: "relative" }}>
            <Search size={14} color={MUTED} style={{ position: "absolute", insetInlineStart: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={draft}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={t.search}
              style={{ width: 250, padding: "8px 12px", paddingInlineStart: 30, borderRadius: 10, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: TEXT, fontSize: 12.5, outline: "none" }}
            />
          </div>
        </div>
      </div>

      {children}
    </AdminShell>
  );
}
