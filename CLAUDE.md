# CLAUDE.md — Technical Context

> **Audience:** AI assistants (Claude Code) and developers working on this repo.
> **Status:** Describes the **current, real implementation** as of 2026-07-21 (branch `main`, commit `e638876`).
> **Companion doc:** [PRODUCT.md](./PRODUCT.md) — product vision, design system, packages strategy.
>
> ⚠️ Two older documents exist in the repo — `SYSTEM_DESIGN.md` and `ROADMAP.md`. They describe an
> **aspirational** design (Shadcn, TanStack Query, Zustand, React Hook Form, Stripe escrow, `briefs` table)
> that was **never built**. Treat them as historical intent only. **This file is the source of truth.**

---

## 1. Project Overview

**Talents** (`talents-platform`) is an Arabic-first, RTL talent marketplace connecting **talents**
(models, influencers, UGC creators, hosts) with **brands** in the Egyptian/Arab market.

Core loop: brands discover talents → send a project brief → talent accepts → brand pays → talent
delivers → brand approves & reviews. Supporting systems: job board, 1:1 chat, community Q&A,
notifications, and an admin back-office.

- **Primary language:** Arabic (RTL default), English secondary (LTR) — bilingual UI strings are
  inlined per-component as `TX = { ar: {...}, en: {...} }`.
- **Currency:** EGP.
- **Live surface:** guests can browse `/home`, `/explore`, `/talent/[handle]`, `/jobs`,
  `/brands`, `/about`, `/blog`, `/contact`, and the legal pages.

---

## 2. Tech Stack (actual, from `package.json`)

| Layer | What is actually used |
|---|---|
| Framework | **Next.js 15.3.4** (App Router), React 19 |
| Language | TypeScript 5 — `strict: false`, path alias `@/*` → repo root |
| Styling | **Inline `style={{}}` objects** (dominant), Tailwind CSS v4 + `app/globals.css` (design tokens, animation utilities) |
| Animation | `framer-motion` ^12 |
| Icons | `lucide-react` ^1.21 |
| Auth / DB / Realtime | **Supabase** (`@supabase/ssr` ^0.12, `@supabase/supabase-js` ^2.110) |
| Media | **Cloudinary** (unsigned upload preset, proxied through our API routes) |
| Runtime | **Cloudflare Workers / Edge** — every route exports `export const runtime = 'edge'` |
| Deploy | Cloudflare Pages via `@cloudflare/next-on-pages` + `wrangler` (GitHub Actions on push to `main`) |
| Utilities | `clsx` + `tailwind-merge` (`lib/utils.ts` → `cn()`) |

### Installed but NOT used — do not assume they are wired up
- `zod` — **zero imports**. All validation is hand-rolled inside API routes / form components.
- `next-intl` — **zero imports**. i18n is the hand-rolled `TX` object + `SiteContext`.
- `dotenv` — only relevant to `scripts/`.

### Explicitly NOT in the project (despite `SYSTEM_DESIGN.md`)
Shadcn UI, TanStack Query, Zustand, React Hook Form, Stripe, Resend, Edge Functions.

---

## 3. Architecture

```
Browser (RTL Arabic UI, dark/light)
   │
   ├── Server Components / Layouts ──► lib/supabase/server.ts   (anon key + cookies, RLS enforced)
   │                                   lib/supabase/admin.ts    (service role, RLS BYPASSED)
   │
   ├── middleware.ts  ──► validates JWT (getUser) + blocks suspended accounts (service role)
   │
   └── Client Components ──► fetch("/api/...") ──► app/api/**  (edge route handlers)
                              │
                              └─► adminClient (service role) + manual auth/role checks
                                     │
                                     ▼
                              Supabase Postgres (RLS policies) · Supabase Realtime (chat, notifications)
                              Cloudinary (images/video)
```

### The single most important architectural decision
**Almost all data access goes through `adminClient` (the `service_role` key), which bypasses RLS.**
Authorization is therefore enforced **in application code**, not by the database. Every API route
follows this shape:

```ts
export const runtime = 'edge';

const supabase = await createClient();                    // 1. anon/SSR client
const { data: { user } } = await supabase.auth.getUser(); // 2. validate the JWT (never getSession)
if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

const { data: profile } = await adminClient               // 3. role check via service role
  .from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "brand") return NextResponse.json({ error: "brands only" }, { status: 403 });

// 4. ... service-role reads/writes
```

**Rule:** if you add a route that touches `adminClient`, you MUST hand-write the ownership/role
check. RLS will not save you. See §8.

---

## 4. Folder Structure

```
/
├── app/
│   ├── layout.tsx              Root layout: <html dir="rtl">, theme/lang blocking script, SiteProvider
│   ├── page.tsx                → redirect("/home")
│   ├── globals.css             Design tokens, .glass-panel, .btn-*, .sr-* scroll reveal, light-mode overrides
│   ├── blocked/                Landing page for suspended/blocked accounts
│   │
│   ├── (main)/                 Public + authenticated marketplace. Layout = Navbar + Footer + GlobalChat
│   │   ├── home/ explore/ brands/ jobs/ community/ blog/ about/ contact/
│   │   ├── talent/[handle]/    ✅ CANONICAL public talent profile (server-fetched)
│   │   ├── profile/[username]/ ⚠️ DUPLICATE of the above — see §12 Tech debt
│   │   ├── profile/me/         Talent's own editable profile / dashboard (792-line client component)
│   │   ├── bookings/           Project pipeline list + /bookings/[id] detail (brief, deliverables, review)
│   │   ├── chat/               Conversation list + /chat/[id] thread
│   │   └── legal/{terms,privacy,cookies}/  + root aliases /terms /privacy /cookies
│   │
│   ├── (auth)/                 login/ register/ onboarding/ — bare layout, no navbar
│   ├── (admin)/                Admin back-office. Layout enforces role === "admin"
│   │   └── admin/{talents,brands,bookings,reviews,verifications,settings}/
│   │
│   └── api/                    Edge route handlers (see §7)
│
├── components/                 Cross-route shared UI
│   ├── Navbar.tsx  Footer.tsx  DirectBriefModal.tsx
│   ├── admin/      AdminShell, AdminSidebar, StatusBadge, Pagination, ConfirmationModal…
│   ├── chat/       GlobalChat, FloatingChatWidget
│   ├── notifications/  NotificationBell, NotificationDropdown, NotificationItem
│   ├── profile/    ProfileClient, ProfileCompletionCard, ProfileHero
│   └── legal/ blog/ contact/
│
├── contexts/SiteContext.tsx    lang (ar|en) + mode (dark|light), persisted to localStorage
├── features/                   Feature-scoped service/transformer/type layers
│   ├── talent-profile/         service (DB reads) → transformer (DB → view model) → types
│   ├── admin/                  admin.service.ts + admin types
│   └── chat/types
├── hooks/useIsMobile.ts        Viewport breakpoint hook used by nearly every component
├── hooks/notifications/        Singleton notification store + Realtime subscription hooks
├── lib/
│   ├── supabase/{server,client,admin}.ts
│   ├── notifications/          service, event helpers, templates, validation + v1 compatibility shim
│   ├── profile-completion.ts   Weighted profile-completion scoring + feature thresholds
│   ├── recalcRating.ts
│   └── utils.ts                cn()
├── middleware.ts               Account-status gate (blocked/suspended/rejected → /blocked)
├── supabase/migrations/        Hand-run SQL (NOT the Supabase CLI — see §6)
├── scripts/                    One-off seed/check scripts (ts + mjs, run manually)
├── SYSTEM_DESIGN.md            ⚠️ historical/aspirational
└── ROADMAP.md                  ⚠️ historical/aspirational
```

### Route-group conventions
- Page-specific components live in a colocated `_components/` folder (not routable).
- Server page (`page.tsx`) fetches data → passes props to a `*Client.tsx` client component.
- Every `page.tsx`, `layout.tsx`, and `route.ts` starts with `export const runtime = 'edge';`.

---

## 5. Authentication Flow

### Registration (`app/(auth)/register/page.tsx`)
1. Client-side validation (hand-rolled: name, email, phone ≥ 9 digits, password ≥ 8, match, terms).
2. `supabase.auth.signUp({ email, password, options: { data: { role, full_name } } })`
   — role is `"talent"` or `"brand"`, stored in `auth.users.user_metadata`.
3. `POST /api/profile` creates the `profiles` row (+ a `talent_profiles` row when role is talent,
   seeded with `category: "ugc"`, empty `specialties`/`social_links`/`packages`, `availability: "available"`).
4. `handle` is derived from the email local-part, lowercased, non-`[a-z0-9-]` stripped.

### Session handling
- **Server**: `lib/supabase/server.ts` → `createServerClient` bound to Next cookies.
- **Browser**: `lib/supabase/client.ts` → memoized singleton `createBrowserClient`; a failed
  `getSession()` triggers a local `signOut()` so stale cookies can't wedge the app.
- **Always `supabase.auth.getUser()`**, never `getSession()`, for authorization — `getUser()`
  revalidates the JWT against Supabase.

### Middleware (`middleware.ts`)
Runs on all non-static paths. Skips `/_next`, `/favicon`, `/assets`, `/api/auth`, and always allows
`/blocked`, `/login`, `/register`, `/forgot-password`.
For a logged-in user it reads `profiles.account_status` via the **service role** and redirects to
`/blocked?reason=…` when the status is `blocked`, `suspended`, or `rejected`.
It does **not** enforce login — unauthenticated users pass through and pages/layouts decide.

### Route protection
| Surface | Enforced where |
|---|---|
| `/admin/*` | `app/(admin)/layout.tsx` — `getUser()` → service-role `profiles.role === "admin"` else redirect |
| `/api/*` | Per-route `getUser()` + role/ownership checks |
| Blocked accounts | `middleware.ts` |
| `(main)` pages | Mostly public; client components fetch `/api/me` and degrade gracefully |

### Self-healing profiles
`GET /api/me` and `POST /api/sync-profile` will **auto-create a missing `profiles` row** from
`auth.users.user_metadata` (defaulting `role` to `"talent"`). This exists because signup can
partially fail. Keep this behaviour in mind when debugging "user exists but has no profile".

---

## 6. Supabase Setup

