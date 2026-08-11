# Profile System MVP Audit — 2026-08-11

> **Type:** Read-only architecture/product audit + approved product decisions. No code, schema, or data was modified while producing or updating this report.
> **Scope:** Whether the current profile foundation is ready to build the MVP **UGC Creator** and **Model** profiles.
> **Method:** Every migration file under `supabase/migrations/`, the live Supabase schema (via PostgREST introspection, service-role, read-only), the `features/profiles/**` and `components/profile/dynamic/**` code, the registration flow, and aggregate row counts (no user data reproduced).
> **Verified against:** live project `kjtppolajcwoovrwnoqs`, branch `main`, as of this audit.
> **Update (2026-08-11, same day):** the product decisions in §0 below are now APPROVED and supersede the corresponding "OPEN DECISION" / recommendation language in the original audit (§9, §11, §15.5, §18). Sections marked **[SUPERSEDED]** keep their original analysis for evidence but no longer state the open question — see §0 and §21 for the current, decided position.

Each finding below is tagged so you can tell what kind of claim it is:
- **FACT** — directly observed in code, migration files, or a live read-only query.
- **PROBLEM** — a fact that breaks something (a gap, a bug, a contradiction).
- **INFERENCE** — a conclusion drawn from facts, not itself directly observed.
- **RECOMMENDATION** — a suggested action, evaluated below.
- **APPROVED DECISION** — a product call that has been made (§0) and is no longer open.

---

## 0. Approved Product Decisions (supersede §9 / §11 / §15.5 / §18 where noted)

These were decided after the original audit and are now binding on the target architecture:

1. **UGC/Model differentiation = Option A, approved.** `profile_type` stays `talent`. UGC and Model are **Talent categories**, not separate account-level profile types. The future architecture is **category-scoped sections/fields/layout behavior inside the existing Talent provider and Dynamic Profile system.** No `profile_types` row for `ugc` or `model` at MVP. (Was §15.5 OPEN DECISION — now closed.)
2. **Registration → Onboarding → Profile is one continuous flow, not two.** Fast account creation, immediately followed by **category-aware professional onboarding** that writes directly into canonical structured profile sources. A talent must never re-enter data collected during onboarding. (Supersedes §5.1's "registration collects only identity" framing as sufficient — it's still true today, but no longer the target.)
3. **AI Match V1 is MVP — 🔴, required before founding-creators launch.** Advanced matching (scoring refinement, learned ranking) stays 🟡. V1 must be built on structured, explainable profile attributes (category, language, location, content style, availability, etc.) with no scoring algorithm designed yet — this audit still does not design one.
4. **The specific attributes AI Match V1 depends on are MVP**, not post-launch: talent category, categories/specialties, skills/content specialties, languages, location, content styles (UGC), equipment (where relevant), availability, and whichever Model attributes are needed for job matching. Smallest controlled/structured representation that makes deterministic matching possible — not a full taxonomy/search build-out.
5. **The dynamic write path is P0.** `/profile/me` (or onboarding) must gain a schema-driven form: `profile_sections → profile_fields → generated category-aware form → validation → profile_values → DynamicProfileRenderer`. No separate hardcoded UGC/Model edit applications — category-specific **presentation** components are fine where visuals genuinely differ; data collection reuses the dynamic engine.
6. **Registration bugs stay P0 blockers**, unchanged from the original audit: add `model` category, resolve `media_buyers` drift, prevent `talent_profiles.category`/`profile_categories` drift, prevent partially-created accounts when category assignment fails mid-signup.
7. **Portfolio stays one relational entity** (`portfolio_items`). UGC and Model get category-specific metadata/tagging on the same table — no parallel portfolio subsystem. Taxonomy values remain a product decision, not invented here.
8. **Model physical/professional data must become structured enough to filter/match on.** A minimal representation is recommended below (§9.1) — free-text-in-JSONB is no longer acceptable for match-critical fields.
9. **Category-aware Profile Completion is in scope for the UGC/Model implementation itself**, not deferred to 100–300 talents. UGC and Model do not need identical weight tables. Enforcement of application/marketplace thresholds (`COMPLETION_THRESHOLDS`) stays unenforced unless separately approved — only the *scoring differentiation*, not *gating*, moved into MVP.
10. **Deliverables/payments risk is conditional, stated explicitly:** if MVP processes real payments, escrow, or revisions, the missing `deliverables` table and booking/deliverables path become a **launch blocker** and must be audited before launch. If MVP does not move real money yet, this is a **separate sprint** and does not block UGC/Model profile work. (No change to whether the table exists — see §12/§13.1 — only to how urgently it must be fixed.)

---

## 1. Executive Summary

The team already built a **second-generation dynamic profile architecture** ("Profile Architecture V2") in August 2026 — nine migrations (`20260806_01`…`20260811`), fully live, fully tested (`components/profile/dynamic/adapters/adapters.test.ts`, `runtime-prep.test.ts`, `features/profiles/services/generic-provider.test.ts` — 79 tests, all passing). It is **not aspirational**: `/talent/[handle]` and `/brand/[id]` render through it in production today (`app/(main)/talent/[handle]/page.tsx` → `profileService.getPublicProfileByHandle` → `TalentProfileShell` → `DynamicProfileRenderer`).

That architecture is the right foundation to build UGC and Model profiles on. **It does not need a rewrite.** Three gaps were found, and all three now have an approved direction (§0):

1. **There was no way to make one talent category look different from another.** Every talent — UGC, Model, Influencer, Host, Actor — shares exactly one `profile_type` ("talent"), one `profile_sections` set, one `profile_layouts` row. **Decided (§0.1): stays this way structurally — `profile_type` remains `talent` — but sections/fields/layout become category-scoped inside the existing Talent provider.** (FACT, §4, §9)
2. **The dynamic engine has never been used by a real user.** `profile_values` has **zero rows** in production; there is no edit form anywhere in `/profile/me` that writes to it. **Decided (§0.5): building that write path is now P0**, and it is the single piece of engineering every other MVP gap depends on. (FACT, §12)
3. **"Model" is not a selectable option at registration**, and registration collects almost nothing beyond identity + one category. **Decided (§0.2, §0.6): registration gets a category-aware onboarding step immediately after account creation, and the `model`/`media_buyers` bugs are fixed in the same pass.** (FACT, §5, §12)

The scope of this launch also grew: **AI Match V1 is now MVP** (§0.3), which means the structured-data gaps in §10 (language, location normalization, content style, physical measurements) are no longer "nice to have before Match exists someday" — they are inputs a 🔴 feature needs at launch. See §15/§18/§19 for the updated architecture, scope, and sequence, and §21 for the final approved flow end to end.

---

## 2. Current Architecture Diagram

