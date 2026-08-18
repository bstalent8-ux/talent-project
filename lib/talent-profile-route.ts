// Pure route mapping — safe to import from client AND server components
// (unlike app/(main)/_lib/load-talent-profile.ts, which pulls in
// server-only Supabase clients). Keep this file free of any server-only
// import so client link-builders (Explore cards, Favorites, etc.) can use it
// directly instead of hardcoding "/talent/".

/** category === "model"/"fashion" → /model/[handle]; "ugc" → /ugc/[handle];
 * everything else → /talent/[handle]. Stored category values are not
 * migrated — this is UI routing only. */
export function canonicalTalentPath(category: string | null | undefined, handle: string): string {
  if (category === "model" || category === "fashion") return `/model/${handle}`;
  if (category === "ugc") return `/ugc/${handle}`;
  return `/talent/${handle}`;
}
