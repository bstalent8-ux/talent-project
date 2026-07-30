import "server-only";

import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";

export const CACHE_SECONDS = {
  fiveMinutes:  300,
  tenMinutes:   600,
  thirtyMinutes: 1800,
  oneHour:     3600,
} as const;

export const CACHE_TAGS = {
  home: {
    public: "home:public",
  },
  talents: {
    list: "talents:list",
    detail: (id: string) => `talent:${id}`,
  },
  brands: {
    list: "brands:list",
    detail: (id: string) => `brand:${id}`,
  },
  jobs: {
    list: "jobs:list",
    detail: (id: string) => `job:${id}`,
  },
  packages: {
    list: "packages:list",
  },
  community: {
    list: "community:list",
    question: (id: string) => `community:question:${id}`,
  },
  trustedBrands: {
    list: "trusted-brands",
  },
} as const;

export const PUBLIC_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=600";
export const PRIVATE_NO_STORE = "private, no-store";

export function publicCacheHeaders(seconds: number = CACHE_SECONDS.fiveMinutes): HeadersInit {
  return {
    "Cache-Control": `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`,
  };
}

export function privateNoStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": PRIVATE_NO_STORE,
  };
}

export async function cachedPublic<T>(
  keyParts: string[],
  tags: string[],
  revalidate: number,
  loader: () => Promise<T>,
): Promise<T> {
  return unstable_cache(loader, keyParts, { tags, revalidate })();
}

export function invalidateTalent(idOrHandle?: string | null) {
  revalidateTag(CACHE_TAGS.talents.list);
  revalidateTag(CACHE_TAGS.home.public);
  if (idOrHandle) revalidateTag(CACHE_TAGS.talents.detail(idOrHandle));
  revalidatePath("/explore");
  revalidatePath("/home");
}

export function invalidateBrand(idOrHandle?: string | null) {
  revalidateTag(CACHE_TAGS.brands.list);
  if (idOrHandle) revalidateTag(CACHE_TAGS.brands.detail(idOrHandle));
  revalidatePath("/brands");
}

export function invalidateJobs(id?: string | null) {
  revalidateTag(CACHE_TAGS.jobs.list);
  if (id) revalidateTag(CACHE_TAGS.jobs.detail(id));
  revalidatePath("/jobs");
}

export function invalidatePackages() {
  revalidateTag(CACHE_TAGS.packages.list);
  revalidatePath("/packages");
  revalidatePath("/pricing");
}

export function invalidateCommunity(questionId?: string | null) {
  revalidateTag(CACHE_TAGS.community.list);
  if (questionId) revalidateTag(CACHE_TAGS.community.question(questionId));
  revalidatePath("/community");
  if (questionId) revalidatePath(`/community/question/${questionId}`);
}

export function invalidateTrustedBrands() {
  revalidateTag(CACHE_TAGS.trustedBrands.list);
  revalidatePath("/home");
}
