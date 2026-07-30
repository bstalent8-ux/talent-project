# Caching Architecture

Status: implemented for the current Next.js 15 App Router codebase.

This project does not currently have TanStack Query or Zustand installed or wired into the app. The application-wide caching layer therefore uses Next server caching, HTTP cache headers, Server Component data fetching, and explicit invalidation around existing mutation routes. Private user state remains uncached.

## Core Rules

- Public marketplace data can be cached.
- Authentication state, roles, permissions, dashboards, profile editing, bookings, chat, notifications, payments, and admin data are never shared-cacheable.
- Routes that read cookies or user-specific state use `Cache-Control: private, no-store`, `dynamic = "force-dynamic"`, or both.
- Service-role Supabase reads are allowed only on the server. They must remain paired with existing role/ownership checks for private data.
- No cache may contain private rows or mixed guest/authenticated responses.

## Shared Cache Primitives

`lib/cache.ts` defines:

- `CACHE_SECONDS`: 5 minutes, 10 minutes, 30 minutes, 1 hour.
- `CACHE_TAGS`: stable invalidation tags for talents, brands, jobs, packages, community, and home.
- `cachedPublic()`: wrapper around `unstable_cache()`.
- `publicCacheHeaders()`: `public, max-age=N, stale-while-revalidate=2N`.
- `privateNoStoreHeaders()`: `private, no-store`.
- Invalidation helpers: `invalidateTalent`, `invalidateBrand`, `invalidateJobs`, `invalidatePackages`, `invalidateCommunity`.

## Page Audit

| Page | Data Source | Fetching | Current Request Count | Strategy | Duration |
|---|---|---:|---:|---|---:|
| `/` | Redirect to `/home` | Server redirect | 0 DB | No cache needed | n/a |
| `/home` | `profiles` + `talent_profiles` via public talent service | Server Component | 1 public cached read | `unstable_cache`, public talent/home tags | 10 min |
| `/explore` | `profiles` + `talent_profiles`; optional viewer category | Server Component | 1 public cached read + optional viewer lookup | Public list cached; viewer role/category uncached | 5 min |
| `/talents` | Redirect to `/explore` | Server redirect | 0 DB | No cache needed | n/a |
| `/talent/[handle]` | `profiles`, `talent_profiles`, `portfolio_items`, `reviews`, `talent_brands`, `bookings` | Server Component | Parallel public reads after profile lookup | `unstable_cache`, talent detail/list tags | 10 min |
| `/brands` | `profiles`, `bookings` | Server Component | 1 public brand read + 1 aggregate read | `unstable_cache`, brand list tag | 10 min |
| `/brand/[id]` | `profiles`, completed `bookings` | Server Component | 2 public reads | `unstable_cache`, brand detail/list tags | 10 min |
| `/jobs` | `jobs`, brand `profiles` | Server Component | 1 public job read + 1 batched brand read | `unstable_cache`, job list tag | 5 min |
| `/jobs/[id]` | `jobs`, brand `profiles` | Server Component | 2 public reads | `unstable_cache`, job detail/list tags | 5 min |
| `/campaigns` | Redirect to `/jobs` | Server redirect | 0 DB | Uses jobs cache after redirect | 5 min |
| `/packages`, `/pricing` | package service tables | Server/API | 1 cached public package payload | `unstable_cache`, package list tag | 1 hour |
| `/community` | `/api/community/questions` client fetch | Client fetch | 1 public API read | Public HTTP cache headers | 5 min |
| `/community/question/[id]` | `/api/community/questions/[id]` client fetch | Client fetch | 1 public read with view increment | No-store due view side effect | n/a |
| `/dashboard` | role/private surfaces | Server/client | user-specific | Force dynamic/no-store | n/a |
| `/profile`, `/profile/me` | `/api/me`, profile APIs, uploads | Client fetch | user-specific | Private no-store | n/a |
| `/messages`, `/chat` | chat API/realtime | Server/client | user-specific | Force dynamic/no-store | n/a |
| `/bookings` | `bookings` + related rows | Server/API | user-specific batched reads | Force dynamic/no-store | n/a |
| `/notifications` | notification API/realtime | Client fetch | user-specific | Force dynamic/no-store | n/a |
| `/settings`, `/payments` | user-specific | route protected | user-specific | Private no-store headers configured | n/a |
| `/admin` | service-role admin services | Server/client | admin-only | Force dynamic/no-store | n/a |

## API Cache Policy

Public GET APIs:

- `/api/jobs`: `public, max-age=300, stale-while-revalidate=600`.
- `/api/packages`: `public, max-age=3600, stale-while-revalidate=7200`.
- `/api/community/questions`: `public, max-age=300, stale-while-revalidate=600`.
- `/api/community/answers`: `public, max-age=300, stale-while-revalidate=600`.
- `/api/v1/talents`: `public, max-age=300, stale-while-revalidate=600`.

Private or user-specific APIs:

- `/api/me`, `/api/me/role`, `/api/bookings`, `/api/chat/*`, `/api/notifications/*`, `/api/profile/*`, `/api/portfolio`, `/api/subscriptions`, `/api/reviews/*`, `/api/admin/*`.
- These return or are covered by `Cache-Control: private, no-store`.

## Invalidations

The following mutation paths invalidate public cache tags:

- Talent update or portfolio change: `talents:list`, `home:public`, and talent detail tag when the handle/id is known.
- Admin talent approval, rejection, suspension, restore, or delete: `talents:list`, `home:public`, `/explore`, `/home`.
- Admin brand moderation or profile update: `brands:list`, brand detail tag when id/handle is known.
- New job: `jobs:list`, new job detail tag, `/jobs`.
- Package create/update/active-state change: `packages:list`, `/packages`, `/pricing`.
- Community question/answer create/update/delete: `community:list`, question detail tag when known.

## Client Cache Strategy

Because TanStack Query is not present in the actual project, no QueryClient provider was added. Existing client fetches were left in place and now rely on API cache headers for public data and no-store for private data.

Recommended QueryClient defaults if the project later adopts TanStack Query:

```ts
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
}
```

User-action or realtime-adjacent queries should use `staleTime: 30_000` or `no-store` APIs, not the public defaults.

## Zustand Audit

No Zustand store was found in the current codebase. UI state remains local component/context state. Server data should not be moved into a global client store without adding invalidation and authorization rules.

## Security Checks

- `/api/me/role` returns guest state with `200` and `private, no-store`.
- Guest public pages use only approved/non-suspended public data.
- Private pages are protected by middleware/route redirects and response cache headers.
- Private APIs perform existing auth/role/ownership checks and advertise `private, no-store`.
- Service-role cache usage is limited to public rows only.

## Verification

Run:

```bash
npm run typecheck
npm run build
npm run test:e2e
```

`tests/e2e/cache.test.mjs` verifies public and private cache header contracts.