### Environment variables (`.env.local`, and GitHub Secrets for CI)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server only — never expose
SUPABASE_JWKS_URL=                    # present, currently unused by app code
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET= # unsigned preset
NEXT_PUBLIC_CLOUDINARY_FOLDER=        # default "talents"
```

### The three clients
| File | Key | RLS | Use for |
|---|---|---|---|
| `lib/supabase/server.ts` | anon + cookies | ✅ enforced | Server Components, and **auth validation** in API routes |
| `lib/supabase/client.ts` | anon (browser) | ✅ enforced | Client-side auth calls, Realtime subscriptions |
| `lib/supabase/admin.ts` | `service_role` | ❌ bypassed | Nearly all server-side reads/writes. **Server only.** |

`adminClient` is a lazy `Proxy` so a missing env var doesn't break the Cloudflare build, and it
strips the `cache` option from `fetch` (unsupported in Workers).

### Migrations — important workflow note
`supabase/migrations/*.sql` are **hand-authored scripts pasted into the Supabase SQL editor**, not
Supabase CLI migrations. Naming is inconsistent (`002_…`, `20260630_…`, `add_talent_status.sql`).
They are written idempotently (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
**The database is the source of truth, not this folder** — several live columns (e.g.
`profiles.is_approved`, `is_suspended`, `bookings.talent_user_id`, `bookings.service_type`,
the `jobs`, `job_applications`, `conversations`, `messages`, `deliverables`, `payments`,
`booking_briefs`, `portfolio_items` tables) have **no migration file in this repo**. When in doubt,
inspect the live schema.

---

## 7. Database Schema Overview

Tables referenced by application code (frequency of use in parentheses):

### Identity
- **`profiles`** (~100 refs) — 1:1 with `auth.users`. `id`, `role`, `full_name`, `handle` (unique
  public slug), `avatar_url`, `city`, `bio`, `phone_number`, `created_at`,
  `is_verified`, `verified_at`, `balance`,
  `account_status` + `blocked_at`/`blocked_by`/`block_reason`,
  `brand_status` (`pending|approved|rejected`) + `tax_document_url`/`brand_approved_at`/`brand_rejection_reason`,
  and the legacy pair `is_approved` / `is_suspended` still read by the admin service.
- **`talent_profiles`** (~42) — 1:1 with a talent `profiles` row via `user_id`.
  `category`, `specialties text[]`, `bio`, `availability`,
  **`packages jsonb`**, **`social_links jsonb`**, `profile_views`, `avg_rating`,
  `total_reviews`, `total_bookings`, `is_featured`, `status`, `approved_at`, `rejection_reason`.
- **`talent_verifications`** (8) — ID doc + selfie + social proof, `pending|approved|rejected`.

### The two JSONB grab-bags (know these cold)
`talent_profiles.packages` — array of `{ id, name, price, popular, features[] }`.
`talent_profiles.social_links` — far more than social links; it is the catch-all profile blob:
`instagram/tiktok/youtube/linkedin` (+ follower counts), `usage_addons[] {key,label,price}`,
`experience[] {name,year,verified}`, `campaign_stats`, `featured_campaign`, `brands[]` (legacy),
`title`, `member_since`, `views_display`, `fast_response`, `premium`, `gender`, and physical
attributes (`height`, `weight`, `hair_color`, `shoe_size`, `age`, `languages`, `dialect`).

### Marketplace
- **`bookings`** (~34) — the project pipeline. `brand_id` → `profiles.id`,
  `talent_id` → **`talent_profiles.id`**, `talent_user_id` → `profiles.id` (denormalized),
  `job_id`, `service_type`, `amount`, `notes`, `brief_url`, `paid_at`, `completed_at`.
  Status: `contacting → brief_sent → accepted → payment_pending → in_progress → completed → paid`, plus `cancelled`.
- **`booking_briefs`** (8) — one per booking (`UNIQUE(booking_id)`): `title`, `description`,
  `requirements`, `attachments`, `deadline`, `status` (`pending|accepted|rejected`), `reject_reason`, `responded_at`.
- **`deliverables`** (6) · **`payments`** (3) · **`booking_history`** (1, audit trail).
- **`reviews`** (~26) — `booking_id` UNIQUE, `talent_id` → `talent_profiles.id`, `brand_id`,
  `rating` 1–5, `comment`, moderation `status` (`pending|approved|rejected`), `proof_link`,
  `review_type` (`ugc|brand|collaboration`), `moderated_at/by`.
- **`jobs`** (14) + **`job_applications`** (8) — brand-posted job board.
- **`portfolio_items`** (4) — `talent_id` → `talent_profiles.id`, `url`, `media_type`, `caption`, `sort_order`, `is_approved`.
- **`talent_brands`** (2) — brands a talent has worked with (migrated out of `social_links.brands`).

### Communication
- **`conversations`** (20) — `UNIQUE(brand_id, talent_id)`, optional `booking_id`, `last_message_at`.
- **`messages`** (15) — `conversation_id`, `sender_id`, `content`, `message_type`, `is_read`.
- **`notification_types`** — canonical notification type registry (`JOB_CREATED`,
  `BOOKING_REQUEST`, `CHAT_MESSAGE`, `ADMIN_MESSAGE`, etc.) with default priority.
- **`notifications`** — Realtime-enabled user feed. v2 shape: `recipient_id`, `sender_id`,
  `type`, `title`, `message`, `action_url`, `metadata jsonb`, `priority`, `is_read`,
  `read_at`, `expires_at`, `broadcast_id`, `created_at`.
- **`notification_broadcasts`** — admin announcement audit log with audience filter and
  recipient count.
- **`conversation_presence`** — per-thread heartbeat used to suppress chat notifications while
  the receiver is actively reading the conversation.
- **`community_questions`** (12) + **`community_answers`** (8).
- **`contact_messages`** (1) — public contact form, insert-only via service role.

### DB-side logic
`trigger_sync_rating.sql` — `AFTER INSERT/UPDATE/DELETE ON reviews` recomputes
`talent_profiles.avg_rating` and `total_reviews` (`SECURITY DEFINER`).

`20260725_default_free_subscription_and_usage.sql` — introduces a **hidden Free
package** (`packages.id = 00000000-…-000000000000`, `is_active=false`, so it never
shows on the pricing UI) as every account's baseline membership, plus a **`user_usage`**
table (1 row per user per month: `campaign_requests_used`, `portfolio_used`,
`job_posts_used`, `chat_sessions_used`, all default 0; `UNIQUE(user_id, period_start)`).
`provision_default_membership()` runs `AFTER INSERT ON public.profiles` (`SECURITY DEFINER`)
— **not** `auth.users`, because `subscriptions.user_id` FK-references `profiles.id`, which
the app creates after signup — attaching a Free `subscriptions` row (skipped if an active
one exists, via the `one active per user` partial index) and seeding the current-period
`user_usage` row. The migration also back-fills existing users. Note: usage counters are
**not enforced anywhere yet** — the table is provisioned ahead of a future metering feature.
Optional view `package_subscriber_counts` mirrors the TS `fetchPackageSubscriberCounts()`.

Package **active subscriber counts** are computed in
`features/packages/services/package.service.ts` (`fetchPackageSubscriberCounts()`, JS
map over active `subscriptions` → `package_plans.package_id`) and surfaced as
`MarketplacePackage.subscribers_count`, rendered as a "X users on this plan" badge on
`PackageCard`. The hidden Free package is never displayed, so its large membership never
inflates the visible paid cards.

---

## 8. Roles & Permissions

Roles live in `profiles.role` (Postgres enum `user_role`).

### Guest privilege layer
Guests are visitors with no Supabase session and no `auth.uid()`. They can browse public marketplace
content only: `/`, `/home`, `/explore`, `/talents`, `/talent/[handle]`, `/brands`, `/brand/[id]`,
`/jobs`, `/jobs/[id]`, `/campaigns`, `/packages`, and `/pricing`. `/community` (2026-09-23) is
account-gated too, but client-side, not via `middleware.ts`: the URL loads for a guest, and
`CommunityClient` swaps the whole feed for `CommunityAuthGate` (a sign-in prompt, not a redirect)
once `useGuestGuard()` resolves `isGuest`.
Public server pages that use `adminClient` must reapply public filters in code because
RLS is bypassed: approved/active talents only, approved/active brands only, open jobs only, and
active packages only.

Protected action checks are centralized in `lib/permissions.ts`. Frontend controls use
`contexts/GuestGuard.tsx` and `components/auth/ProtectedAction.tsx` to show the auth modal instead
of redirecting guests on clicks. Direct URL access is handled in `middleware.ts` for `/dashboard`,
`/profile`, `/messages`, `/chat`, `/bookings`, `/notifications`, `/settings`, `/payments`,
`/jobs/create`, and `/jobs/[id]/applications`.

| Role | Notes |
|---|---|
| `talent` | Default for new signups. Owns a `talent_profiles` row. |
| `brand` | Renamed from `client` by `003_rename_client_to_brand.sql`. `'client'` remains in the enum but should be unused. |
| `admin` | Back-office only; assigned manually / via `/api/admin/create-admin`. |

**Capability matrix (as enforced in code today):**

| Action | talent | brand | admin |
|---|:--:|:--:|:--:|
| Browse explore / talent profiles | ✅ | ✅ | ✅ (public) |
| Edit own talent profile, packages, portfolio | ✅ | — | ✅ (via admin editor) |
| Post a job (`POST /api/jobs`) | — | ✅ | — |
| Apply to a job | ✅ | — | — |
| Send a direct brief (`POST /api/bookings/direct`) | — | ✅ | — |
| Accept/reject a brief | ✅ | — | — |
| Confirm payment (`POST /api/bookings/[id]/payment`) | — | ✅ | — |
| Submit deliverables | ✅ | — | — |
| Leave a review | — | ✅ | — |
| Approve/reject talents, brands, verifications, reviews; block accounts | — | — | ✅ |

There are **three overlapping status concepts** — do not confuse them:
1. `profiles.account_status` — platform-level ban (`active` / `blocked` / `suspended` / `rejected`), enforced by middleware.
2. `profiles.brand_status` — brand onboarding approval.
3. `talent_profiles.status` — talent listing approval (`pending`/`approved`/`rejected`/`suspended`).
Plus the legacy `profiles.is_approved` / `is_suspended` booleans still read by `features/admin/services/admin.service.ts` and `app/(main)/explore/page.tsx`. See §12.

---

## 9. RLS Policies

RLS is **enabled** on: `bookings`, `reviews`, `booking_history`, `talent_verifications`,
`talent_brands`, `notifications`, `community_questions`, `community_answers`, `profiles`.

Representative policies:
- `profiles` — user may SELECT/UPDATE/INSERT only `auth.uid() = id`.
- `bookings` — SELECT if `brand_id = auth.uid()` **or** `talent_id ∈ (SELECT id FROM talent_profiles WHERE user_id = auth.uid())`; INSERT only with `brand_id = auth.uid()`.
- `reviews` — public SELECT restricted to `status = 'approved'`; INSERT only by the booking's brand.
- `notifications` — SELECT own unexpired rows; UPDATE/DELETE own rows only. Authenticated users
  have no general INSERT policy; writes go through service-role app code, with an admin-only
  insert policy as defence in depth.
- `notification_broadcasts` — SELECT admin only; writes go through service-role app code.
- `community_*` — public read; insert/update/delete only by the author.
- `talent_brands` / `talent_verifications` — public or self read; writes scoped to the owning talent.
- `contact_messages` — no RLS; insert-only through the service role.

**Reality check:** because the app reads and writes almost everything through `adminClient`, these
policies are mostly a **defence-in-depth backstop for direct/anon access**, not the primary
authorization mechanism. The primary mechanism is the hand-written checks in `app/api/**`.
Treat any new route without an explicit ownership check as a security bug.

---

## 10. Main Features & Workflows

### 10.1 Booking pipeline (the core flow)
```
Brand opens /talent/[handle]
  → DirectBriefModal  →  POST /api/bookings/direct
       • creates (or reuses) a booking with status "brief_sent"
       • upserts booking_briefs
       • upserts a conversation (UNIQUE brand_id+talent_id)
       • posts a bilingual system message into the chat
  → Talent: PATCH /api/bookings/[id]/brief/respond  { action: accept|reject }
       • accept → booking "accepted"   • reject → back to "contacting"
       • system chat message + notification to the brand
  → Brand: POST /api/bookings/[id]/payment   (manual confirmation — NO payment gateway)
       • inserts a payments row (status "paid"), booking → "in_progress", sets paid_at
  → Talent: POST /api/bookings/[id]/deliverables
  → Brand:  approve → booking "completed"
  → Brand:  POST /api/bookings/[id]/review → DB trigger recomputes talent rating
```
**There is no escrow and no payment provider.** Payment is a status transition recorded in the
`payments` table. Any doc claiming Stripe escrow is aspirational.

### 10.2 Job board
Brand `POST /api/jobs` (role-checked) → talents browse `/jobs` → `POST /api/jobs/[id]/apply` →
brand reviews at `/jobs/[id]/applications` → accepting an application creates a booking.

### 10.3 Chat
`conversations` + `messages`, one thread per (brand, talent) pair. Rendered at `/chat` and via the
site-wide `GlobalChat` / `FloatingChatWidget` mounted in the `(main)` layout. Pipeline events inject
bilingual system messages into the thread.

### 10.4 Notifications
`lib/notifications/events.ts` is the event API used by feature routes. It writes through
`lib/notifications/service.ts` using the service role; `lib/notifications/create.ts` is only a v1
compatibility shim. Canonical types are uppercase (`JOB_CREATED`, `JOB_APPLICATION_RECEIVED`,
`APPLICATION_ACCEPTED`, `BOOKING_REQUEST`, `CHAT_MESSAGE`, `PAYMENT_SUCCESS`, `ADMIN_MESSAGE`,
etc.) and bilingual copy is stored in `metadata.i18n`.

The table is in the `supabase_realtime` publication with `REPLICA IDENTITY FULL`. The browser uses
`hooks/notifications/store.ts` as a module singleton so the bell, dropdown and `/notifications`
page share one initial fetch and one Realtime channel. Chat notifications collapse by
conversation, and `conversation_presence` suppresses chat-message notifications while the receiver
is inside that thread. Admin announcements are sent from `/admin/notifications` via
`/api/admin/notifications` and logged in `notification_broadcasts`.

Failures are logged and swallowed — a notification must never break the calling flow.

### 10.5 Profile completion
`lib/profile-completion.ts` scores a talent profile out of 100 across 11 weighted sections
(avatar 15, portfolio 15, personal 10, categories 10, social 10, physical 10, packages 10,
usage rights 10, bio 5, availability 5, payment 0 — "coming soon", weighted 0 so 100% stays reachable).
Declared gates (`COMPLETION_THRESHOLDS`): apply to jobs 50, appear in search 60, receive briefs 70,
become verified 80. **These thresholds are defined but not yet enforced anywhere** — wiring them up
is a known open item.

### 10.6 Admin back-office
`/admin` dashboard + talents, brands, bookings, reviews, verifications, settings.
All reads go through `features/admin/services/admin.service.ts` (service role), mutations through
`app/api/admin/**`. The admin area also hosts ad-hoc migration/seed/debug endpoints (see §12).

---

## 11. Coding Conventions

1. **`export const runtime = 'edge';` is the first line of every route/page/layout.** Cloudflare
   Pages requires it. Adding a file without it breaks the deploy.
2. **Server page → client component.** `page.tsx` is an async Server Component that fetches and
   passes plain props to a colocated `_components/*Client.tsx` marked `"use client"`.
3. **Data layer for non-trivial features:** `features/<name>/services` (raw DB reads) →
   `features/<name>/transformers` (DB row → view model) → `features/<name>/types`
   (`Raw*` DB shapes vs. domain types). Follow this for anything new and non-trivial.
4. **Styling is inline objects**, not Tailwind classes (only ~9 of ~150 `.tsx` files use `className`).
   Each component declares local colour constants derived from `useSite()`:
   ```ts
   const { dark, lang } = useSite();
   const ar     = lang === "ar";
   const CARD   = dark ? "#0D1623" : "#FFFFFF";
   const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
   const MUTED  = dark ? "#A8B3C2" : "#64748B";
   const GREEN  = "#00D26A";
   ```
   `app/globals.css` holds tokens and shared utility classes (`.glass-panel`, `.btn-primary`,
   `.card-hover`, `.sr-*` scroll-reveal, light-mode overrides).
5. **Bilingual strings live in the component** as `const TX = { ar: {...}, en: {...} }`, selected via
   `const tx = TX[lang]`. Never hardcode a user-facing string in one language only.
6. **Responsive** via `useIsMobile()` and conditional inline styles — not CSS media queries.
7. **Naming:** DB columns `snake_case`; TS domain types `camelCase`; transformers do the mapping.
   Components `PascalCase.tsx`; route folders `kebab-case`.
8. **Alignment-style formatting** (aligned `:` in object literals, boxed `// ─── Section ───` comment
   dividers) is used throughout. Match the surrounding file.
9. **API responses:** `NextResponse.json({ data }, { status })`; errors as
   `{ error: "lowercase message" }` with 400/401/403/404/500. Common strings: `"unauthorized"`,
   `"forbidden"`, `"not found"`.
10. **Batch related queries** with `Promise.all`, then build `Object.fromEntries(...)` lookup maps to
    join in JS — Supabase joins across these tables are avoided deliberately (see §12 talent_id ambiguity).
11. **No test suite exists.** Verification today is `npx tsc --noEmit` + `npm run build` + manual QA.

---

## 12. Important Implementation Decisions & Known Debt

### Decisions (intentional)
- **Edge runtime everywhere** to run on Cloudflare Pages; this rules out Node-only APIs and is why
  `adminClient` strips `fetch`'s `cache` option.
- **Service-role-first data access** for speed of development; authorization is in route handlers.
- **JSONB for packages / social_links** rather than the normalized `talent_packages` /
  `package_addons` tables in `SYSTEM_DESIGN.md` — fewer joins, but no DB-level validation.
- **Hand-rolled i18n and theming** instead of `next-intl`, to keep everything in one bilingual
  component file and avoid a message-catalog build step.
- **Theme/lang flash prevention:** a blocking `<script>` in `app/layout.tsx` sets
  `data-theme` / `lang` / `dir` on `<html>` from `localStorage` before hydration. Default is
  **English + light mode** when nothing is stored (changed 2026-08-24 from Arabic + time-based
  light/dark). Once a visitor changes either from settings (`toggleLang`/`toggleMode` in
  `contexts/SiteContext.tsx`), the choice is written to both `localStorage` and a cookie and wins
  over this default for that visitor from then on — the default only governs a fresh, never-chosen
  session.
- **Manual payment confirmation** — deliberate for the current stage; no gateway integration.
- **CSP header** is set in `next.config.ts`; `connect-src` allows `https://*.supabase.co` and
  `wss://*.supabase.co`. Adding a new third-party endpoint requires editing it.

### Known debt (do not replicate; fix when you touch the area)
1. **Duplicate talent profile routes** — `/talent/[handle]` (canonical, linked everywhere) and
   `/profile/[username]` (imports the same `TalentModelProfile`, passes fewer props, and ships an
   orphaned `_components/` tree that nothing imports). Consolidate onto `/talent/[handle]`.
2. **Three status systems** (§8) plus legacy `is_approved`/`is_suspended`. The admin talents list
   hardcodes `status: "approved"` for every row and reports `rejected: 0, suspended: 0`, so the
   dashboard counters are not truthful.
3. **`bookings.talent_id` ambiguity** — it references `talent_profiles.id`, but some seeded
   `reviews.talent_id` rows point at `profiles.id`. `admin.service.ts` contains explicit fallback
   logic for this. New code should always treat `talent_id` as `talent_profiles.id`.
4. **`app/(auth)/onboarding/page.tsx` is 792 lines of fully commented-out code** — the multi-step
   onboarding wizard is not live. Profile building happens on `/profile/me` +
   `ProfileCompletionCard` instead.
5. **Resolved 2026-08-29:** the ad-hoc `run-migration`/`seed-*`/`debug-*`/`check-*`/`verify-db`/
   `chat-migration` admin endpoints this section used to warn about are gone — removed in an
   earlier pass (commit `0aeed6b`), plus `/api/admin/jobs-migration` (a one-time "jobs table
   doesn't exist yet" bootstrap helper, dropped once the table existed live). Every remaining
   route under `app/api/admin/` calls `requireAdmin()`/`getAdminUser()` (`lib/auth/require-admin.ts`)
   or an equivalent inline check — verified by grepping every `app/api/admin/**/route.ts` for one.
   New admin routes: use the shared `requireAdmin()` helper rather than hand-rolling the check again.
6. **`app/api/v1/*` is a stub** (`/api/v1/upload` returns `{ message: "Upload API v1" }`). The real
   endpoints are the unversioned ones.
7. **`zod` is installed but unused** — validation is ad-hoc. Adopting it for API bodies is the
   highest-value hardening step.
8. **`tsconfig.strict = false`**, and `any` appears in several data paths.
9. **Navbar links to `/book`**, which has no route.
10. **Stray directories:** `New folder/` (empty) and `talent-website/` (gitignored leftover repo).

---

## 13. Development & Deployment

```bash
npm run dev          # next dev
npm run build        # next build
npx tsc --noEmit     # type check (the de-facto test suite)
npm run pages:build  # @cloudflare/next-on-pages
npm run deploy       # pages:build + wrangler pages deploy
```

CI: `.github/workflows/deploy.yml` — on push to `main`, Node 22, `npm ci`,
`npx @cloudflare/next-on-pages@1`, then `wrangler pages deploy .vercel/output/static
--project-name=talents-platform`. All env vars come from GitHub Secrets.
`wrangler.toml` sets `compatibility_flags = ["nodejs_compat"]`.

Git: work happens directly on `main` (the `develop` + feature-branch model in `ROADMAP.md` is not in use).
Commit style: `feat: …`, `fix: …`, `chore: …`, or short descriptive messages.

---

## 14. Future Roadmap (technical)

**Near term / hardening**
- Zod schemas for every API request body.
- Consolidate the duplicate profile routes; delete the orphaned `_components` tree.
- Unify the status systems onto `account_status` + `talent_profiles.status`; drop `is_approved`/`is_suspended`.
- Remove or env-gate the ad-hoc `/api/admin/*` seed/debug/migration endpoints.
- Enforce `COMPLETION_THRESHOLDS` (search visibility, brief eligibility, job applications).
- Adopt real Supabase CLI migrations; snapshot the live schema into version control.

**Feature**
- Payment gateway integration (Paymob/Stripe) replacing manual confirmation; escrow semantics.
- Availability calendar; saved talents/wishlist; advanced search & sort on `/explore`.
- Email notifications (no provider is wired up today).
- Normalize `packages` and `usage_addons` out of JSONB once the shape stabilises.
- Platform-level subscription packages for talents/brands — **not built at all today**; see
  PRODUCT.md §Packages System for the intended model.

---

## 15. Rules for Contributors (human or AI)

1. Read this file and `PRODUCT.md` before implementing. **Ignore `SYSTEM_DESIGN.md` / `ROADMAP.md`** as
   descriptions of the present system.
2. **Update this file** whenever you change architecture, add a table/column, add a role/permission,
   change the auth flow, or introduce a dependency. **Update `PRODUCT.md`** for product, design-system,
   or packages changes.
3. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client, and never import `lib/supabase/admin.ts`
   from a `"use client"` file.
4. Every new API route: `runtime = 'edge'` → `getUser()` → explicit role/ownership check → then query.
5. Every new user-facing string: add both `ar` and `en`, and verify the RTL layout.
6. Every new component: honour `dark`/`light` via `useSite()` and `useIsMobile()` for responsiveness.
7. Don't add a heavyweight dependency (state manager, UI kit, form library) without an explicit
   decision recorded here — the current codebase deliberately has none.
8. Migrations are pasted into the Supabase SQL editor by a human. Write them idempotently and
   commit the `.sql` file even though it isn't auto-applied.
9. Verify with `npx tsc --noEmit` and `npm run build` before declaring work done. There are no tests.

---

## Landing Visual Foundation Update - 2026-07-23

- Refactored `app/globals.css` into semantic theme tokens for brand, status, surfaces, text, borders, shadows, radius, spacing, motion, and typography.
- Kept backward-compatible aliases such as `--color-teal`, `--color-gold`, `--bg-base`, and `--bg-card` so older pages can migrate incrementally.
- Replaced the old `/home` composition with `app/(main)/home/_components/landing/LandingPage.tsx`.
- Centralized editable landing content, localized copy, image URLs, categories, testimonials, FAQ, and pricing preview in `app/(main)/home/_components/landing/content.ts`.
- Moved landing-specific presentation into `LandingPage.module.css` to avoid duplicated inline style objects.
- The redesign is visual and conversion-focused only; it does not change Supabase, auth, admin, booking, API, or payment behavior.

---

## Dynamic Public Profiles — 2026-08-06

The public profile pages now render through the layout-driven renderer. §4 and §10
describe the pipeline; this section records what changed and what a contributor
must know before touching it.

### The rendering path

```
/talent/[handle]  ──┐
/brand/[id]       ──┴─► profileService.getPublicProfileByHandle | ById
                          │  provider public gate + hasContent filter
                          ▼
                        PublicProfileDTO  (empty sections already dropped)
                          │
                          ▼
                        *ProfileShell  (chrome only)
                          └─► DynamicProfileRenderer
                                └─► DynamicProfileSections   (layout slots)
                                      ├─ core    → adapters → existing components
                                      └─ dynamic → registry renderers
```

Both pages keep their `cachedPublic` wrapper and existing tags. Removing them
would make every view a fresh provider fan-out and would stop the existing
`revalidateTag` calls invalidating anything.

### Section visibility

**A section that has no content is never serialized.** `ProfileService.buildPublic`
drops it via `provider.hasContent()`; the renderer re-checks as defence in depth.
The rules live in one pure module, `features/profiles/content/section-content.ts`,
which is deliberately NOT `server-only` so both sides reach the identical answer.

Do not add a visibility check inside a component. A component can only hide its
body, leaving the heading and card chrome behind, and the sidebar cannot collapse
to one column once its aside has already rendered.

An unknown core key **fails open** (renders). A core section exists because a
typed column backs it, so failing closed would silently delete part of a live
profile after a config change.

### Chrome vs sections

Chrome is anything that must survive a profile with no content: the hero, the
booking CTA, the tab bar. It lives in the shell, never in a layout slot.
`avatar` / `personal` / `bio` (talent) and `logo` (brand) are declared INLINE in
`components/profile/dynamic/adapters/core-keys.ts` for this reason — their data
renders inside the hero.

`bio` is still listed in the talent layout: the renderer emits a bare
`<div id="section-about" />` for an inline key, and that is the anchor the
"Overview" tab scrolls to. Removing it from the layout breaks the tab bar
silently.

`StickyBookingBar` mounts through the renderer's `mainFooter` so it reads the
selected package from `DynamicProfileContext`. It is fixed-position, so its DOM
location does not affect where it draws — but a second copy of the selection
would drift from the one `UsageRightsSection` prices against.

### Completion

`GET /api/profile/completion` returns a `CompletionDTO` computed by the
signed-in user's own provider. Own-profile only — completion exposes which parts
of a profile are unfinished.

- `provider.getCompletion()` returns `CoreSectionState`: a bare boolean, or
  `{ done, progress }` for a section with a real middle state.
- `done` is the **only** input to the score. `progress` is display-only and
  independent — most talent sections count as done at their first entry, so
  "complete, 2 of 4 socials" is the state most profiles are in.
- `provider.getCompletionGates()` is per-provider because the gates are not the
  same features: a brand never applies to a job. Gates report `enforced: false`,
  which is truthful — `COMPLETION_THRESHOLDS` is still not checked in any route.
- `lib/profile-completion.ts` keeps `calculateCompletion` byte-for-byte so
  talent scores cannot regress; `calculateSectionProgress` is additive.

Do not import `calculateCompletion` into a component. It hardcodes the talent
weights, which is what made brands unscorable.

### Brand core components

`components/profile/brand/` holds the five brand section components plus
`BrandHero`. They share chrome through `BrandCard` / `useBrandPalette`. The brand
adapter previously claimed zero keys, so every brand section fell through to
`CoreSectionPlaceholder`.

### The two brand approval flags

`profiles.brand_status` (what the admin UI writes) and `brand_profiles.status`
(what the provider gate reads) still both exist — CLAUDE.md §8's known debt.
Migration `20260809` reconciles them, including mapping a **NULL** `brand_status`
to `approved`: the shipped page hid a brand only when `brand_status` was
explicitly non-approved, so never-moderated brands have always been public.
Tightening that is a product decision, not a refactor's to make.

### Migrations that must be applied

`20260808_seed_talent_core_sections.sql` and
`20260809_campaign_profile_readiness.sql` are **required** for these pages. With
no section rows the layout has nothing to order and a profile renders empty.
Both are idempotent and print a `RAISE NOTICE` verification summary.

### Tests

`vitest` now runs (`vitest.config.ts`, 75 tests over the adapters and the runtime
prep). §11.11 and §15.9's "no test suite exists" is no longer strictly true for
this area — run `npx vitest run` alongside `npx tsc --noEmit` and `npm run build`.

---

## User Action Tracking — 2026-08-23

New table **`user_events`** (`supabase/migrations/20260823_user_events.sql`) —
a generic, append-only event log: `user_id` (nullable — guests), `session_id`
(client-generated UUID, `localStorage`), `event_name` (`page_view` |
`talent_profile_view` | `search` | `booking_brief_sent` | `job_application` |
`signup` | `login`, DB-`CHECK`ed), `target_type` (`talent_profile`|`job`|
`booking`|`NULL`, DB-`CHECK`ed) / `target_id`, `metadata jsonb`. RLS enabled,
no policies — service-role only, same pattern as `notifications` /
`talent_type_requests`. Also adds `profiles.last_active_at`.

**`app/api/events/route.ts` is a hardened, strictly-validated edge endpoint**
— the only one of these tables' write paths a browser can reach directly.
`session_id` and `target_id` must be well-formed UUIDs; `event_name` and
`target_type` are fixed allow-lists; `target_type`/`target_id` presence is
required-or-forbidden per event (only `talent_profile_view` carries one; any
other event sending one is rejected). Metadata has a **per-event schema**
(e.g. `page_view` only accepts `path`/`referrer`, `search` only `query`/
`result_count`) — an unknown key rejects the whole request rather than being
silently dropped, plus a 500-byte total cap. A client-supplied `user_id` in
the body is never read anywhere; identity comes only from
`supabase.auth.getUser()`. A DB failure returns a real error status, not a
false `{success:true}` — the browser tracker (`lib/analytics/track.ts`)
still fire-and-forgets the response either way, so this never blocks
navigation.

**Split mirrors `lib/notifications/`:** `lib/events/service.ts` is the thin
`adminClient` writer (`logEvent`, returns `boolean`, swallows/logs errors —
an analytics write must never break the flow that triggered it, but the
caller still gets an honest success/failure signal); `lib/events/events.ts`
holds named wrappers only for the two events with real server-side
enrichment (`logBookingBriefSent`, `logJobApplication`, called from
`/api/bookings/direct` and `/api/jobs/[id]/apply`). The other four
non-profile-view client events go straight from `app/api/events/route.ts`
into `logEvent`.

**`talent_profile_view` does NOT go through `logEvent`** — it has its own
`logTalentProfileView()`, calling the `track_talent_profile_view()` SQL
function (dedupe, below). Fixes a dead counter: `talent_profiles.
profile_views` existed as a column but was never incremented anywhere before
this (only hand-seeded with fake numbers in `app/api/admin/seed/route.ts`).

**Profile-view dedupe (30-minute window, DB-atomic).** A refresh-spam loop
must not inflate either the public `profile_views` counter or the admin
analytics table. `talent_profile_view_dedupe` holds one row per
`(session_id, talent_user_id)`; `track_talent_profile_view()` does a single
`INSERT ... ON CONFLICT ... DO UPDATE ... WHERE last_counted_at < now() -
interval '30 minutes' RETURNING ...` — atomic, no read-then-write race — and
only when that returns a row does it, in the same function, increment
`talent_profiles.profile_views` **and** insert the `user_events` row. A
deduped (too-recent) view increments nothing and logs nothing.

**`last_active_at` throttle (5-minute window, DB-atomic).** `touch_last_active
(p_user_id)` is a single guarded `UPDATE ... WHERE last_active_at IS NULL OR
last_active_at < now() - interval '5 minutes'` — one statement, no race.
`logEvent`/`logTalentProfileView` call it whenever a request has a `userId`,
so a signed-in user's flurry of events costs at most one `profiles` write
per 5 minutes, not one per event.

**Every `SECURITY DEFINER` function explicitly locks itself down** —
`track_talent_profile_view()` and `touch_last_active()` both set
`SET search_path = public` (defends against search_path hijacking) and
`REVOKE ALL ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ... TO
service_role`. Without this, Postgres's default "grant EXECUTE to PUBLIC on
create" plus Supabase auto-exposing every function as a PostgREST RPC
endpoint would let anyone holding the public anon key call these directly
(`POST /rest/v1/rpc/track_talent_profile_view`), bypassing `/api/events`'
validation and dedupe entirely. The browser must never be able to reach
either function except through the edge route.

**Client side:** `lib/analytics/track.ts` (`trackEvent`, fire-and-forget,
owns the `localStorage` session id — a real UUID, since `session_id` is now
validated as one) is called from `components/analytics/PageViewTracker.tsx`
(mounted once in `app/(main)/layout.tsx`, wrapped in `<Suspense>` —
`useSearchParams()` requires it; its effect body is `lib/analytics/
page-view.ts`'s `firePageView()`, pulled out into a plain function so it's
unit-testable without a DOM/React renderer — this repo deliberately has no
jsdom/RTL, see `vitest.config.ts`) and `components/analytics/
ProfileViewTracker.tsx` (mounted by all three profile shells —
`TalentProfileShell`, `ModelProfileShell`, `UgcProfileShell` — keyed by
`PublicProfileDTO.identity.id`, i.e. `profiles.id`, the only id a profile
page ever exposes to the browser; relies entirely on the DB-side dedupe
above, adds none of its own).

**Meta/Facebook Ads Pixel** — `components/analytics/MetaPixel.tsx` (mounted
in root `app/layout.tsx`) and `lib/analytics/meta-pixel.ts`
(`trackMetaEvent`) are both no-ops when `NEXT_PUBLIC_META_PIXEL_ID` is unset
(the default — no Pixel ID exists yet). `next.config.ts`'s CSP now allows
`connect.facebook.net` (`script-src`) and `facebook.com`/`graph.facebook.com`
(`connect-src`) for it. **`MetaPixel` only loads `fbq` and calls `fbq('init',
...)`** (via the pure, unit-tested `buildMetaPixelSnippet()`) — it must
never also call `fbq('track', 'PageView')` itself. `PageViewTracker` (via
`firePageView()`) is the single source of every `PageView` event: once on
initial mount, once per SPA route change. The two used to both fire it,
double-counting every session's first page view — fixed 2026-08-23.
Event mapping: `page_view`→`PageView`, `talent_profile_view`→`ViewContent`,
`search`→`Search`, `signup`→`CompleteRegistration`, `login`→internal only
(no Meta equivalent — logging back in isn't a conversion). `booking_
brief_sent`/`job_application` are **deliberately internal-only for now** —
both fire from server routes with no browser `fbq` to call; wiring their
Meta conversions properly needs the server-to-server Conversions API, not a
client-side call bolted onto a server route (see the comment in
`lib/events/events.ts`).

**New admin page** `/admin/user-activity` (sidebar entry added to
`AdminSidebar.tsx`) — copies the `talent-demand` structure exactly
(`page.tsx` → `*Shell.tsx` → `*Section.tsx` → `*View.tsx` + skeleton),
backed by `fetchAdminUserActivityStats` / `fetchAdminUserActivityPage` in
`features/admin/services/admin.service.ts`.

**Tests** — `app/api/events/route.test.ts` (19), `lib/events/service.test.ts`
(7), `lib/analytics/meta-pixel.test.ts` (7), `lib/analytics/page-view.test.ts`
(2): allow-list/UUID/target/metadata-schema validation, client `user_id`
never trusted, DB failure not reported as success, `touch_last_active` only
called when a `userId` is present, `track_talent_profile_view`'s RPC call
shape, Meta helper no-op paths, and the loader-vs-tracker PageView split.
These prove the **app-layer orchestration** is correct; the 30-minute/
5-minute window boundaries themselves live in SQL and have no DB-integration
test harness in this repo (vitest runs with no live Postgres) — that
remains a real gap if this logic changes without also being verified against
a live Supabase project.

**Known gaps, not built:** no consent/cookie-banner UI (the Cookie Policy
page already claims "opt out via browser settings" but there's no in-app
toggle anywhere in the repo — pre-existing, not introduced here); no rate
limiting on `/api/events` beyond the profile-view dedupe (a request flood of
`page_view`/`search` events isn't throttled, matching `talent-type-requests`'
existing posture); `last_active_at` starts `NULL` and only populates going
forward, no backfill.

Per §6, this migration is **not auto-applied** — it must be pasted into the
Supabase SQL editor by a human before any of this writes real rows (until
then, `logEvent`/`logTalentProfileView` swallow the resulting "table/function
not found" error and `/admin/user-activity` shows an honest empty state,
exactly as designed — confirmed live against the dev database before this
hardening pass).

---

## Admin Health Checkup — 2026-09-08

New admin page **`/admin/health-check`** (sidebar: Analytics group) — an
on-demand "Run Checkup" button, not a background job or cron. Clicking it
fires four independent live checks in parallel (`features/health-check/
service.ts`) and rolls them into one 0-100 score for a hand-rolled SVG
half-circle gauge (`_components/HealthGauge.tsx` — no charting library,
CLAUDE.md §11 rule 7):

1. **Cloudinary usage** — one call to Cloudinary's own `/usage` endpoint
   (storage, bandwidth, resource count, plan credit %). Needs
   `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (server-only — distinct from
   the `NEXT_PUBLIC_CLOUDINARY_*` unsigned-upload vars, which grant no read
   access). Unconfigured = shown as "not configured", excluded from the
   score rather than penalized (`scoreCloudinary()` returns `null`).
2. **Security checklist** — 5 LIVE self-probes against the site's own origin
   (derived from the incoming request, not a hardcoded URL): CSP header
   present, `frame-ancestors` present, `/admin` redirects an unauthenticated
   visitor, `/api/admin/categories` rejects an unauthenticated request
   (401/403), HTTPS. **This is a config self-audit, not a penetration test**
   — the UI says so explicitly (`HealthCheckView.tsx`'s disclaimer line) so
   it's never mistaken for real security testing.
3. **Performance probe** — times 3 live requests (`/home`, `/explore`,
   `/api/me`) right now. There is no historical per-request timing log
   anywhere in this app (that would mean instrumenting `middleware.ts` to
   write every request's duration somewhere — a real, separate feature, not
   built here) — so "slowest request" here means slowest THIS run, and
   `health_check_runs`'s history is the closest thing to a trend over time
   (each run's score, not sub-metrics).
4. **Traffic snapshot** — reuses `fetchAdminUserActivityStats()` from
   `/admin/user-activity`'s own service, trailing 7 days.

**AI Recommendations** (`fetchAiRecommendations()`) sends the four reports'
summary to Anthropic's Messages API (`claude-haiku-4-5-20251001` — cheap/fast
is the right tool for a utility call an admin can re-trigger on a whim, not
Sonnet) and asks for ≤5 prioritized action items. Needs `ANTHROPIC_API_KEY`;
unset = shown as "not enabled", same posture as every other optional
integration on this page.

**Scoring is pure and unit-tested** (`features/health-check/score.ts` +
`score.test.ts`) — security/performance/cloudinary each score 0-100 (or
`null` if not applicable), then `computeOverallScore()` does a weighted
average (security 40%, performance 35%, cloudinary 25%) that **excludes**
any `null` category instead of treating it as a 0, so an admin who hasn't
set up Cloudinary isn't punished for it.

**New table** `health_check_runs` (`supabase/migrations/
20260908_health_check_runs.sql`, not auto-applied per §6) — one row per run
(`score int`, `results jsonb`, `created_by`), no RLS policies (service-role
only, same pattern as `leads`/`user_events`). `/admin/health-check` reads the
latest row + last 10 for the history strip; `POST /api/admin/health-check/
run` is the only writer.

**RBAC:** new resource key `"healthCheck"` in `lib/auth/admin-resources.ts` +
`RolesView.tsx`'s `RESOURCE_LABELS`, same lockstep-with-`AdminSidebar.tsx`
pattern as every other tab. The run route itself is gated on the `"create"`
action (it writes a row), not `"read"`.

---

## Manual Payment Proof Flow — 2026-09-09

**Correction to §7/§12/§14:** the `payments` table is **not** the plain
`{amount, status, paid_at}` shape those sections describe, and this is **not
aspirational** — it is the live production schema. At some point `payments`
was migrated to a real escrow shape (`platform_fee` and `talent_payout` are
DB-computed automatically from `amount`, plus `client_id`, `talent_id`,
`currency`, `payment_method`, `external_ref`, `held_at`, `released_at`,
`refunded_at`, `admin_note`) with a `status` CHECK constraint allowing only
`pending | held | released | refunded | disputed` — **not** `paid` — and a
separate `payment_method` CHECK constraint allowing only
`offline | wallet | card | stripe | paymob` — **not** `instapay` or
`bank_transfer`, despite that being the actual real-world method every brand
uses today. `offline` (also the column's own DB default) is the right fit
for "paid outside the platform, verified manually". No migration file for
either constraint exists in this repo (§6: the database is the source of
truth, not this folder).

**This was a live, universal, silent bug**, found and fixed 2026-09-09:
`POST /api/bookings/[id]/payment` (the brand's "Confirm Payment & Start
Work" button) inserted `{status: "paid", paid_at: now}` — `paid_at` doesn't
exist on this table and `"paid"` isn't a legal status, so the insert always
threw `PGRST204`/`23514` and the route always 500'd. **Every booking on the
platform had been permanently stuck at `accepted`** — the `payments` table
had zero rows in production before this fix, for any booking, ever. Found by
walking the real booking cycle end-to-end with two fresh test accounts (a
brand and a UGC talent) rather than reading the code alone.

**The fix is also a real business-flow decision, not just a schema-name
correction.** The brand does not pay the talent directly — **the brand pays
the platform** (bank transfer / InstaPay to the platform's own account), the
platform holds it in escrow, and **the platform pays the talent out** after
the delivered work is approved. This is why confirmation of the incoming
payment is an **admin** action, not a talent action: the talent has no way
to verify money that was never sent to them. (Still pre-payment-gateway;
§14's "Payment gateway integration" remains the real fix.)

1. **Brand uploads proof** — `POST /api/bookings/[id]/payment` now takes
   multipart `file` (a bank-transfer/InstaPay screenshot), proxies it to
   Cloudinary exactly like `app/api/profile/avatar/route.ts` (folder
   `<CLOUDINARY_FOLDER>/payment-proofs`), and inserts/updates the `payments`
   row: `status: "pending"`, `payment_method: "offline"`, the new
   `proof_url` column (`supabase/migrations/20260909_payment_proof.sql`, not
   auto-applied per §6), `client_id: booking.brand_id` and
   `talent_id: booking.talent_id` (the `talent_profiles.id` one, **not**
   `booking.talent_user_id` — `payments.talent_id` carries its own foreign
   key to `talent_profiles`, discovered by trial insert, same ambiguity as
   §12 item 3).
   `bookings.status` stays `"accepted"` — the booking does not move yet. A
   chat message tells both sides the proof was submitted, but neither gets a
   personal notification — there's nothing for either of them to act on;
   only an admin can confirm it.
2. **Admin reviews and confirms** — new route `POST /api/admin/bookings/
   [id]/payment/confirm` (`requirePermission("bookings", "update")` +
   `getAdminUser()`, same guard pair as the existing generic
   `/api/admin/bookings/[id]` status-mover route it sits next to). Only when
   a `payments` row is `status: "pending"`. Flips it to `status: "held",
   held_at: now` (escrow: money confirmed received but not yet paid out to
   the talent) and moves `bookings.status` to `"in_progress"`, then notifies
   *both* the brand (payment cleared) and the talent (work can start).
   Surfaced in `/admin/bookings`'s `BookingsTable.tsx`: a booking with a
   pending payment shows a 💳 "Review Payment Proof" action instead of the
   generic next-stage stepper (stepping straight to `in_progress` there
   would leave the `payments` row stuck at `"pending"` forever) — opens a
   modal with the screenshot and a confirm button.
3. **Release on final approval** — `PATCH /api/bookings/[id]/deliverables`'s
   existing `approve` branch (brand approves the delivered work,
   `bookings.status → "paid"`) now also flips the matching `held` payments
   row to `status: "released", released_at: now` — this is the step that
   actually represents the platform paying the talent out. This closes a
   second, separate gap found at the same time: the escrow "release" half of
   the lifecycle had never been implemented at all, so even a correctly-
   inserted `held` row would have sat there forever. The existing
   `increment_balance` RPC call right above it (credits the talent's
   `profiles.balance` — the running total of what the platform owes them)
   had its own silent-failure bug fixed alongside this: it discarded its
   error with `.then(() => null, () => null)`; now logged via
   `console.error` on failure, matching the swallow-but-log posture in
   §10.4 — it must never block the approval itself, but a failure must
   leave a trace. `profiles.balance` going up is still just a ledger number;
   how the platform actually gets that money into the talent's hands (bank
   transfer out, on what cadence, who triggers it) is not built and not
   this change's problem to solve.

**UI** — `app/(main)/bookings/[id]/_components/BookingDetail.tsx`'s
`"accepted"`-state action panel now branches three ways instead of one
button: brand-with-no-payment-row (file picker, copy explicit that the
transfer goes to the platform), brand-with-pending-row (waiting on the
platform team, link to view what was uploaded), and
anyone-else-with-no-or-pending-row (a plain waiting message — the talent
never sees the proof image or gets an action button here; only admin does,
in `/admin/bookings`).

**Still not built:** a reject/dispute path for a bad screenshot (an admin
can currently only confirm, not push back on a pending proof) and any
automated payment gateway. Both are open follow-ups, not silently dropped.

**Two more pre-existing gaps found walking the full pipeline end-to-end**
(brief → accept → pay → work → deliver → approve → review) with two fresh
test accounts, both real and both still open:

1. **The `payments`-table trigger that fires on any `status` change
   (found causing the "paid" bug above) also blocks `status: "held"` and
   `status: "released"`** with the identical `column "user_id" of relation
   "notifications" does not exist` error — same root cause, two call sites.
   Confirmed by direct write: updating any other column on `payments`
   succeeds; touching `status` specifically always throws. Its definition
   hasn't been shared yet (`pg_get_functiondef` on the trigger's function,
   asked for but not yet returned) — until then, a payment can be uploaded
   and reviewed but never actually reaches `held` or `released`.
2. **`increment_balance(user_id, amount)` — called, never existed.** The
   deliverables-approve branch has called this RPC to credit a talent's
   `profiles.balance` since before this pass touched the file; the function
   was never created, so every brand-approved booking on the platform has
   left the talent's balance uncredited, silently, until this pass's
   swallow-to-log fix surfaced it. Added in
   `supabase/migrations/20260909_increment_balance.sql` (not auto-applied
   per §6) — locked down the same way as `track_talent_profile_view()`/
   `touch_last_active()` (SECURITY DEFINER, pinned `search_path`, EXECUTE
   revoked from PUBLIC/anon/authenticated, granted to `service_role` only;
   this touches money, it must never be a reachable public RPC endpoint).

Neither gap blocks the booking pipeline itself — a booking still reaches
`paid` and gets its review end-to-end (verified live) — they only mean the
platform's own money bookkeeping (escrow state, talent balance) isn't
actually moving yet. `payments.status` stays `pending` and
`profiles.balance` stays unchanged for every booking until both are fixed.

---

## Candidate Import — Streaming Progress — 2026-09-10

`POST /api/admin/candidates/import` now **streams NDJSON progress** instead of
blocking until done. One import can be hundreds of rows, each its own
dedup-lookup + insert (`importCandidates()` in
`features/candidates/services/candidates.service.ts` loops sequentially so
two rows sharing an email merge into each other), so a spinner was wrong.

- `importCandidates(rows, createdBy, source, onProgress?)` — `onProgress`
  fires once per processed row.
- The route wraps the import in a `ReadableStream` emitting
  `{"type":"progress","processed":N,"total":T}` per row, then
  `{"type":"done","summary":{...}}`, then closes. Auth
  (`requirePermission("candidates","create")` + `getAdminUser()`) still runs
  *before* the stream is created.
- `CandidateImportPanel.tsx`'s `readImportStream(res)` parses the lines and
  drives a real bar (`processed / total`, `%`), then shows **"تم ✓" / "Done ✓"**
  and the created/merged/flagged/failed breakdown.
- **Auto-refresh without a manual reload:** on completion the panel fires a
  `window` `CustomEvent("candidates:imported")` (the board view,
  `CandidatesBoardView.tsx`, is client-fetched and listens for it) **and**
  calls `router.refresh()` after a ~1.4 s delay (for the server-rendered
  table view) — deferred so the "تم" summary is on screen first.

**Google Sheet fetch made robust (`lib/leads/csv.ts`).** The old
`toSheetCsvExportUrl()` returned `/export?format=csv`, which answers with a
**307 to `googleusercontent.com`** — the edge runtime's `fetch` (in
`next dev` especially) intermittently fails that cross-origin redirect,
surfacing to the admin as a bare "something went wrong". New
`sheetCsvUrlCandidates()` returns `[gviz/tq?tqx=out:csv, export?format=csv]`
— the **gviz endpoint answers 200 directly, no redirect**. Both the
candidate and lead import routes now loop those URLs in a try/catch so a
network throw is caught the same as a non-200 and returns a real 400
message. `toSheetCsvExportUrl()` kept as a thin wrapper (gviz URL) for any
other caller.

---

## Admin Bulk Delete — 2026-09-10

`POST /api/admin/bulk-delete` — one endpoint for "tick rows in an admin
table, delete the batch". Body `{ resource, ids[] }`; `resource` is a key in
the route's `DELETABLE` allow-list, each mapping to a table + an
`AdminResourceKey` whose `"delete"` permission is checked
(`requirePermission` + `getAdminUser`). Cap `MAX_BULK = 500`. Runs a single
`adminClient.from(table).delete({ count: "exact" }).in("id", ids)`.

**Allow-list is deliberately small** — list-management tables where a batch
delete is routine cleanup (junk imports, spam) and child rows cascade:
`candidates` (candidate_actions cascades), `leads` (lead_actions cascades),
`blog` → `blog_posts` (standalone). **Not** bookings / talents / brands /
reviews / verifications: deleting those loses payment history, public
profiles, or a moderation trail — a footgun, not a convenience. Add a
resource only after confirming its FKs cascade.

**Shared UI:** `components/admin/BulkDeleteButton.tsx` — a red button +
`ConfirmationModal`, bilingual, takes `{ resource, ids, onDone }`. Drop it
next to whatever selection UI a table already has, gated on the caller's
`canDelete`. Wired into `CandidatesTable.tsx` and `LeadsTable.tsx` (both
already had `selectedIds` + a bulk-assign bar); their checkbox column and
selection bar now render for `canAssign || canDelete` instead of just
`canAssign`. `onDone` clears the selection and `router.refresh()` (the table
views are server components). Blog is in the route allow-list but its admin
table has no multi-select yet — trivial to wire when wanted.

---

## Admin Tables — Sortable Columns — 2026-09-10

Every list table in `/admin` has sortable column headers. Click a header ⇒ sort
ascending; click the same one again ⇒ descending; a new column starts ascending;
always resets to page 1. `/admin/candidates` was first (below); the same pattern
was then mirrored to **leads, bookings, talents, brands, reviews, verifications,
blog**.

- **Shared client component** `components/admin/SortableTh.tsx` — renders the
  label + a `ChevronsUpDown` (idle) / `ChevronUp` / `ChevronDown` indicator,
  `props { label, col, activeCol, activeDir, onSort, align }`. Also exports
  `parseSortParam(sp, allowed)`.
- **Each table** keeps a small `SORT_COL = { headerKey: dbColumn }` map and a
  `goSort(col, dir)` that does `router.push(hrefFor(1, …, col, dir))` **then
  `router.refresh()`** (Next 15 router-cache: a searchParams-only change
  otherwise serves a stale RSC payload — asc→desc on the same column silently
  did nothing without the refresh). `hrefFor` / pagination `buildHref` thread
  `sort`/`dir` so paging keeps the sort.
- **Each service** (`fetchAdminBookingsPage`, `fetchAdminTalentsPage`,
  `fetchAdminBrandsPage`, `fetchAdminReviewsPage`, `fetchAdminVerificationsPage`,
  `fetchAdminBlogPage`, `fetchLeadsPage`, `fetchCandidatesPage`) gained `sort` +
  `dir` params, validated against a per-service `*_SORT_KEYS` allow-list, with a
  `.order(col,{nullsFirst:false}).order("id")` secondary key for stable paging.
  Unknown/absent `sort` ⇒ the old default (`created_at` / `submitted_at` desc).
- Only **top-level table columns** are sortable. JS-joined values (brand/talent
  names on bookings & reviews, category on talents, computed completion score)
  and board views (no columns) are not. Reviews' no-`status`-column fallback
  schema maps a `status` sort to `created_at`.
- **URL**: `?sort=<col>&dir=asc|desc`, carried through each page's searchParams
  and its `<Suspense key>` so the server component re-runs.

### `/admin/candidates` (the original)

`/admin/candidates` table view: every header is a sort toggle. Click a
header ⇒ sort ascending; click the same one again ⇒ descending; a new column
starts ascending; always resets to page 1.

- **Server-side** (`fetchCandidatesPage` in `candidates.service.ts`): new
  `sort` + `dir` params. `sort` is validated against `CANDIDATE_SORT_KEYS`
  (real `candidates` columns: `full_name, phone, email, job_title,
  expected_salary, stage_id, category_id, assigned_to, created_at`), falls
  back to `created_at`. `stage_id / category_id / assigned_to` sort by the
  FK value (grouping), not by label — which is what "sort by stage/owner"
  means in practice. A `.order("id")` secondary key keeps paging stable
  within equal values. No explicit `sort` ⇒ the old default (newest first).
- **URL**: `?sort=<col>&dir=asc|desc`, carried through the page's
  searchParams and the `<Suspense key>` so the server component re-runs.
- **Client** (`CandidatesTable.tsx`): `SortableTh` renders the label + a
  `ChevronsUpDown` (idle) / `ChevronUp` / `ChevronDown` indicator. Its
  onClick does `router.push(href)` **then `router.refresh()`** — Next 15's
  router cache otherwise serves a stale RSC payload when only searchParams
  change (asc → desc on the same column silently did nothing without it).
  Pagination's `buildHref` / `buildPageSizeHref` now thread `sort`/`dir` so
  paging keeps the sort.

The log-style client-fetched views (emails, notifications-log, support,
user-activity) are not wired — they fetch client-side and would need a
client-side sort instead.

---

## Login — server-side, no email lookup — 2026-09-10

**Removed `GET/POST /api/auth/lookup`.** It took an unauthenticated
`{ identifier: "@handle" }` and returned that user's **real email address**
(resolved via the Supabase Auth admin API). Every talent handle is public,
so this let anyone harvest every talent's private email, unthrottled — found
in the 2026-09-10 audit.

**New `POST /api/auth/login`** (`runtime = 'edge'`) does the whole sign-in
server-side:

- Body `{ identifier, password }`. `identifier` is an email or an `@handle`.
- `resolveEmail()` turns a handle into its account's email **server-side only**
  (same `profiles` → `auth/v1/admin/users/:id` path as the old route) and
  never returns it. An unresolvable handle becomes a syntactically-valid but
  impossible address (`UNRESOLVABLE_EMAIL`) so the sign-in attempt — and its
  timing — still happens instead of short-circuiting.
- Calls `supabase.auth.signInWithPassword` with the **SSR** client from
  `lib/supabase/server.ts`, so the auth cookies are set on the response.
- Any failure (bad handle, bad password, missing field) returns the identical
  `{ error: "invalid_credentials" }` / 401 — no enumeration oracle.
- On success returns `{ role }` only; the role drives the post-login redirect.

`app/(auth)/login/page.tsx` no longer imports the browser Supabase client at
all — it POSTs to the route and then does a **full** `window.location.assign`
(not `router.push`) so middleware and every server component re-read the
fresh cookies. `next.config.ts` adds `/api/auth/:path*` to the
`private, no-store` header list.

No `/forgot-password` page exists yet (the login page links to it) — separate
open item.

---

## P0 hardening pass — 2026-09-10

Follow-up to the 2026-09-10 audit. Four P0 items; #1 (the `/api/auth/lookup`
email leak) is the section above. The rest:

### Rate limiting + honeypot + Turnstile-ready — public write endpoints

`lib/rate-limit.ts` — `rateLimit(bucket, { windowSeconds, max })` calls the
`rl_hit(text, integer, integer)` RPC (fixed-window counter in
`public.rate_limits`, `supabase/migrations/20260910_rate_limits.sql`).
**Fails open** — if the RPC errors or isn't applied yet, the request is
allowed and the failure logged, so nothing breaks before the migration lands.
Also exports `clientIp(req)` (cf-connecting-ip → x-forwarded-for → x-real-ip),
`tooManyRequests()` (429 `{error:"too_many_requests"}`), and the honeypot
helpers (`HONEYPOT_FIELD = "_hp"`, `isHoneypotTripped`).

Wired into: `/api/contact`, `/api/support/tickets` (per-IP 5/10min + honeypot +
Turnstile), `/api/auth/otp/send` + `/otp/email/send` (per-IP 5/hr + per-target
3/hr), `/api/auth/otp/verify` + `/otp/email/verify` (per-IP 10/10min + per-target
6/10min brute-force cap), `/api/auth/login` (per-IP 20/10min + per-identifier
10/10min). `/api/contact` also gained real email-format validation (it had none).

`lib/turnstile.ts` — `verifyTurnstile(token, ip)`. **No-op returns `true` when
`TURNSTILE_SECRET_KEY` is unset** (same posture as MetaPixel); fails closed on a
network error when it IS configured. `components/forms/TurnstileWidget.tsx`
renders nothing without `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. `components/forms/
Honeypot.tsx` is a shared off-screen `_hp` input (not `display:none` — bots skip
those). Both wired into `ContactForm.tsx` and `SupportTicketModal.tsx`.
`next.config.ts` CSP now allows `challenges.cloudflare.com` (script-src +
frame-src). New optional env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
`TURNSTILE_SECRET_KEY` (both in `.env.example`).

### DB migration — APPLIED & VERIFIED 2026-09-10

Both migrations were pasted into the Supabase SQL editor and verified live:
- `rl_hit` RPC + `rate_limits` table exist; the fixed-window cap enforces
  (probed: 6 hits against a max of 3 → 3 allowed).
- `payments.status` now walks the full lifecycle
  (held/released/refunded/disputed/pending) without the trigger throwing.
- `increment_balance(uuid, numeric)` exists.
- **Full escrow flow E2E** (QA accounts, real API routes, against the live DB):
  admin confirm → `pending→held` + booking `in_progress`; talent deliverables;
  brand approve → `held→released` + booking `paid` + **talent `profiles.balance`
  0 → 3000** via `increment_balance`. All state restored after.
- Live rate-limit enforcement confirmed on `/api/contact` (5 then 429) and
  `/api/auth/login` per-identifier (10 wrong then 429).

Original migration notes (kept for reference):

- **`20260910_rate_limits.sql`** — `rate_limits` table + `rl_hit()` RPC
  (SECURITY DEFINER, pinned search_path, EXECUTE → service_role only). Until
  this runs the rate limiter is inert (fail-open).
- **`20260910_p0_payments_unblock.sql`** — the money-flow fix:
  1. Dumps every trigger on `public.payments` (`RAISE NOTICE` + `pg_get_functiondef`).
  2. Drops any payments trigger whose function writes to `notifications` — the
     broken one throws `column "user_id" of relation "notifications" does not
     exist` (confirmed by direct write: a non-status update succeeds, any status
     change to held/released/refunded/disputed throws). The app already sends
     both payment notifications itself (`/api/admin/bookings/[id]/payment/confirm`
     and the deliverables-approve release), so the DB trigger is redundant.
  3. Verifies `payments.status` is writable afterwards.
  4. Creates `increment_balance(uuid, numeric)` — was called by the
     deliverables-approve branch, never existed (`20260909_increment_balance.sql`
     was written but never pasted).
  5. `proof_url` belt-and-braces `ADD COLUMN IF NOT EXISTS`.

Verify after applying with `scripts/` or a probe: `payments.status` round-trips
through `held`, `increment_balance` RPC resolves, `profiles.balance` moves on a
brand approval.

---

## P1 hardening batch — 2026-09-10

### Schema snapshot + `db:schema-audit` in CI

`scripts/schema-audit.mjs` (`npm run db:schema-audit`) was rewritten: it now
probes the live DB for **every column / table / RPC the code actually reads**
(the escrow shape on `payments`, `deliverables`, `subscriptions.plan_id`,
`leads.channel_id/category_id`, `blog_posts`, `user_events`, `rate_limits`,
the `increment_balance` + `rl_hit` RPCs …) **and** re-runs the
`payments.status`-writable regression check. Added as a hard step in
`.github/workflows/deploy.yml` (needs `NEXT_PUBLIC_SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY`, already CI secrets).

`supabase/migrations/20260910_schema_snapshot.sql` — a version-controlled,
idempotent record of the drifted objects (payments escrow shape incl. the
10/90 `platform_fee`/`talent_payout` split observed live, `increment_balance`,
`rate_limits`+`rl_hit`, and the still-outstanding `lead_channels` /
`lead_categories` / `leads.channel_id` from `20260907_leads_channel_category.sql`).
Run it against production (no-ops) or a fresh project (bootstraps).

**Outstanding when this was written:** `20260907_leads_channel_category.sql`
was never pasted — `leads.channel_id`, `lead_channels`, `lead_categories` are
missing, so the leads admin table's Channel/Category columns + filters are
inert (they degrade gracefully, no crash). `db:schema-audit` flags all three
until the snapshot migration (or that file) is applied.

### Security headers

`next.config.ts` `/(.*)` now also sends `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy:
camera=(), microphone=(), geolocation=(), browsing-topics=()`,
`X-Frame-Options: SAMEORIGIN`. CSP tightened: `img-src` / `media-src` off the
blanket `https:` to `res.cloudinary.com` + `images.unsplash.com` +
`*.supabase.co` (+ `www.facebook.com` for the Pixel beacon); added
`base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, and
`connect-src https://api.cloudinary.com` (the client-side portfolio-video
upload in `/profile/me` + `CompleteProfileShell` posts there directly — it
was silently CSP-blocked before). `images.remotePatterns` narrowed from
`hostname: "**"` to the same three hosts.

### `/api/admin/promote-admin` removed

The self-described temporary "promote any handle to admin" route + its
`/admin/settings` card are gone (9 admin accounts exist — no need for the
bootstrap). `requireSuperAdmin` stays (the `/admin/roles/*` routes use it).

### `COMPLETION_THRESHOLDS` — partial enforcement

`lib/completion-gate.ts` — `requireCompletion(userId, gate)` +
`talentCompletionScore(userId)`.
- **`applyToJobs` (50) — enforced ON.** `POST /api/jobs/[id]/apply` returns
  `403 { error: "profile_incomplete", score, needed }` below the bar.
  `ENFORCE_COMPLETION_APPLY="false"` disables it. (~32% of the current base is
  under 50, but the bar is low and the message is actionable.)
- **`receiveBriefs` (70) — wired, OFF.** `POST /api/bookings/direct` checks the
  target talent; gated by `ENFORCE_COMPLETION_BRIEFS="true"` (default off —
  ~47% under 70).
- **`appearInSearch` (60) — deliberately NOT wired.** A search-visibility gate
  was added and removed 2026-09-08 at the admin's explicit request ("I approved
  40, only 39 show"). `public-talents.service.ts` still gates on approval only.

### zod on request bodies (money + auth first)

`zod` (installed, was unused) now validates the body on: `/api/auth/login`,
`/api/auth/otp/{send,verify}`, `/api/auth/otp/email/{send,verify}`,
`/api/bookings/[id]/deliverables` (POST + PATCH), `/api/bookings/[id]/review`,
`/api/bookings/[id]/brief/respond`, `/api/contact` — joining the routes that
already had it (`bookings/direct`, `jobs/[id]/apply`, `jobs`, `profile`,
`subscriptions`, several `admin/*`). Pattern: a module-level `z.object({…})`,
`schema.safeParse(await req.json().catch(() => null))`, 400 (or the route's
existing generic error) on failure. Verified the escrow E2E still passes and
that each new schema rejects malformed input.

---

## Portfolio media moderation — 2026-09-19

Every photo/video a talent uploads (`POST /api/portfolio`) now lands in a review queue
and is **hidden from the public profile until an admin approves it — even when the
talent's profile is already approved.**

- **`portfolio_items.is_approved` is the single "public" switch.** Every public read already
  filtered on it (`talent.repository.ts findPortfolio`, the explore public-read policy), so
  nothing on the read side changed. The upload route used to insert `is_approved: true`; it now
  inserts `false`. Existing rows stay approved (297 at the time).
- **Review trail:** `review_status` (`pending|approved|rejected`), `reviewed_by`, `reviewed_at`,
  `rejection_reason` — added by `supabase/migrations/20260919_media_moderation.sql` (hand-run).
  New columns default to `pending`/`false`, so any insert path that forgets to say otherwise is
  queued, never published. **Until that migration runs**, the queue works off `is_approved` alone
  (approving works; *rejecting* returns `409 migration_required` because the reason has nowhere to
  go). `lib/media-review.ts` holds the shared status helper with that fallback.
- **Admin page `/admin/pending-data`** (resource key `pendingData`, Talents group in the sidebar):
  tabs Pending / Rejected / Approved / All with counts, type + talent search filters, thumbnail/video
  cards with a full-size preview, single + bulk approve, reject with a required reason (quick-reason
  chips), and "take down" for an already-approved item. Reads: `features/admin/services/
  pending-media.service.ts`; writes: `PATCH /api/admin/pending-media` (`requirePermission("pendingData",
  "update")`, ≤200 ids, only rows that actually change state are touched/notified, one notification per
  talent, `invalidateTalent` per handle). **A restricted admin role sees nothing until it has
  `pendingData` rows** — `supabase/migrations/20260919_pending_data_permission.sql` copies each role's
  `talents` access over; review it, or grant on `/admin/roles`.
- **Notifications:** admins get `notifyAdminMediaPending` (reuses the `BRAND_MOMENT_SUBMITTED` type — no
  `notification_types` row needed); the talent gets `notifyMediaReviewed` (reuses `PROFILE_APPROVED` /
  `PROFILE_REJECTED`, action URL `/profile/me`).
- **Owner UI:** `/api/me` now returns `is_approved`, `review_status`, `rejection_reason` for the owner's
  own items; `components/profile/MediaReviewBadge.tsx` shows "Pending review" / "Rejected" on each tile
  in `/profile/me` and the complete-profile wizard, plus a one-line explainer. The public profile never
  receives non-approved media.
- **Not covered:** avatars (`/api/profile/avatar`) still publish immediately — only portfolio media is
  moderated. Talents keep their approved media when the profile is later suspended (that path is
  unchanged).

### Profile-photo moderation (same day)

A **talent's** new profile photo is reviewed too (brands' logos are exempt). `profiles.avatar_url` stays the last
*approved* photo — every public read uses it — while an upload is parked in `profiles.pending_avatar_url` with
`avatar_review_status` (`NULL | 'pending' | 'rejected'`), `avatar_rejection_reason`, `avatar_submitted_at`,
`avatar_reviewed_by/at` (`supabase/migrations/20260919_avatar_moderation.sql`, hand-run; **run it before deploying**).
- `POST /api/profile/avatar` (talent) parks the photo and notifies admins; it **fails closed** (`503
  avatar_review_unavailable`) if the columns don't exist rather than publishing unreviewed.
- `POST /api/profile` **no longer accepts `avatar_url` for talents** (it was a bypass: any URL could be set directly).
- `GET /api/me` returns the owner's `pending_avatar_url` / `avatar_review_status` / `avatar_rejection_reason` (in a separate,
  error-tolerant read); `/profile/me` shows the pending photo with a "Pending review" badge, the wizard shows a status line.
- Admin: `/admin/pending-data?kind=avatar` (the "Profile photos" switch on the same page, same `pendingData` permission).
  `PATCH /api/admin/pending-media` with `kind: "avatar"` (ids = profile ids): approve promotes `pending_avatar_url` →
  `avatar_url`; reject keeps the last approved photo live and records the reason. The update is guarded on the exact pending
  URL so a photo re-uploaded a moment earlier isn't overwritten.

---

## Rebrand foundation — 2026-09-24

New identity: Deep Teal `#087F83` (primary) · Soft Teal `#4FA7A3` · Dark Chocolate `#2B211D` · Muted Peach `#E7A58A` (accent) · Vanilla Cream `#F5EEDB` (light-mode page ground).

- **Tokens** (`app/globals.css`): raw palette in `--brand-*`, then roles exactly as the brand defines them — `--color-primary` = Deep Teal; `--color-secondary` = Dark Chocolate, `--color-secondary-alt` = Soft Teal; `--color-accent` = Muted Peach (highlights, CTAs, the active nav pill; `-soft`/`-strong` variants, `--color-on-accent` for text on a peach fill). The ~180 call sites that used `--color-secondary` as the old gold highlight were moved to `--color-accent`. Legacy `--color-orange*`/`--color-purple*` aliases now map to peach/soft teal; status colors (success/warning/error/info) are unchanged.
- **Dark theme** is derived (the brand ships none): warm chocolate, page `#1B1310`, cards on `#2B211D`. **Light theme**: page `#F5EEDB`, cards `#FBF7EA`, text `#2B211D`.
- **Contrast rules** (measured): peach on cream ≈ 1.8:1 and Deep Teal on cream ≈ 4.2:1, so peach never carries text on light (`--color-secondary-strong` is `#9A4E34` in light mode) and the global focus ring is teal, not peach.
- **Logo**: `public/assets/talents-logo-light.png` (chocolate wordmark) and `talents-logo-dark.png` (cream wordmark + Soft Teal mark), generated from `public/assets/1.png`. Renamed from `logo-*.png` on purpose: `next/image` caches by URL and served the old logo.
- **Navbar** links: About · Discover Talents · Community · Packages · Contact (Home = logo; Projects/Brands left the bar). Hover text-roll and the comet ring are unchanged (comet now peach).
- **Not migrated yet**: the ~157 files that define their own hex constants (`const GREEN = "#00D26A"` …) still show the old colors until the per-page pass. `DESIGN.md` frontmatter is current; its prose still describes the old dark-first direction. Favicon/`site-icon.png` and OG image are still the old mark.

### Auth pages redesign — 2026-09-24

`/register`, `/login`, `/forgot-password` and `/waitlist` all render inside one frame, `app/(auth)/_components/AuthFrame.tsx` (top bar with logo / language / theme / Back to Home, a showcase card, and a form card); `app/(auth)/auth.module.css` owns the look and is token-only. Form logic stayed in each page. The showcase hides under 980px. `variant="plain"` (waitlist) renders the form card alone.

- Hero photo: `public/assets/auth-hero-talent.webp` (141 KB, halo removed from the cut-out alpha). The 2.2 MB source PNG `92bddf5d-….png` and the old `auth-hero.avif` are no longer referenced.
- `FIELD_ORDER` (register validation focus order) now follows the on-screen order: name, email, phone, password, confirm, category, other type, terms.
- No "Continue with Google": there is no OAuth provider wired up, so the button from the mockup was left out rather than faked.

**Auth transitions (2026-09-24):** the frame now lives in `app/(auth)/layout.tsx` via `_components/AuthShell.tsx`, so the top bar and showcase stay mounted between `/login`, `/register`, `/forgot-password`. Links between those pages use `AuthLink`: it plays `formOut` (slide left, 260 ms), then `router.push`; the next form enters with `formIn`. `prefers-reduced-motion` skips both. Pages return only their form — do not wrap them in `AuthFrame` again.

**Auth responsive breakpoints (2026-09-24):** the fixed one-screen layout (both cards a shared 580 px tall, page height locked to the viewport) only applies at **≥ 1181 px**. Below that the showcase card is hidden and the form takes the row alone (max 760 px, page scrolls normally) — at ~1000 px the register showcase used to collapse to ~300 px wide with clipped copy and a pixelated photo. Between 1181 and 1365 px the showcase drops its long paragraph and feature descriptions (`.showcaseSub`, `.feature small`) and register's role cards lose their subtitle so everything still fits. The register form column is `clamp(520px, 49vw, 660px)`. Language switch (`data-lang-phase` on `.authPage`) and theme switch (View Transitions in `SiteContext.setMode`, `theme-switching` class) are animated; `SupportTicketModal` is portaled to `<body>` because the form's slide-in transform otherwise traps its `position: fixed` backdrop.

**Load performance (2026-09-24):** Google Fonts is no longer a CSS `@import` (that was render-blocking, ~0.9 s on a throttled phone): `app/layout.tsx` preconnects to fonts.googleapis.com / fonts.gstatic.com and injects the stylesheet `<link>` from a tiny head script (with a `<noscript>` fallback), so text paints in the fallback face and swaps. The favicon is `/site-icon-64.png` (3 KB) and apple-touch `/site-icon-180.png`; `/site-icon.png` (now 47 KB, was 336 KB) is only the og:image. Lighthouse 12, production build, throttled mobile: /login 62 -> 90, /register 63 -> 83-90 (transfer 942 -> 619 KiB). Remaining cost is Meta Pixel (~190 KB, only when `NEXT_PUBLIC_META_PIXEL_ID` is set) and shared JS.

**Onboarding restored (2026-09-24):** `/onboarding` (a 5-step talent orientation: welcome, how bookings work, why complete your profile, how brands find you, tips) had been unlinked since commit `27847b5` (2026-09-21), which pointed the post-signup redirect straight at `/profile/me/complete`. Registration now sends UGC/Model talents to `/onboarding` again (brands still go to `/profile/me`, "other" talents to `/waitlist`); Skip / the last step lands on `/profile/me/complete`. It shares the auth top bar (logo, language, theme), the brand tokens, and the hero cut-out (hidden below 1101 px). Correction to §12 item 4: `app/(auth)/onboarding/page.tsx` is live code now, not a commented-out wizard. The old `talents_just_onboarded` sessionStorage flag is no longer set (the profile wizard replaced the `/profile/me` popup it fed).

**Language-switch animation is shared (2026-09-24):** the wipe-out / type-in choreography lives in `app/(auth)/_components/useLangSwitch.ts` (`data-lang-phase` = `idle | out | in`, `LANG_OUT_MS` / `LANG_IN_MS`) and is used by both `AuthFrame` (sign-in / register / forgot-password) and `/onboarding` (which wipes `.cardContent` and fades the art chip). Change the timings in the hook and in the matching `langOut` / `langIn*` keyframes together.

### Admin back-office rebrand — 2026-09-24

The whole `/admin` panel now uses the brand palette and the auth pages' type pairing.
- `components/admin/adminLightTheme.ts`: `ADMIN_LIGHT` is cream/chocolate/teal (page `#F5EEDB`, cards `#FBF7EA`, text `#2B211D`, primary `#087F83`); new `ADMIN_DARK` holds the chocolate dark-mode values.
- Sidebar is a Dark Chocolate rail in both themes (teal/peach glow, no photo), Muted Peach active pill with chocolate text, and the cream Talents wordmark (`talents-logo-dark.png`) at the top (hidden when collapsed).
- The old per-file hexes (`#00D26A` green, `#F4B740` gold, `#60A5FA` blue, the navy/slate dark and light greys, the 09-08 blue theme) were remapped to brand values across every admin file. Status reds/ambers/success greens were left alone.
- Teal used as text goes through the new global token `--color-primary-text` (Soft Teal in dark, `--color-primary-strong` in light), since Deep Teal on the chocolate cards is ~2.9:1. Text on a teal fill is white.
- `AdminShell` sets `font-family: var(--font-sans)` and headings use `var(--font-display)` (Alexandria), same as the auth pages.

**Admin sidebar toggle animation (2026-09-24):** `AdminSidebar` now animates collapse/expand instead of snapping. The rail width, the floating edge toggle (`left`) and the seam glow share one curve (`RAIL_EASE`, 0.35 s); the toggle chevron turns over instead of swapping icons; labels fade out `RAIL_FADE_MS` (160 ms) before the content flips to the icon-only column (`rail` lags `collapsed` on the way in) and fade back in as it opens. Nothing animates until the admin actually toggles the rail (`animate` state) — every admin page wraps its own `AdminShell`, so a saved "collapsed" preference must not replay the slide on each navigation. `prefers-reduced-motion` turns it all off.

**Home page redesign (2026-09-24):** `/home` now renders `app/(main)/home/_components/home/HomeLanding.tsx` + `home.module.css` (token-only, RTL via logical props) — six sections: hero collage, "What Talents does for you" (talent / brand cards), Discover Talents (5 categories), Talents in numbers, community (stories + posts), Talent Packages. Copy is inline `ar`/`en`. Headings use the new `--font-serif` (Fraunces, loaded with the other Google fonts in `app/layout.tsx`; Arabic glyphs fall through to Alexandria).
- **Real data only.** `app/(main)/home/page.tsx` feeds counts from the DB: talents / UGC / models from the public talent cards, `getCachedPublicBrandCount()` (same gate as `/brands`), completed projects, average rating (tile hidden when there are no ratings; zero-valued tiles are dropped). `getCachedCommunityHighlights()` (latest `community_posts`, unexpired stories → the avatar row, up to 4 posts) and `getCachedFeaturedPackages()` (the cheapest valid package of up to 3 different approved talents, best-rated first, public gate re-applied) live in `features/landing/services/landing-content.service.ts`. Empty community → an invitation card, no packages → a "Create your packages" button.
- Only UGC and Models are live categories; Influencers / Family / Photographers cards carry a "Soon" ribbon and aren't linked (same rule as the old landing).
- Photos are curated Unsplash stock (decorative). Real talent avatars were tried in the collage and dropped — quality too uneven for the first screen.
- **Not on Home any more:** testimonials, brand moments, FAQ, pricing preview and the search bar. The old `landing/LandingPage.tsx`, `content.ts` and the two submit panels are still in the repo, unused; the admin pages that manage testimonials / brand moments still work but nothing on Home displays them.

**Home responsive rules (2026-09-24):** hero and the two audience cards stack below 1100 px (the collage beside the copy gets too tight and its float cards collide with the photos); the five category cards go 3 + 2 wide (6-col spans) up to 1100 px and 2 + 1 full-width under 640 px; stat tiles and package cards are `flex-wrap` (not auto-fit grids) so the last row stretches instead of leaving a hole; `.pkgCard` needs `min-width: 0` or the clamped title's max-content wraps the row early. Checked 320 → 1920 in EN and AR: no horizontal overflow, no clipped item labels.

**Language-switch animation is site-wide now (2026-09-24):** the hook moved to `hooks/useLangSwitch.ts`. `Navbar` calls it with `{ global: true }`, which mirrors the phase onto `<html data-lang-phase="out|in">`; `app/globals.css` (section "Language switch (site-wide)") wipes `main`, the nav links (`[data-lang-wipe]`) and `footer` right→left, flips the language while they're hidden, then types them back (left→right in English, right→left in Arabic). Any `(main)` page gets it for free — no per-page wiring, no reload. The auth frame and `/onboarding` keep animating their own root (hook without `global`). Timings: `LANG_OUT_MS` / `LANG_IN_MS` in the hook and `site-lang-*` keyframes in globals.css.

**Home card hover (2026-09-24):** every card on `/home` shares one hover (inside `@media (hover: hover)` in `home.module.css`): `scale` (1.06 collage photos, 1.04 float cards / category / package cards, 1.03 audience cards / stat tiles / invite pill / community posts), `z-index` above neighbours, and `box-shadow: var(--hover-shadow)` (defined on `.page`, deeper in dark). It uses the individual `scale` property so it composes with the collage tilt (`transform`) and the float-card bob (`translate`). "Soon" category cards aren't links and don't react.

**Model + UGC profiles on the brand palette (2026-09-24):** `app/(main)/talent/[handle]/_components/**`, `components/profile/**` and `features/talent-profile/**` no longer carry the old cool-slate / green / gold / purple colours. The Model profile used gold + green and the UGC profile purple; both now use the site tokens: primary teal (`var(--color-primary)` fills with `var(--color-primary-ink)` text, `var(--color-primary-text)` for teal text/icons), peach (`var(--color-accent)` + `var(--color-on-accent)` for tags, `var(--color-accent-strong)` for peach text), `var(--color-success)` / `--color-error` for status, warm chocolate / cream neutrals (`#2B211D`, `#FBF7EA`, `#F5EEDB`, `#E6DCC3`, `#6E5F55` …). Per-file constants (`GOLD`, `GREEN`, `PURPLE`, `VIOLET`, `EMERALD` …) were kept and re-pointed, so their many call sites follow. Alpha-suffix concatenation (`${GOLD}33`) became `color-mix(in srgb, ${GOLD} N%, transparent)` so it works with `var()` values. **Exception:** the UGC hero band is dark in both themes, so `UgcHero.tsx`'s accents are fixed light tints (`#4FA7A3`, `#7CC4C0`, `#F0B9A2`) instead of the theme-aware text tokens. Platform brand marks (Instagram, TikTok, Facebook, LinkedIn, X …) keep their own colours.

**Brand profile + error pages on the palette (2026-09-24):** `components/profile/brand/**` was already migrated by the Model/UGC pass (same `components/profile` tree); this pass fixed `app/(main)/brand/[id]/_components/BrandProfileShell.tsx` (page ground `#1B1310` / `#F5EEDB`) and the two global fallbacks that still used the old slate/green: `app/not-found.tsx` (teal 404, teal button) and `app/blocked/page.tsx` (teal link instead of blue). Note: `/brand/<handle>` only renders for brands whose **`brand_profiles.status` is `approved`** — in the current DB that is just `qa-test-brand`; the other brands are `pending` there (their `profiles.brand_status` says approved) and correctly 404 for the public.

**Explore pages on the palette (2026-09-24):** `/explore` was already on the site tokens (CSS module); this pass fixed its leftover literals in `ExplorePage.module.css` (search-bar cream instead of white, warm text greys, dark-teal gradient stops) and migrated `/brands` (`BrandsClient`, `BrandsFilters`, `BrandsGrid`, `BrandsHero`, `BrandsFeatures`: slate/green/gold → the teal / peach / warm-neutral tokens, avatar-gradient placeholders → chocolate tints). `components/ComingSoonOverlay.tsx` (used by `/brands` and `/community` while gated) now uses cream/chocolate surfaces and `--color-primary-ink` on its teal button. `/brands` itself is still behind that overlay.

### Guest auth modal on the palette + motion — 2026-09-24

`contexts/GuestGuard.tsx` ("Create an account to continue") no longer hardcodes the old green/navy hexes: surface/border/text use `--bg-card` / `--border-subtle` / `--text-primary` / `--text-muted`, "Continue as Talent" is `--color-primary` + `--color-primary-ink`, "Continue as Brand" is a peach-tinted button (`--color-accent`, text `--color-accent-strong`). Motion lives in `globals.css` (`.guest-auth-*`): backdrop fade, card rise+scale, buttons stagger via `--i`. Every close path (X, backdrop, Escape, `closeAuthModal`, navigating via a button) goes through `dismiss()`, which sets `data-state="closing"` for `CLOSE_MS` (200 ms, keep in step with the CSS) before unmounting; `requestAuth` during a close cancels the timer. `prefers-reduced-motion` collapses it to ~instant.

**All modals on the palette + enter/exit motion (2026-09-24):** the animation from the guest auth modal is now shared. `globals.css` (`.modal-backdrop` / `.modal-card` / `.modal-item`, `data-state="closing"` on the backdrop plays the exit) and `hooks/useModalClose.ts` (`MODAL_CLOSE_MS` = 200, keep in step with the CSS) provide three helpers by how the modal is mounted: `useModalClose(onClose)` for `{open && <Modal onClose />}` components (alias the prop, use the returned `close`), `useModalPresence(open)` for `open`-prop components (`ui/Modal`, `admin/ConfirmationModal`), `useHeldValue(state)` for `{state && …}` blocks whose content reads the state (the block reads the held copy while closing). Wired into `DirectBriefModal` / `PackageBookingModal` (shared `DirectBriefModal.module.css` now teal/peach/cream), `AvatarCropModal`, `BriefForm`, the admin move-stage / settings panels / email log / notification log / support / bookings payment review / pending-media / complaint / contact modals, `UgcPreviousShoots`, the applications reject modal and the two `/profile/me` modals; the framer lightboxes got a matching exit. `BriefForm`, `ApplicationsClient` and `/profile/me` were re-coloured whole-file (filled buttons = `--color-primary` + `--color-primary-ink`). `FloatingChatWidget` and the notification bell dropdown got the same treatment right after (peach FAB, warm surfaces, `TYPE_COLOR` in `lib/notifications/templates.ts` remapped to the palette; the chat panel and dropdown animate out too via `useModalPresence`, dropdown uses `.popover-panel`).
