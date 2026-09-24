import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { adminClient } from "@/lib/supabase/admin";

export interface PublicTestimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  company: string | null;
}

export interface PublicBrandMoment {
  id: string;
  title: string;
  location: string | null;
  imageUrl: string;
}

async function fetchApprovedTestimonials(): Promise<PublicTestimonial[]> {
  const { data, error } = await adminClient
    .from("landing_testimonials")
    .select("id, quote, author_name, author_role, company")
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[landing-content] fetchApprovedTestimonials failed", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    quote: r.quote,
    authorName: r.author_name,
    authorRole: r.author_role,
    company: r.company,
  }));
}

async function fetchApprovedBrandMoments(): Promise<PublicBrandMoment[]> {
  const { data, error } = await adminClient
    .from("landing_brand_moments")
    .select("id, title, location, image_url")
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[landing-content] fetchApprovedBrandMoments failed", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    location: r.location,
    imageUrl: r.image_url,
  }));
}

export async function getCachedApprovedTestimonials(): Promise<PublicTestimonial[]> {
  return cachedPublic(
    ["landing-testimonials"],
    [CACHE_TAGS.home.public],
    CACHE_SECONDS.tenMinutes,
    fetchApprovedTestimonials,
  );
}

export async function getCachedApprovedBrandMoments(): Promise<PublicBrandMoment[]> {
  return cachedPublic(
    ["landing-brand-moments"],
    [CACHE_TAGS.home.public],
    CACHE_SECONDS.tenMinutes,
    fetchApprovedBrandMoments,
  );
}

/** Real count for the home hero's "Completed projects" stat — was a
 * hardcoded "+3,200". Counts bookings that actually finished the pipeline
 * (completed or paid — see CLAUDE.md §10.1's status list). */
async function fetchCompletedProjectsCount(): Promise<number> {
  const { count, error } = await adminClient
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .in("status", ["completed", "paid"]);

  if (error) {
    console.error("[landing-content] fetchCompletedProjectsCount failed", error);
    return 0;
  }
  return count ?? 0;
}

export async function getCachedCompletedProjectsCount(): Promise<number> {
  return cachedPublic(
    ["landing-completed-projects"],
    [CACHE_TAGS.home.public],
    CACHE_SECONDS.tenMinutes,
    fetchCompletedProjectsCount,
  );
}

// ─── Home page: brands count, community highlights, featured packages ───────
// Everything here is real platform data. Nothing is invented to fill a
// section — an empty result is returned as an empty list/zero and the page
// renders an honest empty state instead.

const BLOCKED_ACCOUNT_STATES = ["blocked", "suspended", "rejected"];

/** Public brands = the same gate /brands applies: not blocked/suspended/rejected
 * and either never moderated (NULL) or approved (CLAUDE.md §12). */
async function fetchPublicBrandCount(): Promise<number> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, account_status, brand_status")
    .eq("role", "brand");

  if (error) {
    console.error("[landing-content] fetchPublicBrandCount failed", error);
    return 0;
  }
  return (data ?? []).filter(
    (b) =>
      !BLOCKED_ACCOUNT_STATES.includes(b.account_status ?? "active") &&
      (!b.brand_status || b.brand_status === "approved"),
  ).length;
}

export async function getCachedPublicBrandCount(): Promise<number> {
  return cachedPublic(
    ["landing-brand-count"],
    [CACHE_TAGS.home.public, CACHE_TAGS.brands.list],
    CACHE_SECONDS.tenMinutes,
    fetchPublicBrandCount,
  );
}

export interface HomeCommunityPost {
  id: string;
  type: "offer" | "story";
  title: string | null;
  content: string | null;
  price: number | null;
  mediaUrl: string | null;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
  authorHandle: string | null;
}

export interface HomeCommunityHighlights {
  /** Authors with an unexpired story, newest first, one entry per author. */
  stories: { id: string; authorName: string; authorAvatar: string | null }[];
  posts: HomeCommunityPost[];
}

