# Talents Marketplace Project Context

## Product

Talents is a bilingual Arabic/English marketplace that connects brands with creators, talents, reviewers, hosts, and other marketplace professionals.

The product direction is premium, modern, professional, conversion-focused, and marketplace-first. The app should feel like a polished SaaS marketplace, not a simple directory.

## Tech Stack

- Framework: Next.js App Router
- Language: TypeScript
- UI: React
- Styling: CSS Modules plus global CSS variables in `app/globals.css`
- Animation: Framer Motion, used subtly
- Icons: Lucide React
- Backend: Supabase
- Auth: Supabase Auth
- Database: PostgreSQL through Supabase
- State/theme context: `contexts/SiteContext.tsx`
- Runtime pattern: many routes use `runtime = "edge"` and dynamic server fetching

## UI Style

Use the existing Home Page visual language exactly.

Core visual direction:
- Premium marketplace SaaS
- Charcoal/dark surfaces
- Gold accents
- Teal success/action accents
- Clean white/light mode
- Glass effects only where useful
- Soft gradients
- Premium cards with restrained shadows
- Professional spacing and clear hierarchy
- RTL Arabic and LTR English support
- Dark/light mode support through existing theme context

Rules:
- Do not create a second design system.
- Use existing CSS variables from `app/globals.css`.
- Reuse existing button, card, grid, panel, and package styles where possible.
- Keep cards purposeful, not decorative.
- Use smooth hover and fade animations, not excessive motion.
- Keep mobile layouts clean and readable.

## Project Architecture

Main app structure:
- `app/(main)` contains public and user-facing pages.
- `app/(auth)` contains login/register/onboarding flows.
- `app/(admin)` contains admin dashboard pages.
- `app/api` contains API routes.
- `components` contains shared UI components.
- `components/admin` contains reusable admin shell/sidebar/dashboard components.
- `components/packages` contains reusable package UI.
- `features/*` contains domain services/types.
- `lib/supabase` contains Supabase clients.
- `contexts` contains global app state such as site language/theme.
- `supabase/migrations` contains database migrations.

Preferred architecture:
- Put business/domain logic inside `features/{domain}/services`.
- Put shared types inside `features/{domain}/types`.
- Keep API routes thin: validate input, check auth, call service.
- Keep UI components reusable and data-agnostic where reasonable.
- Do not duplicate styles if a CSS module or shared component already exists.

## Current Database Schema

### Existing Core Tables

`profiles`
- Shared account table.
- Contains `id`, `auth_user_id`, `role`, basic user data, approval/status fields.
- Roles currently seen in DB: `talent`, `brand`, `admin`.

`talent_profiles`
- Talent-specific data.
- Currently includes legacy fields:
  - `category`
  - `packages`
- These are still used by older profile and explore pages.

`jobs`
- Brand job posts.

`bookings`
- Booking records.
- Current DB uses `talent_id`.
- Some code references `talent_user_id`; this is a known schema mismatch to fix carefully.

`reviews`
- Reviews linked to bookings, brands, and talent profiles.

`conversations`, `messages`
- Chat system.

`talent_brands`
- Talent portfolio brand collaborations.

`talent_verifications`
- Talent verification workflow.

### New Dynamic Category Architecture

Migration:
- `supabase/migrations/20260723_marketplace_categories_architecture.sql`

New tables:

`categories`
- Admin-managed category/type system.
- Fields include:
  - `id`
  - `role_type`: `talent` or `brand`
  - `label_ar`
  - `label_en`
  - `description`
  - `is_active`
  - `sort_order`

Examples:
- Talent: `ugc`, `influencer`, `fashion`, `food_reviewer`, `tech_reviewer`, `unboxing`, `host`
- Brand: `restaurant`, `cafe`, `events`, `technology`, `real_estate`, `brand_fashion`, `brand_food`

`profile_categories`
- Many-to-many relation between users and categories.
- Allows one profile to have multiple talent or brand categories.

`brand_profiles`
- Brand-specific profile data.
- Replaces ad hoc brand category data inside `profiles`.

`packages`
- Subscription package records.

`package_categories`
- Defines which categories can see each package.
- This replaces the temporary `package_targets` model.

