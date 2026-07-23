# AGENTS.md — Technical Context

> **Audience:** AI assistants (Codex) and developers working on this repo.
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
- **Live surface:** guests can browse `/home`, `/explore`, `/talent/[handle]`, `/jobs`, `/community`,
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
│   ├── notifications/  NotificationBell, NotificationDropdown, useNotifications
│   ├── profile/    ProfileClient, ProfileCompletionCard, ProfileHero
│   └── legal/ blog/ contact/
│
├── contexts/SiteContext.tsx    lang (ar|en) + mode (dark|light), persisted to localStorage
├── features/                   Feature-scoped service/transformer/type layers
│   ├── talent-profile/         service (DB reads) → transformer (DB → view model) → types
│   ├── admin/                  admin.service.ts + admin types
│   └── chat/types
├── hooks/useIsMobile.ts        Viewport breakpoint hook used by nearly every component
├── lib/
│   ├── supabase/{server,client,admin}.ts
│   ├── notifications/create.ts createNotification() — service-role insert, errors swallowed
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
- **`notifications`** (4) — Realtime-enabled; `type`, `title`, `message`, `reference_id/type`, `is_read`.
- **`community_questions`** (12) + **`community_answers`** (8).
- **`contact_messages`** (1) — public contact form, insert-only via service role.

### DB-side logic
`trigger_sync_rating.sql` — `AFTER INSERT/UPDATE/DELETE ON reviews` recomputes
`talent_profiles.avg_rating` and `total_reviews` (`SECURITY DEFINER`).

---

## 8. Roles & Permissions

Roles live in `profiles.role` (Postgres enum `user_role`).

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
- `notifications` — SELECT/UPDATE own rows only; **no INSERT policy** (service role only).
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
`lib/notifications/create.ts` → service-role insert. Types: `message`, `job_application`, `brief`,
`booking`, `payment`, `review`, `system`. The table is in the `supabase_realtime` publication;
`components/notifications/useNotifications.ts` subscribes and drives the navbar bell.
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
  `data-theme` / `lang` / `dir` on `<html>` from `localStorage` before hydration. Default mode is
  **time-based** (light 06:00–18:00, else dark) when nothing is stored.
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
5. **~20 ad-hoc admin endpoints** under `app/api/admin/` (`run-migration`, `seed-*`, `debug-*`,
   `check-*`, `verify-db`, `chat-migration`…) exist in production. They are role-gated at the layout
   level only for pages — **verify each route's own auth before trusting it**. These should be
   removed or moved behind an env flag before public launch.
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
