"use client";
export const runtime = 'edge';

// ─── /profile/me/complete ───────────────────────────────────────────────────
// Dedicated full-page guided completion flow. Same data sources as
// /profile/me (/api/me, /api/profile/completion) — no new endpoints. Talent
// accounts only: a talent_profiles row is required, so a brand/no-profile
// visitor is bounced back to /profile/me rather than shown an empty wizard.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import CompleteProfileShell from "@/components/profile/complete/CompleteProfileShell";
import type { CompletionDTO } from "@/features/profiles/types/dto";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { dark, lang } = useSite();

  const [status, setStatus] = useState<"loading" | "ready" | "denied">("loading");
  const [profile, setProfile] = useState<any>(null);
  const [tp, setTp] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [completion, setCompletion] = useState<CompletionDTO | null>(null);

  const fetchCompletion = async () => {
    try {
      const res = await fetch("/api/profile/completion");
      if (!res.ok) return;
      const { data } = await res.json();
      setCompletion(data ?? null);
    } catch {}
  };

  const fetchProfile = async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) { router.push("/login"); return; }
    if (!res.ok) { setStatus("denied"); return; }
    const { profile: prof, talentProfile: talentProf, portfolioItems } = await res.json();
    if (!talentProf) { router.push("/profile/me"); return; }
    setProfile(prof);
    setTp(talentProf);
    setMedia(portfolioItems ?? []);
    setStatus("ready");
  };

  const refreshAll = async () => { await Promise.all([fetchProfile(), fetchCompletion()]); };

  useEffect(() => { refreshAll(); }, []);

  const BG = dark ? "#050B12" : "#F1F5F9";
  const TEXT = dark ? "#A8B3C2" : "#64748B";

  if (status !== "ready") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: BG }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", borderWidth: 3, borderStyle: "solid", borderColor: `var(--color-primary) var(--border-subtle) var(--border-subtle) var(--border-subtle)`, animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: TEXT, fontSize: 14, fontFamily: "var(--font-sans)" }}>
            {lang === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CompleteProfileShell
      profile={profile}
      talentProfile={tp}
      portfolioItems={media}
      completion={completion}
      onUpdate={refreshAll}
    />
  );
}