```
Registration (app/(auth)/register/page.tsx)
   │  collects: name, email, phone, password, role, ONE category
   ▼
POST /api/profile ──────────────────────────────────────────────┐
   │  writes: profiles (shared), talent_profiles OR              │
   │  brand_profiles (core, via profileService.updateCoreForUser)│
   │  writes: profile_categories (via category.service.ts)       │
   ▼                                                              │
/profile/me (app/(main)/profile/me/page.tsx, 792 lines)          │
   │  reads/writes: profiles + talent_profiles columns directly  │
   │  (ProfileCompletionCard walks 11 hardcoded sections)         │
   │  writes NOTHING to profile_values — no dynamic-field editor  │
   ▼                                                              │
/talent/[handle]  (public, LIVE on the V2 pipeline) ◄─────────────┘
   │
   ▼
profileService.getPublicProfileByHandle(handle)
   │
   ├─► resolveContext()  →  profiles.profile_type_id → profile_types.slug
   │        └─ registry: only "talent" and "brand" have a real provider
   │
   ├─► ctx.provider.getPublicProfile()   (talent.provider.ts)
   │        reads talent_profiles, portfolio_items, reviews, talent_brands
   │        — ONE set of fields for every talent category
   │
   ├─► dynamicProfileService.getSectionsForProfile()
   │        reads profile_sections + profile_fields + profile_values
   │        — profile_values is EMPTY, so this always returns blank dynamic
   │          sections (equipment, awards) for every talent
   │
   └─► dynamicProfileService.getLayout()
            reads profile_layouts (ONE row for "talent", ONE for "brand")
   │
   ▼
DynamicProfileRenderer → DynamicProfileSections → TalentProfileShell
   renders core sections via components/profile/dynamic/adapters/talent.adapter.tsx
   renders dynamic sections via components/profile/dynamic/registry.ts
```

**Key structural fact, now the approved target (§0.1):** the branch point in this pipeline stays `profile_type_id` (talent vs. brand) at the top level. Talent **category** (UGC vs. Model) becomes a **second, narrower branch point inside the talent provider** — filtering which `profile_sections`/`profile_layouts` entries apply — not a new top-level branch. See §15.5 for the target shape.

---

## 3. Current DB Inventory

**44 tables are live** (verified via `GET /rest/v1/` OpenAPI introspection with the service-role key — this reflects exactly what PostgREST currently exposes, not what any migration file claims). Of those, the ones relevant to the profile system:

| Table | Rows (live) | Role | Notes |
|---|---:|---|---|
| `profiles` | 60 | Shared identity, every account | 43 talent, 15 brand, 2 admin |
| `talent_profiles` | 36 | Talent core (typed) | **7 talent-role profiles have no row here** — see §12 |
| `brand_profiles` | 15 | Brand core (typed) | 13 approved, 1 pending, 1 rejected |
| `profile_types` | 3 | V2 registry | talent, brand active; agency seeded inactive. **No `ugc`/`model` row planned (§0.1).** |
| `profile_sections` | 26 | V2 config | 19 talent + 7 brand, see §4 for full list |
| `profile_fields` | 12 | V2 config | equipment(4) + awards(3) + experience(1) + campaign_preferences(4) |
| `profile_layouts` | 2 | V2 config | one row each for talent/brand, `variant='public'` |
| `profile_values` | **0** | V2 user data | **Never written to by any real user.** See §12. |
| `categories` | 14 | Category taxonomy | 7 talent + 7 brand categories |
| `profile_categories` | 47 | Talent/brand ↔ category, many-to-many | 17 fashion, 18 ugc, 12 brand_fashion — **no model** |
| `portfolio_items` | 33 | Portfolio media | Only 7 of 43 talents (16%) have any |
| `talent_brands` | 32 | Past collaborations | |
| `talent_verifications` | 26 | ID + selfie + social proof | 7 approved, 13 pending, 6 rejected |
| `reviews` | 198 | Booking reviews | All 198 are `approved` (moderation queue is empty today) |
| `bookings` | 225 | Pipeline | |
| `jobs` / `job_applications` | 35 / 2 | Job board | |
| `packages` / `package_plans` / `package_features` / `subscriptions` | 51 / 117 / 148 / 5 | **Platform** subscription packages | Different system from `talent_profiles.packages` — see §13.4 |
| `deliverables` | **table does not exist** | — | **PROBLEM, conditional severity — see §0.10 and §13.1** |

**44 live tables, several with zero rows and zero code references** (`job_posts`, `questions`, `answers`, `talents`, `client_profiles`, `contestants`, `disputes`, `favorites`, `votes_ledger`, `reports` — 0 rows each; `contests`=1, `campaigns`=4). A grep of the whole app for `.from("job_posts"|"questions"|"answers"|"talents"|"client_profiles"|"contestants"|"contests"|"campaigns"|"disputes"|"favorites"|"votes_ledger"|"reports")` returns **zero hits outside `category.service.ts` and one admin/seed script** — these tables are dead schema, not wired to any route. (FACT — not in scope to remove, listed for completeness.)

### 3.1 The three parallel "category" mechanisms

