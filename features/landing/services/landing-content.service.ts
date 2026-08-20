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