async function fetchCommunityHighlights(): Promise<HomeCommunityHighlights> {
  const { data: rows, error } = await adminClient
    .from("community_posts")
    .select("id, user_id, post_type, title, content, price, media_url, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[landing-content] fetchCommunityHighlights failed", error);
    return { stories: [], posts: [] };
  }

  const now = Date.now();
  const live = (rows ?? []).filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now);
  const userIds = [...new Set(live.map((p) => p.user_id))];
  const { data: profiles } = userIds.length
    ? await adminClient
        .from("profiles")
        .select("id, full_name, handle, avatar_url, account_status")
        .in("id", userIds)
    : { data: [] };
  const byId = Object.fromEntries(
    (profiles ?? [])
      .filter((p) => !BLOCKED_ACCOUNT_STATES.includes(p.account_status ?? "active"))
      .map((p) => [p.id, p]),
  );

  const posts: HomeCommunityPost[] = [];
  const stories: HomeCommunityHighlights["stories"] = [];
  const storyAuthors = new Set<string>();

  for (const p of live) {
    const author = byId[p.user_id];
    if (!author) continue;
    if (p.post_type === "story" && !storyAuthors.has(p.user_id)) {
      storyAuthors.add(p.user_id);
      stories.push({ id: p.id, authorName: author.full_name ?? "", authorAvatar: author.avatar_url ?? null });
    }
    if (posts.length < 4) {
      posts.push({
        id: p.id,
        type: p.post_type === "story" ? "story" : "offer",
        title: p.title ?? null,
        content: p.content ?? null,
        price: typeof p.price === "number" ? p.price : p.price ? Number(p.price) : null,
        mediaUrl: p.media_url ?? null,
        createdAt: p.created_at,
        authorName: author.full_name ?? "",
        authorAvatar: author.avatar_url ?? null,
        authorHandle: author.handle ?? null,
      });
    }
  }

  return { stories: stories.slice(0, 6), posts };
}

export async function getCachedCommunityHighlights(): Promise<HomeCommunityHighlights> {
  return cachedPublic(
    ["landing-community-highlights"],
    [CACHE_TAGS.home.public, CACHE_TAGS.community.list],
    CACHE_SECONDS.fiveMinutes,
    fetchCommunityHighlights,
  );
}

export interface HomeFeaturedPackage {
  key: string;
  name: string;
  price: number;
  talentName: string;
  handle: string;
  avatarUrl: string;
}

/** One real service package from each of up to 3 different approved talents
 * (best-rated first). A talent's package needs a name and a numeric price to
 * qualify; talents without a profile photo are skipped (the card is a photo
 * thumbnail). Public gate re-applied here because adminClient bypasses RLS. */
async function fetchFeaturedPackages(): Promise<HomeFeaturedPackage[]> {
  const { data: tps, error } = await adminClient
    .from("talent_profiles")
    .select("user_id, packages, avg_rating, status")
    .eq("status", "approved")
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) {
    console.error("[landing-content] fetchFeaturedPackages failed", error);
    return [];
  }

  const candidates = (tps ?? []).flatMap((tp) => {
    const list = Array.isArray(tp.packages) ? (tp.packages as { id?: string; name?: string; price?: string | number }[]) : [];
    const pkgs = list
      .map((p) => ({ id: p.id ?? "", name: (p.name ?? "").trim(), price: Number(p.price) }))
      .filter((p) => p.name && Number.isFinite(p.price) && p.price > 0)
      .sort((a, b) => a.price - b.price);
    return pkgs.length ? [{ userId: tp.user_id as string, pkg: pkgs[0] }] : [];
  });
  if (!candidates.length) return [];

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, account_status")
    .in("id", candidates.map((c) => c.userId));
  const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const out: HomeFeaturedPackage[] = [];
  for (const c of candidates) {
    const p = byId[c.userId];
    if (!p || !p.handle || !p.avatar_url) continue;
    if (BLOCKED_ACCOUNT_STATES.includes(p.account_status ?? "active")) continue;
    out.push({
      key: `${c.userId}-${c.pkg.id || c.pkg.name}`,
      name: c.pkg.name,
      price: c.pkg.price,
      talentName: p.full_name ?? p.handle,
      handle: p.handle,
      avatarUrl: p.avatar_url,
    });
    if (out.length === 3) break;
  }
  return out;
}

export async function getCachedFeaturedPackages(): Promise<HomeFeaturedPackage[]> {
  return cachedPublic(
    ["landing-featured-packages"],
    [CACHE_TAGS.home.public, CACHE_TAGS.talents.list, CACHE_TAGS.packages.list],
    CACHE_SECONDS.tenMinutes,
    fetchFeaturedPackages,
  );
}