1. **`talent_profiles.category`** — a single free-text column, no DB-level FK to anything. Written once at signup, read everywhere in the app (Explore filters, cards, `talent.provider.ts`). This is the one thing the rest of the app actually treats as ground truth today, and it is the column that will carry `ugc`/`model` under the approved Option A.
2. **`categories` + `profile_categories`** — a proper many-to-many taxonomy table, built 2026-07-23, live and wired (`features/categories/services/category.service.ts`), used by: `app/api/profile/route.ts` (signup), the admin categories screen, and Explore's brand-affinity ranking (`getViewerBrandCategory`). `profile_categories.category_id` **does** have a real FK to `categories(id)`.
3. **`profile_types` / `profile_sections`** — a completely different concept (V2's *account kind* registry — talent vs. brand vs. agency), not a category system at all, but named similarly enough to be confused with #1/#2. The `20260806_01_profile_types.sql` migration explicitly warns about this: *"an unrelated `talent_types` table already exists... `profile_types` is a different concept — the kind of ACCOUNT, not the kind of talent. Do not conflate them."* **This distinction is exactly why Option A (§0.1) is the correct fit: category (#1/#2) and profile_type (#3) were always meant to be separate axes — Option A just formalizes that `profile_sections`/`profile_layouts` can be filtered by axis #1/#2 without touching axis #3.**

**PROBLEM, P0 (§0.6):** #1 and #2 can drift. Signup writes both (`app/api/profile/route.ts:95-112`), but `talent_profiles.category` has no FK, so nothing stops it from holding a value `profile_categories`/`categories` rejects — which is exactly what happens with the registration form's `media_buyers` option (§5, §12).

---

## 4. Current Dynamic-Profile Architecture

Full config, straight from the live DB (`profile_sections`, ordered):

| Type | Key | Kind | Weight | Visibility | Standalone component? |
|---|---|---|---:|---|---|
| talent | hero | core | 0 | public | inline (ProfileHero) |
| talent | avatar | core | 15 | public | inline (ProfileHero) |
| talent | personal | core | 10 | public | inline (ProfileHero) |
| talent | categories | core | 10 | public | inline (ProfileHero) |
| talent | social | core | 10 | public | inline (ProfileHero) |
| talent | bio | core | 5 | public | inline (ProfileHero, anchor `#section-about`) |
| talent | physical | core | 10 | public | inline (sidebar) |
| talent | availability | core | 5 | public | inline (sidebar) |
| talent | portfolio | core | 15 | public | **PortfolioSection** |
| talent | packages | core | 10 | public | **PackagesSection** |
| talent | experience | core | 0 | public | **ExperienceSection** |
| talent | usage_addons | core | 10 | public | **UsageRightsSection** |
| talent | **equipment** | **dynamic** | 0 | public | generic `key_value_list` |
| talent | performance | core | 0 | public | **PerformanceSidebar** (stat_grid) |
| talent | **awards** | **dynamic** | 0 | public | generic `timeline` |
| talent | reviews | core | 0 | public | **ReviewsCard** (card_grid) |
| talent | brands | core | 0 | public | **BrandsCard** (chip_list) |
| talent | trust | core | 0 | public | **TrustCard** |
| talent | payment | core | 0 | **admin** | not built ("coming soon") |
| brand | logo/company_info/bio/industry/social/verification | core | — | public | brand adapter |
| brand | campaign_preferences | dynamic | 0 | public | generic `key_value_list` |

Weights sum to exactly 100 for talent (matches `lib/profile-completion.ts` byte-for-byte — the migration comment says this on purpose: *"Weights are seeded to match the existing hardcoded weights... so the Phase 3 engine can reproduce today's scores exactly"*).

### 4.1 Answering the original 11 architecture questions

1. **What is truly dynamic today?** Only `equipment` and `awards` (talent) and `campaign_preferences` (brand) — 3 sections, 12 fields total, backed by `profile_values`. Everything else is `kind='core'`.
2. **What is still hardcoded?** All 19 talent "core" sections resolve through `talent.provider.ts` + `talent_profiles` columns / `social_links` JSONB / `packages` JSONB — not through `profile_values`. The *shape* of what a talent can enter (physical attributes, packages, social links) is 100% hardcoded TypeScript + JSONB, admin-uneditable at the schema level.
3. **Hybrid?** The whole render pipeline is hybrid by design: `mergeSections()` in `profile.service.ts` combines core-provider sections and dynamic sections into one ordered list, dropping a dynamic section if its key collides with a core one.
4. **Which wins on collision?** Core always wins (`mergeSections` logs a warning and drops the dynamic duplicate).
5. **Can Admin create a new profile type and have it render end-to-end?** **Yes, but only as a *generic* type** (`core_table IS NULL`) — `profileConfigService.createType()` never accepts a `core_table`, so anything admin-created has no typed columns and renders through `createGenericProvider`. It **cannot be bookable** — `assertTypeCapabilities()` explicitly rejects `is_bookable=true` for a generic type, because `POST /api/bookings/direct` hard-queries `talent_profiles` directly, bypassing the provider layer entirely. **This is exactly why Option A was approved over a `ugc`/`model` profile-type split (§0.1): a new profile type would have hit this bookability wall.**
6. **Can a user edit dynamic fields through `/profile/me`?** **No.** A repo-wide grep for the dynamic-field write path (`saveValues`, `validateDynamicFields`, `input.dynamic`) inside `app/(main)/**` returns **zero results**. The only code that ever calls `profileConfigService`'s section/field CRUD is the **admin** screen `app/(admin)/admin/profile-config/**`. **This is now the P0 item in §0.5.**
7. **Can layout changes actually affect the public profile?** Yes — `profile_layouts.layout` is read live on every profile view (`dynamicProfileService.getLayout`, 5-minute in-process cache, invalidated on any admin edit). This part works exactly as designed.
8. **What happens when a user's profile type changes?** There is no code path that changes an existing profile's `profile_type_id` after creation — role is set once at signup and `profiles.role` (not `profile_type_id`) still gates everything else (auth, middleware). `profile_type_id` is derived *from* `role` by a DB trigger (`trg_sync_profile_type`) and is treated as read-only downstream. **Not affected by Option A** — category lives on `talent_profiles.category`, which already supports changing after signup.
9. **Are old values left behind?** N/A today — nothing writes dynamic values yet, so there's nothing to strand. Becomes a real question the moment §0.5 ships; the write path must handle a talent switching category (e.g. UGC → Model) by hiding, not deleting, the now-irrelevant dynamic values, consistent with the "sections are never hard-deleted once values exist" rule already in `20260806_03`.
10. **Is profile type assignment safe?** Yes for what exists: the backfill migration verified 0 unmapped non-admin profiles, and the live data confirms it (0 of 43 talent profiles missing `profile_type_id`).
11. **Scalable to UGC / Model / future types without duplicating entire pages?** **Yes, under the approved Option A.** The renderer, layout system, and section/field config are type-agnostic and already support one profile shape rendering many different configured layouts. The remaining engineering is filtering that configuration by category, not building a second pipeline. See §15.5.

---

## 5. Registration → Onboarding → Profile Mapping

Every field the registration form (`app/(auth)/register/page.tsx`) collects today, traced to its destination — this table reflects **current state**; §15.7/§21 describe the approved onboarding addition.

| Registration field | DB destination | Profile section | Public output | AI Match available? |
|---|---|---|---|---|
| Full name | `profiles.full_name` | Hero (inline) | ✅ | ✅ (identity, not match-relevant) |
| Email | `auth.users.email` only | — | never shown | — |
| Phone | `profiles.phone_number` | not rendered publicly | — | — |
| Password | `auth.users` (hashed) | — | — | — |
| Role (talent/brand) | `profiles.role` → `profile_type_id` | drives which provider | — | ✅ (type filter) |
| **Talent type** (`ugc`/`influencer`/`fashion`/`food_reviewer`/`media_buyers`) | `talent_profiles.category` (free text) **and** `profile_categories` (FK'd) | `categories` (inline, Hero) | ✅ badge on card + profile | ✅ — but see PROBLEM below |
| Brand category | `brand_profiles.category_id` + `profile_categories` | Industry (inline) | ✅ | ✅ |
| Terms checkbox | not persisted | — | — | — |

**PROBLEM, P0 (§0.6):** the form's `TALENT_TYPES` constant is `["ugc","influencer","fashion","food_reviewer","media_buyers"]`. Compare to the live `categories` table: `ugc, influencer, fashion, food_reviewer, tech_reviewer, unboxing, host`. `media_buyers` is not a row in `categories`. `setProfileCategories()` inserts into `profile_categories`, whose `category_id` column has a hard FK to `categories(id)`. **A talent who registers as "Media Buyers" will fail the `profile_categories` insert** — the route catches this and returns a 500, but `profiles`/`talent_profiles` were already written in the step before, so **the account is left half-created**. This exact failure mode is called out by name in §0.6 as a P0 fix (prevent partial account creation on category failure), separate from simply adding the missing category.

**PROBLEM, P0 (§0.6):** **`model` is not in `TALENT_TYPES` at all.** A user cannot select "Model" at signup. Confirmed by data: 0 of 36 `talent_profiles` rows carry any Model-shaped category value (only `fashion` and `ugc` exist in the live category distribution).

### 5.1 What registration does NOT collect today — superseded by §0.2

Everything beyond identity + one category — avatar, bio, social links, physical attributes, packages, usage rights, portfolio, equipment, awards, experience — is currently entered **only** on `/profile/me`, with no onboarding step in between. The original audit treated this as an acceptable, intentional gap (PRODUCT.md's 30-second-signup promise). **That framing is superseded by §0.2**: fast account creation is still the right first step, but it must now be immediately followed by category-aware professional onboarding that captures the match-critical structured attributes (§0.4) before the talent ever reaches a general-purpose `/profile/me` edit screen. See §15.7/§21 for the approved flow.

---

## 6. Current UI / Rendering Flow

### 6.1 `/talent/[handle]` (canonical public profile) — confirmed LIVE on the V2 pipeline

`page.tsx` → `profileService.getPublicProfileByHandle()` → `TalentProfileShell` → `DynamicProfileRenderer`. Section display order (from the live `profile_layouts` row for `talent`/`public`):

```
Hero (chrome, always present): avatar, personal, categories, social, physical, availability, bio-anchor
Tab bar (only sections present in TAB_LABELS get a tab): Overview(bio) · Photos&Video(portfolio) · Experience · Packages&Prices · Usage Rights
main:    bio(anchor) → portfolio → experience → packages → usage_addons → equipment → awards
sidebar: performance → reviews → brands → trust
mainFooter (chrome): StickyBookingBar
sidebarFooter (chrome): BriefCard, QuestionCard
```

Every section is dropped server-side if empty (`ctx.provider.hasContent()`), so a bare-minimum profile (avatar + name only) renders a short page, not a skeleton of empty cards. This is the intended, documented behaviour (CLAUDE.md "Dynamic Public Profiles" section) and matches what live code does. Under Option A, this same mechanism is what will hide, e.g., Model's "Physical details" section for a UGC creator, and UGC's "Content styles" section for a Model — see §15.5.

### 6.2 `/profile/[username]` — confirmed DEAD DUPLICATE (known, pre-existing debt, not new)

Still imports the **old, hardcoded** `TalentModelProfile.tsx`, which has `dir="rtl"` hardcoded on its root `<main>` — **a real bug**: any visitor to this route in English mode gets forced RTL layout regardless of language toggle. `TalentProfileShell` (the live component) fixed this (`dir={lang === "en" ? "ltr" : "rtl"}`). This route is orphaned per CLAUDE.md §12 known debt #1; the RTL regression inside it is a new, specific detail this audit adds to that already-known item.

### 6.3 `/profile/me` (792-line client component, own edit surface)

Reads/writes `profiles` + `talent_profiles` columns directly via its own API calls — **does not go through `profileService`, `dynamic-profile.service.ts`, or the V2 validation path at all.** It is a separate, older code path that happens to write to the same tables the V2 read-side now serves from. This is safe (same tables, same shape) but means **the write side of the profile system has not migrated to V2** — only reads have. **§0.5 makes closing this gap P0.**

### 6.4 Explore card (`app/(main)/explore/_components/ExploreGrid.tsx`)

Reads `PublicTalentCard` (a separate, simpler transformer — not the V2 DTO). Shows: avatar, name, verified badge, category (single, from `talent_profiles.category`), location, up to 2 specialties, rating, starting price. **Does not read anything from `profile_values`** — a future dynamic field would need its own plumbing into `features/talent-profile/services/public-talents.service.ts` to ever reach the card. Not required for MVP Match (Match reads structured profile data directly, not the card).

---

## 7. UGC Creator — Current-State Matrix

| Area | Currently exists? | Where | Notes | MVP-required by §0.4? |
|---|---|---|---|---|
| Name, avatar, handle | ✅ | `profiles` | | — |
| Verified badge | ✅ | `profiles.is_verified` | Platform-wide, not category-specific | — |
| Creator type / category | ⚠️ partial | `talent_profiles.category` = `"ugc"` | Single value, not a UGC-specific taxonomy | ✅ already structured |
| Location | ✅ | `profiles.city` | Free text | ✅ — needs light normalization, see §10 |
| Languages | ⚠️ | `social_links.languages` (JSONB, unstructured) | Not searchable/filterable at the DB level | ✅ — must structure for Match V1 |
| Availability | ✅ | `talent_profiles.availability` | Enum-like text, no calendar | ✅ — sufficient as-is for "available now" style match |
| Rating | ✅ | `talent_profiles.avg_rating` (trigger-maintained) | | ❌ excluded from Match V1 (§10) |
| Content specialties / skills | ❌ | — | Only the single `category` + free-text `specialties[]` array exist; no UGC-specific skill taxonomy | ✅ — smallest controlled list, not full taxonomy |
| Content styles (unboxing, talking-to-camera, tutorial, etc.) | ❌ | — | **Does not exist anywhere.** Must be product-defined, not inferred from current code. | ✅ — required for the "Talking to camera" explanation example in the brief |
| Equipment | ⚠️ built, unreachable | `profile_fields` (camera_body, lenses, owns_studio, lighting_kits) | Schema exists (§4), zero rows, no edit UI (§4.1 Q6) | ⚠️ "where relevant" per §0.4 — not universally required |
| Portfolio | ✅ | `portfolio_items` | Generic image/video list, no content-style tagging | Tagging needed for Match (§0.7) |
| Previous brands / campaigns | ✅ | `talent_brands` | Text-only | — |
| Packages / pricing | ✅ | `talent_profiles.packages` (JSONB) | Live, used | — |
| Usage rights add-ons | ✅ | `social_links.usage_addons` | Live | — |
| Booking CTA | ✅ | `BriefCard` / `StickyBookingBar` | Live | — |
| Verification | ✅ | `talent_verifications` | ID + selfie + social proof, admin-reviewed | — |
| Reviews | ✅ | `reviews` (198 rows, all approved) | | ❌ excluded from Match V1 (§10) |

---

## 8. Model — Current-State Matrix

| Area | Currently exists? | Where | Notes | MVP-required by §0.4/§0.8? |
|---|---|---|---|---|
| Name, avatar, handle | ✅ | `profiles` | Same as any talent | — |
| Model type/category | ❌ | — | **`model` is not a valid category value anywhere** | ✅ P0 registration fix (§0.6) |
| Height, clothing size, shoe size, hair color, eye color | ⚠️ | `social_links` JSONB: `height, weight, hair_color, shoe_size, age` | No `eye_color`, no clothing size at all. Unstructured, unsearchable. `age_group`/`guardian_name` columns exist on `talent_profiles` but are unused by any code path found. | ✅ — see §9.1 for the approved minimal structured representation |
| Portfolio (headshots / full body / fashion / beauty / editorial) | ❌ tagging | `portfolio_items` | Same generic media list as UGC — **zero visual-category tagging exists** | ✅ tagging required (§0.7) |
| Previous shoots / campaigns / brands | ✅ | `talent_brands` | Same shared mechanism as UGC — text-only | — |
| Verification | ✅ | `talent_verifications` | Shared mechanism | — |
| Packages / booking | ✅ | `talent_profiles.packages` | Shared mechanism | — |

**Model is not "UGC with different labels."** The talent schema was built talent-category-agnostic on purpose (one `category` string), which is fine for browsing, but has no room today for Model-specific structured fields. Under the approved Option A this is solved the same way as UGC's content styles: category-scoped dynamic sections on the same `talent` provider, not a new profile type.

---

## 9. Core vs. Dynamic Decision Matrix

| Attribute | Recommendation | Why |
|---|---|---|
| Talent category (ugc/model/…) | **CORE (typed)** — already is (`talent_profiles.category`) | Drives booking eligibility, Explore filtering, matching, and is now the field Option A filters sections/layout by. Must stay a fast, indexed, typed column. |
| Money: packages, prices, usage-rights add-on prices | **CORE** — already is | Business rule from PRODUCT.md: never move pricing into `profile_values`. |
| Verification status | **CORE (relational)** — already is (`talent_verifications`) | Trust/moderation workflow, admin-reviewed, must stay auditable and typed. |
| Ratings, review counts, booking counts | **DISPLAY ONLY / DERIVED** — already is | Trigger-maintained, never hand-edited, and explicitly excluded from Match V1 (§10). |
| Portfolio items | **SEPARATE RELATIONAL ENTITY** — already is (`portfolio_items`) | Approved to stay one table (§0.7); only needs a category-appropriate tag column added, not a new subsystem. |
| Content style tags (UGC) | **DYNAMIC STRUCTURED FIELD**, `multi_select`, category-scoped to `ugc` | Configurable, matching-relevant, no independent business workflow — same shape as `equipment.lenses` today. MVP-required (§0.4). |
| Equipment (camera, lenses, studio) | **DYNAMIC** — already is, correctly, category-scoped to where it's relevant | Matches "useful for matching, no business workflow." §0.4 marks it MVP "where relevant" — not required for every UGC sub-type. |
| Physical measurements (height/weight/shoe size/hair/eye color) | **DYNAMIC STRUCTURED FIELDS, category-scoped to `model`** — **APPROVED (§0.8), see §9.1** | Not money, not booking-eligibility, but the primary Model filter/match criteria. The dynamic engine's `number`/`select` field types are exactly the right shape; no new core columns needed. |
| Languages | **DYNAMIC STRUCTURED FIELD** (`multi_select`), shared across all talent categories | Matching-relevant, no workflow. MVP-required (§0.4) — currently a free-text blob, must move before launch. |
| Location | **CORE, lightly normalized** — `profiles.city` stays, but Match V1 needs a controlled value set, not a new subsystem | See §9.1 for the smallest-viable approach. |
| Availability | **CORE** — already is | Drives booking eligibility. Sufficient as-is for MVP Match's "available this week" style explanation. |
| Awards | **DYNAMIC** — already is, correctly | Purely presentational, admin-configurable, not MVP-required for Match. |
| Experience/timeline | **CORE today** — low-priority cleanup candidate (§13.2), not a blocker | Unaffected by any §0 decision. |

### 9.1 Approved minimal structured representation for Model physical data (§0.8)

Deliberately the smallest controlled shape that makes deterministic Match V1 possible — not a full measurement system:

- `height_cm` — `number` dynamic field, category-scoped to `model`
- `weight_kg` — `number` dynamic field, category-scoped to `model`
- `shoe_size_eu` — `number` dynamic field, category-scoped to `model`
- `hair_color` — `select` dynamic field with a short admin-managed option list (reuses the `field_type='select'` + `options jsonb` shape already in `profile_fields`)
- `eye_color` — `select` dynamic field, same shape (does not exist today — new field, existing mechanism)
- Clothing size — **explicitly deferred**: no controlled international-size taxonomy is defined anywhere in the codebase or this audit, and inventing one would violate the "do not invent taxonomy" instruction. Flag for a product decision before building; not required to make Match V1 deterministic on the five fields above.

All five use the existing `profile_fields.field_type` vocabulary (`number`, `select`) — no schema change beyond adding rows to `profile_sections`/`profile_fields` (config data, not a migration to the table shape) and category-scoping them to `model`.

---

## 10. AI Match Data Readiness Matrix — now an MVP requirements list, not a future-readiness check

Per §0.3/§0.4, AI Match V1 is 🔴 MVP. This table is now read as "what must be structured before launch," not "what would be nice someday."

| Match attribute | Registration/onboarding source | DB source | Structured today? | MVP action |
|---|---|---|---|---|
| Talent type (talent/brand) | role toggle | `profiles.profile_type_id` | ✅ | none — already match-ready |
| Category (ugc/model/fashion/…) | category-aware onboarding (§0.2) | `talent_profiles.category` + `profile_categories` | ✅ | fix `model`/`media_buyers` (§0.6); otherwise ready |
| Specialty/skills | onboarding | `talent_profiles.specialties text[]` | ⚠️ free-text array | Smallest fix: constrain to an admin-managed controlled list at the UI layer (dynamic `multi_select`), not a new table |
| Language | onboarding (new) | move to `multi_select` dynamic field | ❌ today | **Build before launch** — currently unstructured JSONB |
| Location | city (existing) | `profiles.city`, lightly normalized | ⚠️ free text | **Build before launch**, smallest viable: a short admin-managed city list for the launch market(s), not a geocoding system |
| Content style (UGC) | onboarding (new) | new `multi_select` dynamic field, category-scoped to `ugc` | ❌ today | **Build before launch** — taxonomy is a product decision, not invented here |
| Equipment | onboarding, where relevant | existing `profile_fields`/`profile_values` (equipment section) | ✅ schema, ❌ data | Needs the P0 write path (§0.5) to ever collect real data; not universally required per talent |
| Physical measurements (Model) | onboarding (new) | new dynamic fields, category-scoped to `model` (§9.1) | ❌ today | **Build before launch** |
| Availability | onboarding/`/profile/me` | `talent_profiles.availability` | ⚠️ free text | Sufficient for MVP Match as a simple filter; calendar precision is post-MVP |
| Verification | admin-only | `talent_verifications.status` | ✅ | none |

**Excluded from Match V1 by design** (unchanged from the original audit, reaffirmed): rating/review count (popularity ≠ fit, and mixing it in starves new talents of first bookings), `is_featured` (a placement signal, not a fit signal), raw follower counts (unverified, gameable).

**What this means for §19's sequence:** the dynamic write path (§0.5) and the five/six new structured fields above are not separable work — Match V1 cannot read data that has nowhere to be written and no form to collect it.

---

## 11. Profile Completion Readiness — category-aware completion is now in scope for MVP (§0.9)

`lib/profile-completion.ts` — the single source of truth, unchanged since before V2, deliberately reused byte-for-byte by `talent.provider.ts` ("scores cannot regress").

- **11 sections, weights sum to 100:** avatar(15) personal(10) bio(5) categories(10) social(10) portfolio(15) physical(10) packages(10) usage_addons(10) availability(5) payment(0, "coming soon"). This stays the shared baseline for any talent.
- **Not category-aware today.** A Model with perfect physical data but no packages configured scores the same as a UGC creator missing the same section. **§0.9 changes when this gets fixed, not what's wrong with it** — it moves from "post-300-talents polish" into the UGC/Model implementation itself.
- **Registration-completed fields count:** yes, `categories` (10 pts) is satisfied the moment signup finishes.
- **Dynamic fields (`equipment`/`awards`) do not count at all today** — both seeded at `weight: 0` on purpose so activating the engine doesn't move anyone's score. **The moment §0.5's write path ships and UGC/Model dynamic sections get real weights, this assumption needs a deliberate, one-time weight decision** — not automatic.
- **Portfolio counts** at first item, with a separate non-scoring `progress` ratio for display only.
- **Verification does NOT count toward completion score** — a fully separate gate.
- **Gates exist but stay unenforced per §0.9** — `COMPLETION_THRESHOLDS` (apply to jobs ≥50, appear in search ≥60, receive briefs ≥70, become verified ≥80) are computed, returned with `enforced: false`, and nothing checks them. **This audit's instruction is explicit: do not enforce these yet unless separately approved.** Only the *scoring differentiation* between UGC and Model is now in scope, not gating behavior.

**APPROVED DIRECTION (was RECOMMENDATION):** UGC and Model each get their own weight table, built the same way `talent.provider.ts` already supplies one weight table today — the engine already supports per-provider weights; this becomes per-category weights within the same provider, decided alongside the sections themselves in §16/§17. Not a separate post-launch project.

---

## 12. Data-Quality Findings (aggregate counts only, no user data reproduced)

All counts below are from live, read-only queries against `kjtppolajcwoovrwnoqs` at audit time. Unchanged since the original audit — re-run after onboarding ships (§19 step 8).

| Check | Result |
|---|---:|
| Profiles by role | talent 43, brand 15, admin 2 (total 60) |
| Profiles missing `profile_type_id` (non-admin) | **0** — backfill fully succeeded |
| Talent-role profiles with no `talent_profiles` row | **7** (`and`, `ahmed`, `bstalent8`, `test1`, `andrewsherif20131`, `a123`, `iamugc`) — look like test/QA accounts, but are real broken records |
| `talent_profiles.category` distribution | `fashion` 17, `ugc` 19 — **no `model`, no other category ever used** |
| `profile_categories` distribution | `fashion` 17, `ugc` 18, `brand_fashion` 12 (sums to the live 47-row total) |
| `profile_values` rows | **0** — the dynamic engine has never been used |
| `profile_sections` orphan layout keys | 0 |
| `profile_layouts` rows | 2 (talent, brand) — no orphans, no duplicates |
| Talent approval status | approved 31, pending 2, suspended 3 (of 36) |
| Brand approval status | approved 13, pending 1, rejected 1 (of 15) |
| Reviews | 198, **all** `approved` — moderation queue is empty |
| Verifications | 26 total: approved 7, pending 13 (half!), rejected 6 |
| Talents with ≥1 portfolio item | **7 of 43 (16%)** — the large majority of talent profiles are visually empty |
| `deliverables` table | **does not exist live** — see §0.10 for the now-conditional severity, §13.1 for detail |
| `job_posts`, `questions`, `answers`, `talents`, `client_profiles`, `contestants`, `disputes`, `favorites`, `votes_ledger`, `reports` | 0 rows each, 0 code references outside one seed script — dead schema, unaffected by any §0 decision |

---

## 13. Technical Debt / Duplication (beyond what CLAUDE.md already tracks)

1. **`deliverables` table is documented as existing and does not exist live.** The migration that would create it (`20260727_fix_schema_drift.sql`) is explicitly marked, in a later migration's own comment, as **"never applied to this project."** Severity is now conditional per §0.10 — see below.
2. **`bio` is duplicated between `profiles.bio` and `talent_profiles.bio`.** Both live columns; `calculateCompletion` already tolerates the duplication rather than resolving it. Low urgency.
3. **Registration's `TALENT_TYPES` list has drifted from the `categories` table** (§5) — P0 per §0.6.
4. **Two unrelated things are both called "packages"** — `talent_profiles.packages` (JSONB, what a talent sells) vs. `packages`/`package_plans`/`package_features`/`subscriptions` (a **platform** subscription-tier system, live with 51/117/148/5 rows, wired into `/pricing`). PRODUCT.md §19 states this platform-package system is *"NOT BUILT"* — that statement is stale; the schema, seed data, and subscriber-count service are live. Not a bug, but worth fixing so UGC/Model pricing work doesn't collide with it by accident.
5. **The V2 admin config screens are the only place the dynamic engine's write path is exercised at all today** — §0.5 changes this.

### 13.1 `deliverables` — conditional launch risk (§0.10)

Restating the instruction explicitly, since it changes how this item should be triaged:

- **If MVP processes real payments, escrow, or revisions:** the missing `deliverables` table is a **launch blocker**. The booking pipeline's "talent submits work" step 404s in production today, and any flow that promises a brand a deliverable review cannot ship without it. A full booking/deliverables audit becomes required before launch.
- **If MVP does not move real money yet:** this is a **separate sprint**, tracked independently, and must **not** block UGC/Model profile work. Nothing about the profile system depends on `deliverables` existing.

This audit does not know which of the two is true for this launch — that determination belongs to whoever owns the payments/booking decision, not this document.

---

## 14. MVP Gaps (UGC + Model, consolidated and re-prioritized against §0)

1. **Category-scoped sections/fields/layout inside the Talent provider** (§4.1 Q11, §9, §15.5) — the mechanism Option A requires; now the first build item, not an open question.
2. **`model` is not a registrable category, and `media_buyers` is broken** (§5, §8, §12) — P0 registration fix.
3. **No content-style taxonomy for UGC portfolio** — product-definition gap; needed before §16 can be built.
4. **No structured physical-measurement fields for Model** (§8, §9.1) — approved minimal shape given, not yet built.
5. **The dynamic engine's write path doesn't exist on `/profile/me`** (§4.1 Q6, §6.3) — P0, blocks every category-scoped dynamic section from ever being usable.
6. **No content-style / visual-category tagging on `portfolio_items`** (§7, §8) — needed for both Match V1 and visual presentation.
7. **Onboarding does not exist as a distinct step** (§5.1, §0.2) — registration jumps straight to a generic `/profile/me`; the approved flow inserts category-aware onboarding between them.
8. **Completion scoring has no category awareness** (§11) — now scoped into the UGC/Model build itself, per §0.9.
9. **`talent_profiles.category` and `profile_categories` can silently drift** (§3.1) — P0 per §0.6.
10. **Language and location are unstructured** (§10) — now MVP-blocking because Match V1 is MVP.

---

## 15. Recommended Target Architecture

**Reuse verdict unchanged: no rewrite.** The V2 provider/registry/dynamic-section/layout system is correctly built, tested, and live. The work is entirely in configuring category-scoping on top of it and building the one missing write path.

### 15.1 Shared foundation (both UGC and Model use, unchanged)

- `profiles` (identity), `profile_types`/`registry` (talent provider, unchanged — **no new provider added**, per §0.1), `talent_profiles` (core: category, specialties, availability, packages, social_links), `portfolio_items`, `talent_brands`, `talent_verifications`, `reviews`, the whole booking pipeline, `DynamicProfileRenderer`/`DynamicProfileSections`/layout system, `profile_sections`/`profile_fields`/`profile_values` mechanism itself.

### 15.2 UGC-specific data

- Content style tags (product must name the taxonomy)
- Equipment (already built — needs an edit form + real usage, where relevant)
- Language, specialty/skills (shared mechanism, UGC and Model both use it — see §15.1)

### 15.3 Model-specific data

- Physical measurements per §9.1 (height, weight, shoe size, hair color, eye color — clothing size deferred pending taxonomy)
- Portfolio visual-category tag (headshot/full-body/fashion/beauty/editorial/commercial/lifestyle) — taxonomy is a product decision

### 15.4 Core relational systems (no change recommended)

Portfolio (`portfolio_items` — add a tag column, don't rebuild the table, per §0.7), availability (`talent_profiles.availability` — fine for MVP), reviews (unchanged), verification (unchanged).

### 15.5 APPROVED — category-scoped dynamic sections inside the Talent provider (was §15.5 OPEN DECISION, now decided per §0.1)

**Mechanism:** the same `profile_type = talent`, one provider (`talent.provider.ts`), one registry entry. What's new: `profile_sections` (and, where a layout differs, `profile_layouts`) gain a way to say "this section only applies when `talent_profiles.category` is `X`" — the smallest version of this is a nullable `category_scope text[]` (or similar) column on `profile_sections`, filtered at the same point `dynamicProfileService.getSectionsForProfile()` already filters by `visibility`. A `NULL`/empty scope means "applies to every talent category," which is how every existing section (portfolio, packages, reviews, etc.) keeps working unchanged.

**Why this is the approved direction, restated from the original audit's lean (now confirmed, not just recommended):**
- Zero change to the booking pipeline — `POST /api/bookings/direct` and `talent.provider.ts:resolveBookingTarget` keep hard-querying `talent_profiles` exactly as today, because there is still only one talent provider.
- Zero new registry entry, zero new provider file, zero risk to the 79 existing passing tests' assumptions about the type registry.
- Fully reversible: clearing the scope column is a no-op rollback, same reversibility discipline as every V2 migration to date.
- Matches how `profile_categories`/`categories` (a real many-to-many taxonomy) already coexists with `profile_types` (an account-kind registry) as two genuinely separate axes (§3.1) — this was always the intended shape, Option A just extends the *rendering* layer to respect the axis that already exists in the *data* layer.

**Explicitly rejected direction:** a `profile_types` row per category (`ugc`, `model`, …). Rejected because it would require a second provider file per category and — critically — would not automatically follow through the booking pipeline's direct `talent_profiles` query, creating a split-brain between "what type is this profile" and "what type can be booked."

### 15.6 Dynamic system responsibilities for Admin

Already fully built and correct: create/edit/reorder sections and fields per type, enable/disable, layout editing, audit log on every config change. **Extends naturally to category-scoping** — the admin section/field editor gains one more optional input (which categories a section applies to), not a new screen.

### 15.7 Registration → Onboarding mapping (approved, §0.2)

- Registration stays fast: name, email, phone, password, role, category (fixed to include `model`, with `media_buyers` resolved — §0.6).
- Immediately after account creation, before `/profile/me`'s general editor, a **category-aware onboarding step** collects the MVP-required structured attributes for that specific category (§0.4): for UGC — content styles, languages, equipment where relevant; for Model — physical measurements (§9.1), languages, portfolio visual-category on first upload.
- Onboarding **writes through the same P0 dynamic path** (§0.5, §15.8) — `profile_sections → profile_fields → generated form → validation → profile_values` — so nothing collected here is a second, parallel data store the real profile has to reconcile with later. This directly satisfies "the user must not re-enter the same data."

### 15.8 The P0 dynamic write path (§0.5)

```
profile_sections (category-scoped, §15.5)
      │
      ▼
profile_fields (existing field_type vocabulary: text/number/boolean/select/multi_select/media/json)
      │
      ▼
Generated category-aware form
      — one generic form renderer driven by field_type, not a hand-built
        UGC form and a separate hand-built Model form
      — category-specific PRESENTATION components are fine where the visuals
        genuinely differ (e.g. a photo-grid picker for portfolio tagging vs.
        a plain select for hair color) — the DATA path stays one mechanism
      │
      ▼
Validation (dynamicProfileService.validate — already built, already used by
      the admin config screens' underlying schema; just needs a caller from
      the talent-facing form)
      │
      ▼
profile_values (already built, already RLS-protected, already indexed for
      both scalar-equality and array-containment queries)
      │
      ▼
DynamicProfileRenderer (already built, already live, already drops empty
      sections automatically)
```

Every box except "Generated category-aware form" already exists and is tested. That form — and the `/profile/me` (or onboarding-screen) integration that calls `validate`/`saveValues` — is the one genuinely new piece of engineering this whole audit identifies.

### 15.9 Public renderer

Unchanged from the original audit's finding: already supports "one renderer, many layouts." Under Option A it needs exactly one addition — filtering `profile.sections` by the viewing profile's category before handing them to `DynamicProfileSections`, using the same `category_scope` data introduced in §15.5.

---

## 16. Proposed UGC MVP Sections (display order) — PROPOSAL, not yet built

Based on the manager's reference for information architecture only (not visual design), mapped onto sections the current engine can already render or could render with category-scoped dynamic sections:

1. Hero (avatar, name, handle, verified badge, "UGC Creator" type label, location, languages, availability) — existing inline core; languages/location now MVP-structured per §10
2. Bio (existing core)
3. Categories / specialties (existing core)
4. **Content styles** (NEW, category-scoped dynamic section — taxonomy is a product decision, MVP-required per §0.4)
5. Portfolio (existing core — needs content-style tagging per item, §0.7)
6. Equipment (existing dynamic section, category-scoped — needs the §15.8 edit form; MVP "where relevant" per §0.4)
7. Experience (existing core)
8. Packages & pricing (existing core)
9. Usage rights (existing core)
10. Brands / past collaborations (existing core)
11. Reviews (existing core)
12. Trust / verification (existing core)

## 17. Proposed Model MVP Sections (display order) — PROPOSAL, not yet built

1. Hero (avatar, name, handle, verified badge, "Model" type label, location, availability)
2. Bio (existing core)
3. **Physical details** (NEW, category-scoped dynamic section — height/weight/shoe size/hair color/eye color per §9.1; clothing size deferred)
4. Categories / specialties (existing core — "fashion," "commercial," "editorial" etc. as values, not a new mechanism)
5. **Portfolio with visual-category tagging** (headshot/full-body/fashion/beauty/editorial/commercial/lifestyle — NEW tag, taxonomy is a product decision, MVP-required per §0.4/§0.7)
6. Experience / past shoots (existing core)
7. Packages & pricing (existing core)
8. Usage rights (existing core)
9. Brands / past campaigns (existing core)
10. Reviews (existing core)
11. Trust / verification (existing core)

Both lists deliberately keep the same skeleton (bio → identity data → portfolio → commercial → social proof → trust) — this is Option A in practice: 9 of 11–12 sections per category are the exact same component, same section key, same completion mechanics. Only 2–3 sections per category are genuinely category-scoped, and both category-scoped sections resolve through the same §15.8 write path and the same `DynamicProfileRenderer`.

---

## 18. 🔴 / 🟡 / 🟢 Scope Classification (revised per §0)

**🔴 MVP before founding-creators launch**
- Add `model` to registration + `categories`; fix/remove `media_buyers`; prevent partial-account creation on category failure (§0.6, §5, §15.7)
- Category-scoped `profile_sections`/`profile_layouts` mechanism inside the existing Talent provider (§0.1, §15.5) — approved, not optional
- Category-aware onboarding step between registration and `/profile/me` (§0.2, §15.7)
- The dynamic write path (§0.5, §15.8) — generated category-aware form → validation → `profile_values`
- **AI Match V1**, built on structured/explainable attributes, no scoring algorithm designed here (§0.3)
- Structured versions of: category (already done), specialties/skills, languages, location, content styles (UGC), equipment where relevant, availability (already core), Model physical attributes (§9.1) — the full list in §0.4/§10
- Portfolio content-style / visual-category tagging (§0.7) — one column + a product-defined taxonomy, for both categories
- Category-aware Profile Completion weighting (§0.9, §11) — scoring only, not gate enforcement
- Reconcile `talent_profiles.category`/`profile_categories` drift risk (§0.6, §3.1)

**🟡 After 100–300 talents**
- Advanced AI Matching (scoring refinement, learned ranking) — explicitly still 🟡 per §0.3
- Enforcing `COMPLETION_THRESHOLDS` gates — stays unenforced unless separately approved (§0.9)
- Deeper location normalization (geocoding, region hierarchies) beyond the smallest-viable list in §10
- Cleaning up the `bio` duplication and `experience`'s core/dynamic routing oddity (§13.2, §9)

**🟢 After product-market fit**
- The AI Match scoring **algorithm** itself (still explicitly out of scope for design, per §0.3's own instruction)
- Advanced performance analytics, "Top Content Types," career timelines, reputation graphs
- Agency profile type (Phase 5, already scaffolded inactive)
- Dead schema cleanup (`job_posts`, `questions`, `answers`, `talents`, `client_profiles`, `contestants`, `disputes`, `favorites`, `votes_ledger`, `reports`)

**Conditional — not fixed to a color, per §0.10**
- `deliverables` table / booking-pipeline gap (§13.1): 🔴 **if** MVP processes real payments/escrow/revisions; otherwise a separate sprint, explicitly not blocking UGC/Model work.

---

## 19. Recommended Implementation Sequence (revised)

1. **Fix registration** (`model` + `media_buyers` + partial-account prevention, §0.6) — small, independent, unblocks real signups immediately.
2. **Land the category-scoping mechanism** (§15.5) — one config column, one renderer filter. Nothing else in this list can be built correctly before this exists, because every subsequent item needs to know whether it's UGC-only, Model-only, or shared.
3. **Define the two taxonomies** (UGC content styles, Model portfolio visual categories, and confirm the §9.1 physical-attribute option lists) — product decision, blocks §5 below.
4. **Build the P0 dynamic write path** (§15.8) — the generated category-aware form, wired to the existing `validate`/`saveValues` calls. This is the single largest piece of net-new engineering in the whole plan.
5. **Build category-aware onboarding** (§15.7) using the write path from #4, inserted between registration and `/profile/me`.
6. **Land the new structured fields**: Model physical attributes (§9.1), UGC content styles, languages (shared), location normalization (shared), portfolio tagging (both) — all flow through #4/#5, so they can land incrementally per field rather than as one big-bang change.
7. **Wire category-aware completion weighting** (§0.9) alongside #6, once the category-scoped sections exist to weight.
8. **Confirm AI Match V1's data contract is satisfiable** — every attribute in §10's MVP-action column has a real value in `profile_values`/`talent_profiles` for a representative UGC and Model test profile. **Do not design or build the scoring algorithm** — that is explicitly out of scope for this audit and, per §0.3, a separate decision even though the *data readiness* is MVP.
9. **Separately, resolve the §0.10 conditional**: confirm with whoever owns payments/booking whether `deliverables` is a launch blocker for this specific MVP, and schedule accordingly — do not let this block steps 1–8.
10. Re-run this audit's data-quality queries (§12) after real UGC/Model profiles exist, to confirm `profile_values` is no longer empty and `model` appears in `talent_profiles.category`.

---

## 20. Decisions

### KEEP
- The entire V2 provider/registry/renderer/layout architecture (`features/profiles/**`, `components/profile/dynamic/**`) — correctly built, tested, live, and the approved foundation for UGC/Model under Option A.
- `profile_sections`/`profile_fields`/`profile_values`/`profile_layouts` schema shape — the primitives (`text/number/boolean/select/multi_select/media/json`, visibility, weight) already cover everything §16/§17 need, plus the new `category_scope` addition in §15.5.
- The core-vs-dynamic split as it stands for money, verification, ratings, portfolio-as-a-table, packages.
- The admin config screens (`profile-config`) — fully functional; extends naturally to category-scoping.
- `/talent/[handle]`'s render path end-to-end.
- Single `profile_type = talent` for all talent categories (§0.1) — explicitly reaffirmed, not just left alone.

### FIX BEFORE BUILDING PROFILES
- Registration's talent-type list (`model` missing, `media_buyers` broken, partial-account risk) — §0.6, §5, §15.7.
- The dynamic-field write path on `/profile/me`/onboarding — §0.5, §15.8. No longer "blocks any new dynamic section" as a future risk — it is now the literal first engineering task.
- `talent_profiles.category` / `profile_categories` drift risk — add validation or an FK before more category values exist.
- The category-scoping mechanism itself (§15.5) — must exist before either UGC's or Model's category-specific sections can be built at all.

### CHANGE DURING UGC/MODEL IMPLEMENTATION
- Physical-measurement structuring for Model (§9.1, §17).
- Portfolio content-style/visual-category tagging for both (§16, §17, §0.7).
- Category-specific completion weighting (§0.9, §11) — lands alongside the sections themselves, not deferred.
- Language and location structuring (§10) — required because Match V1 is now MVP, lands alongside the onboarding build.
- The `bio` duplication and `experience`'s core-routing oddity (§13.2, §9) — low-risk cleanups, natural to fold in while those exact files are open.

### DEFER
- The AI Match **scoring algorithm** (data readiness is MVP per §0.3; the algorithm itself is explicitly not designed here and stays a separate decision).
- Advanced/learned AI Matching refinements — 🟡.
- Completion-**gate enforcement** (`COMPLETION_THRESHOLDS`) — stays unenforced unless separately approved (§0.9); only scoring differentiation is MVP.
- Agency profile type / Phase 5.
- Advanced analytics, career timelines, reputation systems, AI career coach.
- Dead schema cleanup — zero risk sitting unused.
- `deliverables` table / booking-pipeline gap — **conditional**, not deferred outright: see §0.10 and §13.1 for the exact trigger that promotes this to a launch blocker.

---

## 21. Approved MVP Profile Architecture

Final end-to-end flow, as approved:

```
Registration
   → Category-aware Onboarding
      → Structured Profile
         → Profile Completion
            → Public Professional Profile
               → AI Match V1
                  → Job / Campaign
                     → Application / Booking
```

Mapped to what this audit found and decided:

- **Registration** — fast account creation, fixed to offer `model` and to never leave a half-created account on category failure (§0.6).
- **Category-aware Onboarding** — new step (§0.2, §15.7), writes through the same dynamic engine every other write in the system uses (§0.5/§15.8) — never a parallel data store.
- **Structured Profile** — `talent_profiles` (core) + category-scoped `profile_sections`/`profile_fields`/`profile_values` (dynamic), rendered by the unchanged `DynamicProfileRenderer` filtered by the new category scope (§15.5).
- **Profile Completion** — category-aware weighting (§0.9), scoring only, gates stay unenforced.
- **Public Professional Profile** — `/talent/[handle]`, already live on this exact pipeline (§6.1) for everything except the new category-scoped sections.
- **AI Match V1** — 🔴 MVP (§0.3), reads the structured attributes this document lists in §10, no scoring algorithm designed here.
- **Job / Campaign → Application / Booking** — unchanged, existing booking pipeline; `deliverables` is a conditional risk to this stage only if real money moves at MVP (§0.10).

*End of updated audit. No code, schema, or data was changed while producing this report.*
