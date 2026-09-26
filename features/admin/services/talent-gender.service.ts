import "server-only";

import { adminClient } from "@/lib/supabase/admin";
import { normalizeGender, type TalentGender } from "@/lib/profile-fields";

// ─── Talent gender back-fill ──────────────────────────────────────────────────
// Backs /admin/talents/gender: every talent with its current
// social_links.gender (what the Explore Male/Female filter reads), so an admin
// can set it for the accounts created before gender was collected.

export interface TalentGenderRow {
  profileId: string;
  handle:    string | null;
  name:      string;
  avatarUrl: string | null;
  category:  string | null;
  status:    string | null;
  gender:    TalentGender | null;
}

export async function fetchTalentGenderRows(): Promise<TalentGenderRow[]> {
  const { data: tps, error } = await adminClient
    .from("talent_profiles")
    .select("user_id, category, status, social_links");
  if (error) throw new Error(error.message);

  const ids = [...new Set((tps ?? []).map((t) => t.user_id).filter(Boolean))] as string[];
  if (ids.length === 0) return [];

  const { data: profiles, error: pErr } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, role")
    .in("id", ids);
  if (pErr) throw new Error(pErr.message);

  const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const seen = new Set<string>();

  return (tps ?? []).flatMap((tp) => {
    const p = byId[tp.user_id as string];
    if (!p || p.role !== "talent" || seen.has(p.id)) return [];
    seen.add(p.id);
    const sl = (tp.social_links ?? {}) as Record<string, unknown>;
    return [{
      profileId: p.id,
      handle:    p.handle ?? null,
      name:      p.full_name || p.handle || "—",
      avatarUrl: p.avatar_url ?? null,
      category:  tp.category ?? null,
      status:    tp.status ?? null,
      gender:    normalizeGender(sl.gender),
    }];
  }).sort((a, b) => {
    // Approved first (they're the ones on Explore), then by name.
    const ap = a.status === "approved" ? 0 : 1;
    const bp = b.status === "approved" ? 0 : 1;
    return ap - bp || a.name.localeCompare(b.name);
  });
}