`package_plans`
- Package pricing durations.
- Examples: 1, 3, 6, 12 months.

`package_features`
- Package limits/features.
- Examples:
  - `max_applications`
  - `max_chats`
  - `portfolio_limit`
  - `featured_profile`

`subscriptions`
- User active package plan.

`usage_tracking`
- Tracks usage against package limits.

## Legacy Structures

Do not delete yet:
- `talent_profiles.category`
- `talent_profiles.packages`
- `talent_types`
- `package_targets`

Reason:
- Older frontend pages still read talent category and package JSON.
- Recent package code had temporary support for `talent_types` and `package_targets`.
- Cleanup must happen only after all frontend reads/writes are migrated and tested.

## Package System Rules

Packages must appear dynamically based on:
- user role
- selected category

Examples:
- Talent + UGC Creator sees UGC packages.
- Talent + Influencer sees Influencer packages.
- Brand + Restaurant sees Restaurant packages.

Admin manages:
- Categories
- Packages
- Plans
- Features
- Package category assignments

Delete behavior:
- Package delete should be soft only through `is_active = false`.
- Category delete should be soft only through `is_active = false`.
- Do not destroy subscriptions or historical usage.

## Registration Rules

Talent registration:
- User chooses a talent category.
- Save to:
  - `profile_categories`
  - legacy `talent_profiles.category` while transition is active

Brand registration:
- User chooses a brand category.
- Save to:
  - `brand_profiles`
  - `profile_categories`

Current register dropdown values:
- Talent: `ugc`, `influencer`, `fashion`, `food_reviewer`, `media_buyers`
- Brand: `brand_fashion`, `brand_food`, `technology`

Note:
- `food_reviewer` is one talent category.
- Do not split it into separate `food` and `review` roles.

## Admin Dashboard

Existing admin shell:
- `components/admin/AdminShell.tsx`
- `components/admin/AdminSidebar.tsx`

Admin pages:
- `/admin/packages`
- `/admin/categories`

Admin package targeting should use `categories` / `package_categories`, not hardcoded roles or old `talent_types`.

## Important Decisions

- The new flexible category system replaces hardcoded category logic.
- `categories` is shared for talent and brand categories using `role_type`.
- Many-to-many `profile_categories` allows future multi-category profiles.
- `brand_profiles` separates brand-specific data from shared `profiles`.
- Old package JSON in `talent_profiles.packages` remains temporarily for compatibility.
- No destructive DB cleanup until frontend references are migrated and verified.
- UI should continue using the Home Page theme and existing design tokens.
- New work should prefer service-layer logic in `features`.

## Known Issues / Technical Debt

- Dynamic package DB migration must be applied in Supabase before package UI works.
- `profiles.email` is empty in current DB; Auth has emails separately.
- Some talents have `role = talent` but no `talent_profiles` row.
- `bookings` DB schema uses `talent_id`, while some code expects `talent_user_id`.
- Some Arabic strings in older files display encoding artifacts in terminal output, although the UI may render correctly.
- Several legacy profile pages still depend on `talent_profiles.packages`.

## Development Rules

- Never delete old DB fields/tables without a migration plan and approval.
- Refactor incrementally and preserve behavior.
- Prefer adding compatibility fallbacks before removing legacy reads.
- Keep API routes small and validate inputs with Zod.
- Keep services reusable and framework-light.
- Do not create duplicate components/styles.
- Use the existing design system and theme variables.
- Support Arabic/English and RTL/LTR.
- Support dark/light mode.
- Run TypeScript after meaningful changes:
  `npx tsc --noEmit --incremental false --pretty false`

## Next Recommended Phases

Phase 1:
- Apply `20260723_marketplace_categories_architecture.sql` in Supabase.
- Verify categories, packages, package plans, and profile category backfill.

Phase 2:
- Update profile/explore pages to read from `profile_categories`.
- Keep legacy `talent_profiles.category` fallback.

Phase 3:
- Replace profile package JSON UI with dynamic package/subscription UI.

Phase 4:
- Fix bookings schema mismatch around `talent_id` vs `talent_user_id`.

Phase 5:
- After verification, remove obsolete structures in a dedicated cleanup migration.
