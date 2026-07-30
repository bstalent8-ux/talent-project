# Frontend UI Audit

Audit date: 2026-07-30  
Project: Talents Marketplace MVP  
Scope: Next.js App Router frontend under `app/`, shared UI in `components/`, feature UI in `features/`, and documented missing surfaces.

This is a design and UX audit only. No source code changes are prescribed here as implementation; this document is intended to guide a later refactor.

## Executive Summary

The frontend has a credible marketplace foundation: Arabic-first routing, dark/light theming, real discovery pages, profile depth, job flow, chat, bookings, notifications, and a practical admin shell. The strongest screens are the newer module-CSS surfaces: `/home`, `/explore`, `/community`, `/bookings`, `/packages`, and the newer admin package/trusted-brand editors. The weakest areas are older inline-style pages, duplicated profile routes, non-existent protected pages that are still referenced by middleware, inconsistent component vocabulary, and mojibake Arabic text visible in source that risks rendering broken copy if the encoding pipeline is not corrected.

Top systemic issues:

- Design tokens exist in `app/globals.css`, but many pages define local color, radius, shadow, and input styles.
- Arabic strings appear mojibake in many TSX files, making copy quality and accessibility labels hard to trust.
- Several requested/product surfaces are missing: `/forgot-password`, `/dashboard`, `/favorites`, `/payments`, `/settings`, `/contests`, standalone `/reviews`.
- Some pages use product anti-patterns: decorative grid overlays, gradient text, emoji-as-icons, repeated card grids, and marketing claims around secure payments/escrow that do not match the shipped manual payment model.
- No route-level `loading.tsx`, `error.tsx`, or `not-found.tsx` files exist, so loading/error UX is inconsistent or absent.

Global audit score: **68/100**. Production usable, but not yet design-system mature.

---

# Page Audit Method

Every implemented page was inspected from the App Router inventory. Pages requested by product but not present are included as missing-surface audits because they affect UX continuity.

UI score legend:

| Item | Meaning |
|---|---|
| 1-3 | Broken or absent |
| 4-5 | Usable but weak |
| 6-7 | Solid MVP quality |
| 8-9 | Strong production quality |
| 10 | Best-in-class and systemized |

---

# Root `/`

## Purpose
Route users to the main public landing experience.

## Current Components
- Server auth check
- Redirect to `/home`

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | N/A |
| Buttons | N/A |
| Inputs | N/A |
| Icons | N/A |
| Border radius | N/A |
| Shadows | N/A |
| Component spacing | N/A |

## Color Review
No visible UI. Color responsibility transfers to `/home`.

## Typography Review
No visible typography.

## UX Review
Simple redirect works. The auth lookup is unnecessary for the current behavior because both guests and authenticated users redirect to `/home`.

## Responsive Review
No layout.

## Accessibility
No visible screen. Redirect is acceptable.

## Animation Review
None.

## Performance
Minor extra Supabase auth check before redirect. Remove if not needed.

## Design Consistency
Consistent with public-first browsing strategy.

## Recommended Improvements

- Low: Remove unused auth check. It adds latency without changing the destination. Proposed solution: direct redirect to `/home`. Expected UX improvement: slightly faster first load.

## Estimated Effort
Small

## Design Score
82/100

---

# Landing `/home`

## Purpose
Explain the marketplace, build trust, drive guests toward exploring talent, registration, and brand/talent workflows.

## Current Components
- Navbar
- Cinematic hero with media
- Search entry
- CTA buttons
- Trust metrics
- Dynamic Trusted By marquee
- Category sections
- Featured talent cards
- Brand workflow
- Talent workflow
- Campaign moments
- Platform features
- Testimonials
- Pricing preview
- FAQ
- Final CTA
- Footer
- Global chat widget

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | 8 |
| Inputs | 7 |
| Icons | 8 |
| Border radius | 7 |
| Shadows | 7 |
| Component spacing | 8 |

## Color Review
The page mostly follows a luxury dark marketplace direction with green/gold accents. The new Trusted By marquee fits the dark visual language. Inconsistency remains between `#00D26A`, token teal, gold, and older gradients. Some sections read more SaaS-template than marketplace because the same accent glows repeat.

## Typography Review
Cairo/Changa support Arabic well. Hero scale is strong, but multiple sections use large display type and kicker patterns, reducing hierarchy after the first viewport. Body line lengths are mostly acceptable.

## UX Review
The page communicates value and offers clear routes to explore and register. Search is useful as an immediate marketplace action. The page is long and dense; CTAs repeat enough, but trust proof should rely more on real logos/testimonials and fewer generic metrics.

## Responsive Review
Desktop and laptop are strong. Tablet likely compresses dense section grids. Mobile is supported by CSS modules, but long Arabic headings and media cards need screenshot QA at 360px.

## Accessibility
Semantic sections exist through React structure, but animated content needs reduced-motion verification. Image alt quality depends on imported content. Ensure the Trusted By duplicate marquee group remains `aria-hidden`.

## Animation Review
Framer Motion and CSS motion are visually polished but abundant. Motion should be shortened and made more state/content-driven. Reduced-motion is handled globally, but component-specific variants need audit.

## Performance
Hero media and multiple animated sections can become heavy. Public data is server-cached. Trusted By fetch has API cache and client promise memoization. Watch remote image sizes and above-fold media priority.

## Design Consistency
One of the most refined pages, but it diverges from older task screens. It should become the reference for marketing surfaces, while admin/task screens need a quieter variant.

## Recommended Improvements

- High: Replace generic proof metrics with real marketplace data. Why it matters: trust claims must feel concrete. Proposed solution: server-render real active talents/jobs/brands/reviews counts. Expected UX improvement: stronger credibility.
- High: Reduce repeated section templates. Why it matters: identical card grids create fatigue. Proposed solution: vary structure between proof, workflow, talent, and testimonial sections. Expected UX improvement: better scannability.
- Medium: Normalize accent usage to one primary green plus gold for ratings only. Why it matters: mixed teal/green/gold/purple weakens identity. Proposed solution: use design tokens. Expected UX improvement: cleaner brand system.
- Medium: Verify all motion with `prefers-reduced-motion`. Why it matters: WCAG comfort. Proposed solution: section-level reduced motion fallbacks. Expected UX improvement: safer motion.

## Estimated Effort
Medium

## Design Score
82/100

---

# Explore `/explore`

## Purpose
Let guests, brands, talents, and admins browse approved talent profiles and find a match using search, filters, sorting, and category shortcuts.

## Current Components
- Explore hero
- Search input
- Talent type shortcuts
- Hero stats
- Category cards
- Filter sidebar/drawer
- Talent grid
- Pagination
- Direct brief modal
- Protected action wrapper

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 7 |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 7 |
| Component spacing | 8 |

## Color Review
Good marketplace use of dark surfaces, green active states, and muted borders. Filter and card states are more consistent than older pages. Ensure light mode green text on white meets contrast; small green labels may be under AA.

## Typography Review
Good heading hierarchy and compact card metadata. Arabic source strings appear mojibake in files, requiring encoding verification. Category labels are readable but long labels need wrapping rules.

## UX Review
Strong discovery flow: search, categories, filters, sorting, pagination. Guest protected actions open auth instead of errors. Brand-category ranking is a smart personalization layer. Missing: saved filter state, clear no-results guidance with suggested reset, and skeletons for client-side role fetch.

## Responsive Review
Desktop and laptop should work well with sidebar plus grid. Tablet/mobile need filter drawer behavior QA. Category horizontal scroll is appropriate; touch targets should be at least 44px.

## Accessibility
Buttons and inputs are mostly semantic. Need label association for filters and search; icon-only states require accessible names. Direct brief modal must trap focus.

## Animation Review
Mostly CSS/module based and restrained. Hover card lift is appropriate.

## Performance
Filtering is client-side over server-provided list. Acceptable for MVP, but could degrade with large talent counts. Public data is cached server-side. Role fetch adds one client request.

## Design Consistency
This should be the reference product-marketplace listing page. Jobs and Brands should align more closely to this implementation.

## Recommended Improvements

- High: Add no-results recommendations. Problem: empty filtered results can feel like a dead end. Proposed solution: show active filters, reset button, and broader category suggestions. Expected UX improvement: better recovery.
- High: Add explicit labels/ARIA for filter controls. Why it matters: keyboard and screen reader usability. Proposed solution: label each select/range/toggle. Expected UX improvement: WCAG AA progress.
- Medium: Persist search/filter state in URL. Why it matters: shareability and back-button behavior. Proposed solution: query params for search/type/sort/page. Expected UX improvement: stronger marketplace usability.
- Medium: Add virtualization or server pagination later. Why it matters: performance with large supply. Proposed solution: paginated API when list exceeds a few hundred. Expected UX improvement: faster browsing.

## Estimated Effort
Medium

## Design Score
84/100

---

# Talents Alias `/talents`

## Purpose
Legacy/public alias for talent discovery.

## Current Components
- Redirect to `/explore`

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | N/A |
| Buttons | N/A |
| Inputs | N/A |
| Icons | N/A |
| Border radius | N/A |
| Shadows | N/A |
| Component spacing | N/A |

## Color Review
No visible UI.

## Typography Review
No visible UI.

## UX Review
Redirect is reasonable. The naming split between `/talents` and `/explore` should be clarified in navigation and SEO.

## Responsive Review
No visible layout.

## Accessibility
No visible UI.

## Animation Review
None.

## Performance
One redirect hop.

## Design Consistency
Good if canonical remains `/explore`; avoid linking to both names.

## Recommended Improvements

- Low: Add canonical metadata on `/explore`. Why it matters: SEO clarity. Proposed solution: make `/talents` a permanent redirect. Expected UX improvement: less route ambiguity.

## Estimated Effort
Small

## Design Score
80/100

---

# Talent Details `/talent/[handle]`

## Purpose
Show a public, booking-ready talent profile with portfolio, proof, packages, reviews, and brief CTA.

## Current Components
- Campaign banner
- Profile hero
- Tabs navigation
- Portfolio section
- Experience section
- Packages section
- Usage rights section
- Performance sidebar
- Reviews card
- Brands card
- Trust card
- Brief card
- Question card
- Sticky booking bar

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 6 |
| Icons | 8 |
| Border radius | 7 |
| Shadows | 7 |
| Component spacing | 8 |

## Color Review
The green/gold trust palette fits this page. Some sidebar cards use local colors that may drift from the tokens. Need check muted text contrast in dark mode, especially `#64748b` on deep surfaces.

## Typography Review
Good marketplace hierarchy. Talent name and package pricing are prominent. Some metadata is very small for mobile.

## UX Review
Strong profile completeness: work, pricing, proof, reviews, and booking CTA are all present. Sticky booking bar supports conversion. Risk: too many cards in the right sidebar compete with the primary booking decision.

## Responsive Review
Desktop two-column layout is appropriate. Mobile collapses to one column and keeps a sticky booking bar; verify it does not cover content or conflict with browser bottom UI.

## Accessibility
Needs focus-trap review for brief modal and accessible labels for tab navigation. Portfolio media needs meaningful alt/caption strategy.

## Animation Review
Subcomponents use card hover and page motion. Appropriate if reduced-motion is honored.

## Performance
Many media assets; use `next/image` wherever possible. Server page fetching and caching are appropriate. Portfolio videos should lazy-load and avoid auto-play without consent.

## Design Consistency
Canonical talent profile is strong, but duplicated `/profile/[username]` dilutes consistency.

## Recommended Improvements

- Critical: Remove or redirect duplicate public profile route after migration. Why it matters: two visual systems confuse users and SEO. Proposed solution: consolidate to `/talent/[handle]`. Expected UX improvement: one trusted profile experience.
- High: Simplify sidebar priority. Why it matters: booking CTA should dominate. Proposed solution: group trust/reviews/brands below primary brief card. Expected UX improvement: clearer conversion path.
- High: Audit sticky booking bar on mobile. Why it matters: sticky UI can obscure actions. Proposed solution: safe-area padding and compact CTA. Expected UX improvement: better mobile booking.
- Medium: Standardize media alt text. Why it matters: accessibility and SEO. Proposed solution: caption-derived alt with fallback. Expected UX improvement: better screen reader support.

## Estimated Effort
Medium

## Design Score
80/100

---

# Legacy Profile Details `/profile/[username]`

## Purpose
Older duplicate public talent profile route.

## Current Components
- Duplicate profile client
- Header
- Tabs
- Portfolio
- Performance snapshot
- Packages
- Sidebar cards

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 6 |
| White space | 6 |
| Alignment | 6 |
| Consistency | 4 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | N/A |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 6 |
| Component spacing | 6 |

## Color Review
Older local colors differ from canonical profile. Accent usage is close but not identical.

## Typography Review
Less refined than `/talent/[handle]`; hierarchy is flatter and data density is less intentional.

## UX Review
Creates route confusion and inconsistent profile expectations. Some props are missing compared with the canonical route.

## Responsive Review
Unknown consistency on mobile; orphaned component tree increases regression risk.

## Accessibility
Likely repeats older gaps in alt text, tabs, and card semantics.

## Animation Review
Less systemized than canonical route.

## Performance
Duplicate route increases maintenance and bundle surface.

## Design Consistency
This is the largest page-level consistency defect.

## Recommended Improvements

- Critical: Decommission or redirect to `/talent/[handle]`. Why it matters: duplicate product surfaces reduce trust. Proposed solution: canonical redirect plus delete orphan components later. Expected UX improvement: consistent public profiles.

## Estimated Effort
Medium

## Design Score
54/100

---

# Profile Redirect `/profile`

## Purpose
Send authenticated users to their editable profile.

## Current Components
- Redirect to `/profile/me`

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | N/A |
| Buttons | N/A |
| Inputs | N/A |
| Icons | N/A |
| Border radius | N/A |
| Shadows | N/A |
| Component spacing | N/A |

## Color Review
No visible UI.

## Typography Review
No visible UI.

## UX Review
Reasonable redirect, but guests hitting `/profile` should be handled through auth protection with clear modal/redirect strategy.

## Responsive Review
No visible layout.

## Accessibility
No visible UI.

## Animation Review
None.

## Performance
One redirect hop.

## Design Consistency
Naming overlaps with legacy public profile route.

## Recommended Improvements

- Medium: Clarify route ownership. Problem: `/profile`, `/profile/me`, `/profile/[username]`, and `/talent/[handle]` overlap. Proposed solution: reserve `/profile/*` for authenticated self-management. Expected UX improvement: less navigation ambiguity.

## Estimated Effort
Small

## Design Score
76/100

---

# Profile Management `/profile/me`

## Purpose
Let a talent manage profile details, avatar, social links, physical info, portfolio, brands, packages, usage add-ons, and profile completion.

## Current Components
- Dashboard/profile header
- Profile completion card
- Avatar upload
- Basic info fields
- Availability controls
- Social media fields
- Physical info modal
- Portfolio photo/video upload
- Brand list editor
- Package editor
- Usage rights editor
- Save/cancel actions
- Public profile link

## UI Review

| Item | Score |
|---|---:|
| Layout | 5 |
| Visual hierarchy | 6 |
| White space | 5 |
| Alignment | 6 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 5 |

## Color Review
Uses older inline dark/light values and `#00D26A`/`#F4B740`. Contrast for muted labels needs review. Social icons introduce bright native-brand colors that can fight the marketplace palette.

## Typography Review
Dense labels and many 12-14px controls. Long Arabic labels risk cramped forms. JSON-like sections are avoided for user side, which is good.

## UX Review
Functional but overloaded. Users are asked to manage many profile domains in one long page. Profile completion card helps, but editing states and save scope are not always obvious.

## Responsive Review
Mobile likely stacks but becomes very long. File upload, portfolio grid, package editor, and modal need dedicated mobile QA.

## Accessibility
Inputs have labels, but focus states rely on global outline and inline `outline: none` in places. Upload buttons need accessible names and status announcements.

## Animation Review
Framer Motion is used heavily. Motion should be reduced for task forms.

## Performance
Large client component with many states and upload refs. Splitting into section components would improve maintainability and render cost.

## Design Consistency
This page is older and visually apart from `/packages` and `/bookings`. It should become a task-form system reference after refactor.

## Recommended Improvements

- Critical: Break the page into progressive sections/tabs. Why it matters: users cannot confidently complete long profile setup. Proposed solution: Profile, Portfolio, Packages, Social, Verification tabs with section save states. Expected UX improvement: lower cognitive load.
- High: Standardize form controls. Why it matters: mixed input styling weakens trust. Proposed solution: shared `Field`, `TextInput`, `Textarea`, `UploadDropzone`, `SectionPanel`. Expected UX improvement: faster scanning.
- High: Improve save feedback per section. Why it matters: one global save state is ambiguous. Proposed solution: section-level dirty/saved/error indicators. Expected UX improvement: safer editing.
- Medium: Reduce decorative action icons. Why it matters: task UI should be quiet. Proposed solution: use lucide icons only where they clarify. Expected UX improvement: less noise.

## Estimated Effort
Large

## Design Score
58/100

---

# Portfolio Management

## Purpose
Manage public profile media inside `/profile/me`.

## Current Components
- Add photo button
- Add video button
- Hidden file inputs
- Media grid/list
- Caption field
- Delete action
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 6 |
| White space | 6 |
| Alignment | 6 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 6 |

## Color Review
Consistent with profile page but not with newer package/admin modules.

## Typography Review
Labels are compact; captions need better hierarchy.

## UX Review
Basic upload works, but media requirements, accepted file types, size limits, and approval status are not clearly surfaced.

## Responsive Review
Mobile upload and grid density need improvement.

## Accessibility
File inputs are hidden; trigger buttons need explicit labels. Media previews need alt text or captions.

## Animation Review
No critical issue.

## Performance
Portfolio images should use `next/image`; uploaded media should be lazily loaded.

## Design Consistency
Should align with public `PortfolioSection` cards.

## Recommended Improvements

- High: Add upload guidance and validation messages. Why it matters: creators need confidence. Proposed solution: visible file constraints and progress. Expected UX improvement: fewer failed uploads.
- Medium: Add reorder support. Why it matters: portfolio order affects booking conversion. Proposed solution: drag handles or up/down controls. Expected UX improvement: better self-presentation.

## Estimated Effort
Medium

## Design Score
62/100

---

# Brands `/brands`

## Purpose
Let guests and authenticated users browse approved brands seeking collaboration.

## Current Components
- Hero/search
- Industry quick tabs
- Filter sidebar
- Brand grid
- Verified toggle

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 6 |
| Icons | 6 |
| Border radius | 7 |
| Shadows | 6 |
| Component spacing | 7 |

## Color Review
Uses the familiar green accent and dark cards. Light hero gradient differs from Explore and Jobs. Emoji in heading reduces premium brand feel.

## Typography Review
Good compact listing typography. Headline is clear.

## UX Review
Useful browsing flow, but brand discovery is less rich than talent discovery. Missing stronger proof: industries, active jobs, previous collaborations, and brand approval status should be clearer.

## Responsive Review
Two-column layout must collapse; current inline grid may need explicit mobile behavior.

## Accessibility
Search input and filter controls need labels. Emoji search icon is not semantically ideal.

## Animation Review
Minimal.

## Performance
Client filters on server-provided list; acceptable for MVP.

## Design Consistency
Should be visually aligned with Explore; currently looks like a simpler clone with less polish.

## Recommended Improvements

- High: Bring Brands page to Explore visual system. Why it matters: parallel discovery pages should feel equally mature. Proposed solution: shared listing hero/filter/card vocabulary. Expected UX improvement: stronger marketplace trust.
- Medium: Add brand card proof fields. Why it matters: talents need confidence before engaging. Proposed solution: active jobs, completed bookings, verified badge, industry. Expected UX improvement: better decision-making.
- Medium: Replace emoji with lucide icons. Why it matters: premium consistency. Proposed solution: `Building2`, `Search`. Expected UX improvement: more professional feel.

## Estimated Effort
Medium

## Design Score
70/100

---

# Brand Details `/brand/[id]`

## Purpose
Show an approved brand’s public profile.

## Current Components
- Brand card
- Avatar/logo
- Verification badge
- City
- Collaboration count
- Brand category
- Bio

## UI Review

| Item | Score |
|---|---:|
| Layout | 5 |
| Visual hierarchy | 6 |
| White space | 6 |
| Alignment | 6 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 3 |
| Inputs | N/A |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 4 |
| Component spacing | 6 |

## Color Review
Hardcoded dark-only UI. Light mode is not supported because the server page does not consume theme context. Green is consistent but sparse.

## Typography Review
Simple and readable, but too minimal for a public brand detail page.

## UX Review
The page lacks jobs, reviews, website, contact/brief CTA, and navigation back to brands. It feels like a placeholder rather than a profile.

## Responsive Review
Single card is safe on mobile, but fixed dark theme conflicts with light mode.

## Accessibility
Avatar `img` has empty alt; verification icon lacks accessible label. Missing landmarks beyond `main`.

## Animation Review
None.

## Performance
Cached server data is good. Uses raw `img`; should use `next/image`.

## Design Consistency
Much less complete than talent details and the Brands grid.

## Recommended Improvements

- Critical: Add full brand profile structure. Why it matters: talents need enough context to trust brands. Proposed solution: hero, public info, active jobs, reviews/collaborations, website link, CTA. Expected UX improvement: brand pages become actionable.
- High: Support theme and shared components. Why it matters: fixed dark page breaks site settings. Proposed solution: client component using `useSite()` or CSS tokens. Expected UX improvement: consistency.
- Medium: Add back/navigation affordance. Why it matters: browsing flow. Proposed solution: back to `/brands` link and related jobs. Expected UX improvement: less dead-end behavior.

## Estimated Effort
Large

## Design Score
50/100

---

# Jobs `/jobs`

## Purpose
Let talents discover open opportunities and let brands post jobs.

## Current Components
- Hero
- Search
- Category tabs
- Post Job CTA
- Filter sidebar
- Job grid
- Pagination
- Protected action wrapper

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 6 |
| Icons | 5 |
| Border radius | 7 |
| Shadows | 6 |
| Component spacing | 7 |

## Color Review
Gold Post Job CTA is prominent, green tabs are familiar. Hero gradient differs from Explore. Emoji in title lowers premium feel.

## Typography Review
Readable and compact. Category labels should be audited for wrapping.

## UX Review
Core flow is clear. Guests can browse and protected post/apply actions are gated. Missing: job status labels, application count visibility, saved search, and better no-results state.

## Responsive Review
Inline two-column layout needs mobile collapse confirmation. Filters may be too narrow on tablet.

## Accessibility
Search input lacks explicit label. Category buttons need pressed state (`aria-pressed`). Pagination buttons are semantic.

## Animation Review
Minimal hover transitions, acceptable.

## Performance
Client-side filtering/pagination acceptable for MVP. Later, server pagination for high volume.

## Design Consistency
Similar to Brands but less polished than Explore. Should share listing components.

## Recommended Improvements

- High: Align with Explore’s module CSS structure. Why it matters: jobs and talent discovery are paired workflows. Proposed solution: shared listing layout primitives. Expected UX improvement: predictable scanning.
- High: Add improved empty/no-results state. Why it matters: users need recovery. Proposed solution: reset filters, browse categories, create job CTA for brands. Expected UX improvement: fewer dead ends.
- Medium: Replace emoji with lucide icons. Why it matters: premium marketplace tone. Expected UX improvement: cleaner UI.

## Estimated Effort
Medium

## Design Score
72/100

---

# Job Details `/jobs/[id]`

## Purpose
Show details for an open job and allow eligible talents to apply.

## Current Components
- Back link
- Job article card
- Brand label
- Title
- Budget/slots/date badges
- Description
- Apply button
- Apply modal

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | N/A |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Green CTA is clear. Muted date/slot badges work. Uses local colors rather than tokens.

## Typography Review
Strong title and readable description. Metadata badges are compact but legible.

## UX Review
Apply flow is straightforward and guest-safe. Missing: brand card preview, job requirements structure, similar jobs, and application deadline urgency.

## Responsive Review
Single-column layout is safe. Badges wrap well.

## Accessibility
Apply button is semantic. Disabled talent-state has no explanatory text; this is a UX/a11y issue.

## Animation Review
Minimal.

## Performance
Good; server-fetched page with small client behavior.

## Design Consistency
Matches older job UI, not newer Explore modules.

## Recommended Improvements

- High: Explain disabled apply states. Why it matters: authenticated non-talents need guidance. Proposed solution: inline helper text or protected-action modal message. Expected UX improvement: fewer confusing failures.
- Medium: Add structured job sections. Why it matters: long descriptions are hard to scan. Proposed solution: requirements, budget, timeline, brand, deliverables. Expected UX improvement: faster apply decisions.
- Medium: Add brand profile link card. Why it matters: trust. Expected UX improvement: better confidence before applying.

## Estimated Effort
Medium

## Design Score
74/100

---

# Create Job `/jobs/create`

## Purpose
Let brands create a new job post.

## Current Components
- Back button
- Header
- Job title field
- Description textarea
- Category chips
- Budget min/max
- Date range
- Slots
- Error message
- Submit button

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 7 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Green icons and gold selected category create clear state but diverge from pure-primary action vocabulary.

## Typography Review
Labels are uppercase with letter spacing, which is less ideal for Arabic. Body hierarchy is clear.

## UX Review
Good first-pass form. Missing field-level validation, draft save, and clearer budget guidance. Category chips use emoji icons rather than the project’s lucide convention.

## Responsive Review
Single centered card works. Two-column budget/date grids need collapse on small mobile.

## Accessibility
Inputs are labeled. Error message should be linked via `aria-describedby`; category chips should use `aria-pressed`.

## Animation Review
Minimal.

## Performance
Lightweight.

## Design Consistency
Uses same inline field style as older pages; should align with admin package form components.

## Recommended Improvements

- High: Add field-level validation. Why it matters: form errors are easier to fix near the field. Proposed solution: inline error text and `aria-describedby`. Expected UX improvement: fewer failed submissions.
- Medium: Replace emoji category icons. Why it matters: professional consistency. Proposed solution: lucide icons from shared category config. Expected UX improvement: cleaner form.
- Medium: Add draft protection. Why it matters: long descriptions can be lost. Proposed solution: dirty state warning/local draft. Expected UX improvement: safer creation.

## Estimated Effort
Medium

## Design Score
72/100

---

# Job Applications `/jobs/[id]/applications`

## Purpose
Let a brand review, accept, reject, and contact applicants for a job.

## Current Components
- Back button
- Job header card
- Application stats
- Empty state
- Application list
- Talent card snippets
- Proposed price/delivery
- Portfolio links
- Accept/reject/chat/profile actions
- Reject modal

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 6 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Status colors are clear. Green/gold/red semantic use is mostly correct. Uses local hardcoded palette.

## Typography Review
Stats and proposal details are readable. Long proposal text could be better clamped/expanded.

## UX Review
Good operational flow. Accept can redirect into booking, which is productive. Reject modal is useful but should capture reason consistently.

## Responsive Review
Single-column cards are mobile-friendly. Header stats may wrap awkwardly on narrow screens.

## Accessibility
Icon actions need accessible labels. Modal needs focus trap and Escape support.

## Animation Review
Framer Motion imported; keep motion minimal for admin-like workflow.

## Performance
Fine for typical application counts. For high volume, add pagination/filtering.

## Design Consistency
Visual language sits between public job detail and admin tables; acceptable but should use shared status/action primitives.

## Recommended Improvements

- High: Add applicant filtering by status. Why it matters: brands need manageability as applications grow. Proposed solution: tabs for pending/accepted/rejected. Expected UX improvement: faster review.
- High: Make actions accessible. Why it matters: icon-only buttons need screen reader names. Proposed solution: `aria-label` plus visible text at desktop where possible. Expected UX improvement: WCAG progress.
- Medium: Add compare mode. Why it matters: hiring is comparative. Proposed solution: compact stats columns for price/rating/delivery. Expected UX improvement: better decisions.

## Estimated Effort
Medium

## Design Score
72/100

---

# Campaigns `/campaigns`

## Purpose
Requested public campaigns route.

## Current Components
- Redirect to `/jobs`

## UI Review

| Item | Score |
|---|---:|
| Layout | 5 |
| Visual hierarchy | 4 |
| White space | 5 |
| Alignment | 5 |
| Consistency | 5 |
| Card design | N/A |
| Buttons | N/A |
| Inputs | N/A |
| Icons | N/A |
| Border radius | N/A |
| Shadows | N/A |
| Component spacing | N/A |

## Color Review
No visible route-specific UI.

## Typography Review
No visible UI.

## UX Review
Redirect may be acceptable if campaigns are synonymous with jobs, but the product language mentions campaign moments separately. Users expecting campaigns may feel misdirected.

## Responsive Review
No visible layout.

## Accessibility
No visible UI.

## Animation Review
None.

## Performance
One redirect hop.

## Design Consistency
Route naming is inconsistent with product terminology.

## Recommended Improvements

- Medium: Decide whether campaigns are jobs or a separate concept. Why it matters: marketplace mental model. Proposed solution: either rename nav/copy to jobs or create a campaign landing/listing. Expected UX improvement: clearer IA.

## Estimated Effort
Small if alias, Large if new page

## Design Score
50/100

---

# Packages `/packages`

## Purpose
Show platform subscription packages/plans and allow eligible users to subscribe.

## Current Components
- Hero
- Summary panel
- Billing duration selector
- Package grid
- Package cards
- Subscribe buttons
- Status message
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 7 |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 7 |
| Component spacing | 8 |

## Color Review
One of the more cohesive pages. Green/gold accents and panel backgrounds are controlled through CSS modules. Beware copy that implies active billing/payment if subscriptions are still partially/manual.

## Typography Review
Strong hierarchy; package names/prices are prominent. Body text is compact and readable.

## UX Review
Clear plan comparison, billing toggle, selected card state, and subscription feedback. Empty state is useful.

## Responsive Review
Package grid should work well with CSS modules; card size differences for selected state need mobile layout-shift QA.

## Accessibility
Billing duration selector should expose selected state. Subscribe protected action opens auth. Status messages use `role=status`.

## Animation Review
Subtle and likely acceptable.

## Performance
Server-fetched, cacheable public data. Component split is good.

## Design Consistency
Good candidate for shared pricing/card patterns.

## Recommended Improvements

- High: Align product claims with actual billing implementation. Why it matters: legal/trust. Proposed solution: avoid “safe subscription/payment” wording unless backed by payment flow. Expected UX improvement: accurate expectations.
- Medium: Add feature comparison table for all plans. Why it matters: plan decision support. Proposed solution: expand existing component usage below cards. Expected UX improvement: clearer comparison.
- Medium: Prevent selected-card layout shift on mobile. Why it matters: tap stability. Proposed solution: visual selected state without size growth at small widths. Expected UX improvement: smoother mobile UX.

## Estimated Effort
Medium

## Design Score
82/100

---

# Pricing Alias `/pricing`

## Purpose
Public pricing URL alias.

## Current Components
- Redirect to `/packages`

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | N/A |
| Buttons | N/A |
| Inputs | N/A |
| Icons | N/A |
| Border radius | N/A |
| Shadows | N/A |
| Component spacing | N/A |

## Color Review
No visible route-specific UI.

## Typography Review
No visible UI.

## UX Review
Good alias, but nav currently uses `/packages` in some places while requirement names `/pricing`.

## Responsive Review
No visible layout.

## Accessibility
No visible UI.

## Animation Review
None.

## Performance
One redirect.

## Design Consistency
Choose one public term. “Pricing” is clearer for guests; “Packages” may be better in Arabic marketplace copy.

## Recommended Improvements

- Low: Canonicalize public pricing route. Why it matters: SEO and nav consistency. Proposed solution: link to `/pricing` publicly and keep `/packages` as app/admin vocabulary, or vice versa. Expected UX improvement: clearer IA.

## Estimated Effort
Small

## Design Score
78/100

---

# Community `/community`

## Purpose
Let guests read questions/answers and authenticated users ask or answer marketplace questions.

## Current Components
- Community hero
- Hero stats
- Search
- All/popular tabs
- Popular tags
- Question feed
- Answer composer per question
- Ask question modal
- Guidelines section
- CTA section

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 7 |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 7 |
| Component spacing | 8 |

## Color Review
Consistent module-CSS page with the broader green/dark system. Guidelines icons are well aligned.

## Typography Review
Good content hierarchy. Questions and answers need clear line length; long Arabic paragraphs should use `text-wrap: pretty` or max-width.

## UX Review
Strong public read/auth-to-post behavior. Search and tags are useful. Current error handling uses `alert()` in some flows, which is jarring.

## Responsive Review
Likely good due module CSS. Need verify modal on mobile and tag wrapping.

## Accessibility
Question modal needs focus trap. Alerts should become inline/status messages. Buttons should include pressed/current state.

## Animation Review
Moderate and appropriate.

## Performance
Client fetches community questions and stats. Public API can be cached for guest reads; posting invalidates/refetches.

## Design Consistency
One of the strongest product-community pages. Use it as a pattern for discussion/list pages.

## Recommended Improvements

- High: Replace `alert()` errors with inline form/status messages. Why it matters: alerts disrupt flow and are inconsistent. Proposed solution: form-level error panels. Expected UX improvement: smoother posting.
- High: Add modal accessibility. Why it matters: keyboard users need focus control. Proposed solution: dialog semantics, focus trap, Escape close. Expected UX improvement: WCAG progress.
- Medium: Add URL state for search/tag. Why it matters: shareable community browsing. Proposed solution: query params. Expected UX improvement: stronger content navigation.

## Estimated Effort
Medium

## Design Score
82/100

---

# Question Details `/community/question/[id]`

## Purpose
Show one community question and its answers, and let authenticated users add an answer.

## Current Components
- Back button
- Question card
- Author avatar
- Role/date metadata
- Tags
- Answers list
- Add answer form
- Guest auth action

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 4 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Consistent dark/green palette, but older inline styles. Dicebear external avatars introduce visual style mismatch.

## Typography Review
Question title and body are clear. Answers are readable.

## UX Review
Good basic flow. Missing answer empty state when no answers. Back arrow direction appears questionable in RTL/LTR.

## Responsive Review
Single-column layout is safe. Padding at 100px loading may be too much on mobile.

## Accessibility
Uses raw `img`; alt is present for avatars but generated avatar URLs may be noisy. `alert()` errors should be replaced. Textarea needs explicit label.

## Animation Review
None; acceptable.

## Performance
Client fetch after mount means slower perceived load. Could server-fetch question details.

## Design Consistency
Less polished than `/community`; should reuse CommunityFeed card/detail components.

## Recommended Improvements

- High: Reuse community page card components. Why it matters: list/detail consistency. Proposed solution: shared `QuestionCard`, `AnswerCard`, `AnswerComposer`. Expected UX improvement: coherent discussion UX.
- High: Server-fetch initial question. Why it matters: faster content and SEO. Proposed solution: server page passes data to client answer composer. Expected UX improvement: faster detail rendering.
- Medium: Add empty answers state. Why it matters: invites participation. Proposed solution: “Be the first to answer” panel. Expected UX improvement: higher engagement.

## Estimated Effort
Medium

## Design Score
68/100

---

# Answers UI Pattern

## Purpose
Allow authenticated community members to add responses to questions.

## Current Components
- Inline textareas in feed/detail
- Submit buttons
- Guest auth modal trigger
- Loading/submitting state

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 6 |
| White space | 6 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 5 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 6 |

## Color Review
Consistent enough with community palette.

## Typography Review
Textarea labels/placeholders are readable but need stronger guidance.

## UX Review
Posting is straightforward. Missing markdown/rich text expectations, validation, and optimistic confirmation.

## Responsive Review
Works as simple form; mobile spacing should be tested.

## Accessibility
Needs labels, inline errors, and `aria-live` submit feedback.

## Animation Review
Minimal.

## Performance
Refetch after each answer is acceptable now.

## Design Consistency
Should share a single composer pattern.

## Recommended Improvements

- Medium: Create one reusable AnswerComposer. Why it matters: consistency. Proposed solution: shared component used in feed and detail. Expected UX improvement: predictable posting.

## Estimated Effort
Small

## Design Score
66/100

---

# Login `/login`

## Purpose
Authenticate returning users by email or username.

## Current Components
- Split layout
- Language toggle
- Theme toggle
- Brand/marketing side
- Email/username input
- Password input
- Password visibility toggle
- Forgot password link
- Error message
- Submit button
- Register link
- Floating talent cards/stats

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 7 |
| Icons | 4 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Auth pages use black/gold styling instead of the main dark-green marketplace system. This creates a disconnected brand experience. Muted dark text `#6b7280` may fail contrast on `#111`.

## Typography Review
Readable, but uppercase eyebrow and letter spacing are less Arabic-friendly. Source mojibake must be fixed.

## UX Review
Email/username login is useful. Forgot password link points to a missing route, which is a critical UX break. Error state is generic but acceptable.

## Responsive Review
Mobile switches to single form side; marketing side likely hidden. Good baseline.

## Accessibility
Inputs have labels. Password visibility button lacks clear accessible name. Theme toggle uses emoji only.

## Animation Review
Likely minimal. Floating cards may distract from login.

## Performance
Client-only form is fine. Extra username lookup adds request only when needed.

## Design Consistency
Auth visual system should be reconciled with main brand tokens.

## Recommended Improvements

- Critical: Add `/forgot-password` or remove the link. Why it matters: account recovery is mandatory. Proposed solution: Supabase reset-password flow. Expected UX improvement: users can recover access.
- High: Align auth palette with main tokens. Why it matters: trust continuity. Proposed solution: green primary, gold secondary only for accents. Expected UX improvement: consistent brand.
- High: Add accessible labels to icon controls. Why it matters: screen reader and keyboard support. Proposed solution: `aria-label` for show password/theme/language. Expected UX improvement: WCAG progress.

## Estimated Effort
Medium

## Design Score
66/100

---

# Register `/register`

## Purpose
Create a new talent or brand account.

## Current Components
- Split layout
- Language toggle
- Theme toggle
- Role selector
- Talent/brand category selector
- Full name, email, phone, password, confirm password
- Password strength indicator
- Terms/privacy checkbox
- Error message
- Submit button
- Login link
- Marketing side

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 7 |
| Inputs | 7 |
| Icons | 4 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Same auth-specific gold/black divergence as login. Password strength colors are standard but need labels, not color alone.

## Typography Review
Form hierarchy is clear. Arabic text source is mojibake. Talent/brand category labels are English in Arabic arrays for several options, reducing localization quality.

## UX Review
Registration flow is compact and clear. Role choice appears early. Missing email verification instruction and post-signup state clarity.

## Responsive Review
Mobile form likely works, but long form may need stepped sections.

## Accessibility
Fields are labeled. Password strength should have text and `aria-live`. Checkbox label/links need larger tap target.

## Animation Review
Minimal.

## Performance
Client form and Supabase signup are fine.

## Design Consistency
Should share auth components with login and future forgot-password/reset pages.

## Recommended Improvements

- High: Add step/section grouping for mobile. Why it matters: long forms fatigue phone users. Proposed solution: Account, Role, Security sections or progressive disclosure. Expected UX improvement: better completion.
- High: Add accessible password strength messaging. Why it matters: color alone is insufficient. Proposed solution: text labels and requirement checklist. Expected UX improvement: easier password creation.
- Medium: Fully localize category labels. Why it matters: Arabic-first promise. Proposed solution: Arabic category copy in `TX`. Expected UX improvement: more credible localization.

## Estimated Effort
Medium

## Design Score
68/100

---

# Forgot Password `/forgot-password`

## Purpose
Let users recover account access.

## Current Components
- Missing route

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
Critical broken flow because login links to this route.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should share auth shell with login/register.

## Recommended Improvements

- Critical: Implement password reset request page. Why it matters: account recovery is required for production. Proposed solution: email input, Supabase reset email, success state, resend/back-to-login. Expected UX improvement: users regain access.
- Critical: Implement reset confirmation page if Supabase flow requires it. Why it matters: complete recovery loop. Proposed solution: new password/confirm form. Expected UX improvement: no dead ends.

## Estimated Effort
Medium

## Design Score
0/100

---

# Onboarding `/onboarding`

## Purpose
Intended multi-step onboarding wizard.

## Current Components
- File exists, but AGENTS.md states the implementation is fully commented out/not live.

## UI Review

| Item | Score |
|---|---:|
| Layout | 2 |
| Visual hierarchy | 2 |
| White space | 2 |
| Alignment | 2 |
| Consistency | 2 |
| Card design | 2 |
| Buttons | 2 |
| Inputs | 2 |
| Icons | 2 |
| Border radius | 2 |
| Shadows | 2 |
| Component spacing | 2 |

## Color Review
Inactive/unreliable.

## Typography Review
Inactive.

## UX Review
Registration currently goes to `/profile/me`, so onboarding is not part of the real user journey. Keeping a route for disabled code is confusing.

## Responsive Review
Not applicable until live.

## Accessibility
Not applicable until live.

## Animation Review
Not applicable.

## Performance
Dead route/code can add maintenance risk.

## Design Consistency
Conflicts with profile-completion-based onboarding.

## Recommended Improvements

- High: Decide whether onboarding is removed or restored. Why it matters: first-run activation. Proposed solution: either redirect to `/profile/me` with completion card, or rebuild as a short wizard. Expected UX improvement: clearer new-user journey.

## Estimated Effort
Small if redirect, Large if restored

## Design Score
20/100

---

# Bookings `/bookings`

## Purpose
Let authenticated brands/talents track booking requests and active project agreements.

## Current Components
- Header
- Status tabs
- Count badges
- Empty state
- Booking cards
- Party avatar/name
- Budget/start/duration metadata
- Proposal snippet
- Status badge
- Service type badge
- View details link

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | N/A |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 7 |
| Component spacing | 8 |

## Color Review
Good semantic statuses and restrained palette. CSS module improves consistency.

## Typography Review
Clear headings and metadata hierarchy.

## UX Review
Strong pipeline overview. Empty state explains why the tab is empty. Missing search/filter for high-volume users.

## Responsive Review
Cards are better for mobile than tables. Tabs may require horizontal scroll with many statuses.

## Accessibility
Tabs are buttons inside nav; should include `aria-current` or tab semantics. Avatars with empty alt are acceptable if decorative.

## Animation Review
Minimal.

## Performance
Good for MVP. Server-fetch with private no-cache is correct.

## Design Consistency
One of the best task screens. Use as reference for private dashboard surfaces.

## Recommended Improvements

- Medium: Add search and sort. Why it matters: repeat users will accumulate bookings. Proposed solution: search by party/title and sort by updated/deadline. Expected UX improvement: faster project lookup.
- Medium: Add richer empty-state CTAs. Why it matters: empty tabs can guide next action. Proposed solution: Explore talents or Jobs CTA based on role. Expected UX improvement: better activation.

## Estimated Effort
Medium

## Design Score
82/100

---

# Booking Details `/bookings/[id]`

## Purpose
Guide brand/talent through the full brief, payment, deliverable, review, and chat workflow for one booking.

## Current Components
- Back button
- Project header card
- Status badge
- Brand/talent identities
- Amount
- Metadata grid
- Timeline
- Action panel
- Brief form/view
- Payment action
- Deliverables form/list
- Review form
- Chat button

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 7 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Good semantic colors for pipeline status. Uses local hardcoded palette; muted contrast needs review.

## Typography Review
Compact task hierarchy is good. Some long bilingual status text may wrap unpredictably.

## UX Review
The page handles complex state but could better narrate “what happens next.” Payment copy must match manual confirmation, not actual gateway/escrow.

## Responsive Review
Single-column detail flow should work. Sticky/global chat overlay may conflict with bottom content on mobile.

## Accessibility
Back button direction should flip by language. Form sections need associated error messages. Timeline should be meaningful without color.

## Animation Review
Minimal and appropriate.

## Performance
Private dynamic data is correctly uncached. Refresh-after-action is acceptable.

## Design Consistency
More inline/older than Bookings list. Needs shared status/timeline/action panel primitives.

## Recommended Improvements

- High: Add next-step guidance per status. Why it matters: booking pipeline is complex. Proposed solution: status-specific callout with primary/secondary action. Expected UX improvement: fewer stalled bookings.
- High: Correct payment language. Why it matters: trust/legal accuracy. Proposed solution: “confirm payment” copy until real gateway exists. Expected UX improvement: accurate expectations.
- Medium: Convert repeated `section()` card style into component. Why it matters: consistency and future edits. Proposed solution: `WorkflowSection`. Expected UX improvement: cleaner UI.

## Estimated Effort
Medium

## Design Score
72/100

---

# Chat `/chat`

## Purpose
List conversations and let authenticated users open chat threads.

## Current Components
- Chat layout
- Conversation list
- Chat window or empty selection state
- Message bubbles
- Message input
- Realtime updates

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 6 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 7 |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 6 |

## Color Review
Dark/light local variables are present. Muted colors appear inverted in parts (`#64748b` dark, `#94a3b8` light) and should be checked.

## Typography Review
Compact chat typography is appropriate. Metadata and roles are small but readable.

## UX Review
Realtime, optimistic sending, read marking, and load more are strong. Missing clear offline/error state when send fails; optimistic failed message disappears without explanation.

## Responsive Review
Chat is sensitive on mobile. Conversation list/thread switching needs explicit mobile pattern.

## Accessibility
Message list should announce new messages politely. Message input needs label. Load more button is semantic.

## Animation Review
Auto-scroll uses smooth behavior; should respect reduced motion.

## Performance
Realtime subscription cleans up. Pagination via `before` and limit is good. Large lists still need virtualization later.

## Design Consistency
Separate from newer CSS module screens. Needs a chat-specific but tokenized component system.

## Recommended Improvements

- High: Add failed-send state. Why it matters: users need confidence messages are delivered. Proposed solution: keep failed bubble with retry/delete. Expected UX improvement: safer communication.
- High: Define mobile conversation navigation. Why it matters: chat is phone-heavy. Proposed solution: list view then thread view with clear back. Expected UX improvement: lower confusion.
- Medium: Add accessible live region for incoming messages. Why it matters: screen reader support. Expected UX improvement: WCAG progress.

## Estimated Effort
Medium

## Design Score
70/100

---

# Chat Thread `/chat/[id]`

## Purpose
Direct route to one conversation.

## Current Components
- Conversation shell
- Header with other user
- Message list
- Load more
- Message input
- Realtime read receipts

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 6 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 7 |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 6 |

## Color Review
Same as `/chat`; local palette needs tokenization.

## Typography Review
Chat-appropriate, but role label in gold may be too prominent.

## UX Review
Direct thread route is useful. Needs empty conversation state and failed send retry.

## Responsive Review
Thread height/viewport behavior needs browser QA, especially mobile virtual keyboard.

## Accessibility
Needs message-list semantics, input label, and new-message announcement.

## Animation Review
Smooth scrolling should respect reduced motion.

## Performance
Realtime subscription cleanup is good.

## Design Consistency
Should share exact shell with floating chat widget where feasible.

## Recommended Improvements

- High: Add mobile keyboard-safe layout. Why it matters: message input can be obscured. Proposed solution: viewport units/safe area and tested sticky input. Expected UX improvement: reliable mobile chat.
- Medium: Add conversation empty state. Why it matters: first message needs invitation. Proposed solution: centered prompt with other user's name. Expected UX improvement: better starts.

## Estimated Effort
Medium

## Design Score
70/100

---

# Notifications `/notifications`

## Purpose
Show all account notifications, unread filter, mark-read actions, pagination, and deletion.

## Current Components
- Header
- Mark all as read button
- All/unread tabs
- Notification list
- Notification item actions
- Loading state
- Error state
- Empty state
- Load more

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | N/A |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 6 |
| Component spacing | 8 |

## Color Review
Good green active states and red errors. Uses local colors but consistent with notification bell.

## Typography Review
Clear hierarchy; compact enough for lists.

## UX Review
Good notification management. Loading/error/empty states exist. Filtering unread is useful. Missing bulk delete/archive and notification preferences.

## Responsive Review
Max-width page works well on mobile and desktop.

## Accessibility
Tabs should expose selected state. Mark-as-read/delete item controls need accessible labels. Loading/error should use live regions.

## Animation Review
Minimal.

## Performance
Realtime hook and pagination support are good. Private no-store is correct.

## Design Consistency
Good task surface; should be tokenized.

## Recommended Improvements

- Medium: Add notification preferences link/empty CTA. Why it matters: users want control. Proposed solution: settings entry when settings exists. Expected UX improvement: user trust.
- Medium: Add `aria-live` for unread count/list changes. Why it matters: realtime accessibility. Proposed solution: polite live region around count. Expected UX improvement: screen reader support.

## Estimated Effort
Small

## Design Score
80/100

---

# Dashboard `/dashboard`

## Purpose
Expected authenticated home/dashboard.

## Current Components
- Missing route
- Middleware protects `/dashboard/*`

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
The product has dashboard expectations but routes users to `/profile/me`, `/bookings`, `/chat`, etc. Lack of role-specific dashboard creates weak post-login orientation.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should use Bookings/AdminShell-inspired product layout, not marketing layout.

## Recommended Improvements

- High: Add role-specific dashboard or remove dashboard links/protection. Why it matters: post-login users need a home base. Proposed solution: talent dashboard with completion/applications/bookings; brand dashboard with jobs/applicants/bookings. Expected UX improvement: clearer task entry.

## Estimated Effort
Large

## Design Score
0/100

---

# Favorites `/favorites`

## Purpose
Expected saved talents/jobs list.

## Current Components
- Missing route

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
Favorite actions are referenced in permission requirements but no complete frontend destination exists.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should reuse Explore cards and Bookings empty-state quality.

## Recommended Improvements

- Medium: Implement or remove favorite affordances. Why it matters: users expect saved items to be retrievable. Proposed solution: `/favorites` with saved talent cards, empty state, and auth gate. Expected UX improvement: stronger discovery loop.

## Estimated Effort
Medium

## Design Score
0/100

---

# Payments `/payments`

## Purpose
Expected payment history/status management.

## Current Components
- Missing route
- Middleware protects `/payments/*`

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
Payment is handled inside booking detail only. A standalone payment page is absent, which is acceptable only if nav/copy does not advertise it.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should be a restrained ledger/table if implemented.

## Recommended Improvements

- High: Decide payment IA before launch. Why it matters: money workflows need clarity. Proposed solution: either implement `/payments` ledger or remove protected route expectation. Expected UX improvement: fewer money-related support issues.

## Estimated Effort
Large

## Design Score
0/100

---

# User Settings `/settings`

## Purpose
Expected authenticated user settings.

## Current Components
- Missing route
- Middleware protects `/settings/*`
- Admin settings exists separately at `/admin/settings`

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
Users lack a dedicated place for language/theme persistence explanation, account details, notification settings, and security.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should reuse admin settings form primitives in a public/private shell.

## Recommended Improvements

- Medium: Add account settings or remove the protected route. Why it matters: users need control over account preferences. Proposed solution: settings page with profile basics, notifications, password/security links. Expected UX improvement: stronger account management.

## Estimated Effort
Medium

## Design Score
0/100

---

# Reviews Page

## Purpose
Expected standalone reviews management or listing.

## Current Components
- No user-facing `/reviews` page
- Reviews appear on talent detail, booking detail, and admin reviews moderation

## UI Review

| Item | Score |
|---|---:|
| Layout | 3 |
| Visual hierarchy | 3 |
| White space | 3 |
| Alignment | 3 |
| Consistency | 4 |
| Card design | 5 |
| Buttons | 4 |
| Inputs | 4 |
| Icons | 5 |
| Border radius | 5 |
| Shadows | 4 |
| Component spacing | 4 |

## Color Review
Review cards use gold ratings consistently where present.

## Typography Review
Review text is readable in profile contexts.

## UX Review
Distributed review UX is acceptable. Missing standalone page is not critical unless navigation references it.

## Responsive Review
Profile review cards are mobile-safe.

## Accessibility
Star-only rating strings/icons need screen reader text.

## Animation Review
Minimal.

## Performance
Reviews are loaded with profile/booking contexts; acceptable.

## Design Consistency
Admin review table and public review cards differ appropriately by context.

## Recommended Improvements

- Medium: Standardize rating component. Why it matters: accessibility and consistency. Proposed solution: shared `RatingStars` with aria text. Expected UX improvement: better review comprehension.

## Estimated Effort
Small

## Design Score
60/100

---

# Contests

## Purpose
Requested contest surface.

## Current Components
- Missing route

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
No implemented contest product. Do not include in nav until scoped.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
If built, should not duplicate jobs/campaigns unless there is a distinct contest mechanic.

## Recommended Improvements

- Low: Keep out of navigation until product model exists. Why it matters: avoid dead routes. Proposed solution: define contest lifecycle before UI. Expected UX improvement: fewer broken expectations.

## Estimated Effort
Large

## Design Score
0/100

---

# About `/about`

## Purpose
Explain company mission, vision, process, stats, and CTA.

## Current Components
- About hero
- Mission/vision
- How it works
- Stats
- CTA

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 6 |
| Buttons | 7 |
| Inputs | N/A |
| Icons | 6 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Consistent dark/light background and marketplace accents. Older inline patterns may differ from `/home`.

## Typography Review
Marketing hierarchy is acceptable. Needs Arabic encoding verification.

## UX Review
Basic company story works. Needs more concrete trust proof and less generic “mission/vision” framing.

## Responsive Review
Componentized sections likely support responsive behavior; verify tablet spacing.

## Accessibility
Needs heading-order check and reduced-motion audit if subcomponents animate.

## Animation Review
Likely consistent with marketing pages.

## Performance
Mostly static, should be cacheable.

## Design Consistency
Should align more with `/home` visual richness.

## Recommended Improvements

- Medium: Replace generic stats with concrete platform proof. Why it matters: trust. Proposed solution: real counts or moderated story. Expected UX improvement: more credibility.
- Medium: Unify marketing section system with `/home`. Why it matters: brand consistency. Expected UX improvement: cleaner company pages.

## Estimated Effort
Medium

## Design Score
70/100

---

# Become Talent `/become-talent`

## Purpose
Convert creators into talent registrations.

## Current Components
- Hero
- CTA
- Stats grid
- How it works cards
- Benefits cards
- Talent types grid
- Final CTA

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 5 |
| Card design | 5 |
| Buttons | 7 |
| Inputs | N/A |
| Icons | 3 |
| Border radius | 6 |
| Shadows | 6 |
| Component spacing | 7 |

## Color Review
Uses teal/green gradients, gold, purple, decorative grids. This conflicts with the current restrained token direction and includes gradient text.

## Typography Review
Large hero is effective, but uppercase badge and gradient text are AI/template tells.

## UX Review
Clear conversion page. However, it promises secure payments/escrow while shipped payment is manual, creating trust/legal risk.

## Responsive Review
Stats grid with `repeat(4, 1fr)` needs mobile collapse; if not handled later in file, it will break on phones.

## Accessibility
Emoji icons are not reliable accessible icons. Gradient text can reduce contrast. Motion needs reduced-motion verification.

## Animation Review
Entrance animation is fine, but the page uses decorative motion rather than task state.

## Performance
Mostly static. Framer Motion adds bundle weight.

## Design Consistency
Older marketing page; weaker than current `/home`.

## Recommended Improvements

- Critical: Remove escrow/secure payment claims until product supports them. Why it matters: legal and trust accuracy. Proposed solution: “manual payment confirmation in project flow” or neutral payment copy. Expected UX improvement: honest expectations.
- High: Replace emoji icons and gradient text. Why it matters: premium brand consistency. Proposed solution: lucide icons and solid accent text. Expected UX improvement: more mature visual language.
- High: Fix mobile stats grid. Why it matters: creator audience is phone-first. Proposed solution: responsive grid `auto-fit/minmax`. Expected UX improvement: no overflow.

## Estimated Effort
Medium

## Design Score
58/100

---

# Blog `/blog`

## Purpose
Provide content marketing/articles for brands and talents.

## Current Components
- Hero
- Search
- Category chips
- Static sample post cards
- Empty state
- Coming soon banner

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 3 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Purple becomes dominant on this page, which is not common elsewhere. Decorative grid overlay is an anti-pattern unless made more intentional.

## Typography Review
Good readable blog card hierarchy. Source copy appears mojibake in Arabic.

## UX Review
Search and categories exist, but content is static samples and a “Coming Soon” banner appears despite sample posts. Mixed state is confusing.

## Responsive Review
Auto-fill grid should be acceptable. Search is centered and safe.

## Accessibility
Emoji icons and decorative grid should be hidden from assistive tech where decorative. Search needs label.

## Animation Review
Framer Motion page entrances are okay but not essential.

## Performance
Static posts are cheap. If blog grows, use server/static generation.

## Design Consistency
Feels like a template marketing page, not the same premium marketplace as `/home`.

## Recommended Improvements

- High: Resolve sample-vs-coming-soon contradiction. Why it matters: users need to know if blog is live. Proposed solution: either publish real posts or show a single coming-soon empty state. Expected UX improvement: clearer content trust.
- Medium: Use brand palette rather than isolated purple theme. Why it matters: consistency. Proposed solution: green primary and purple only for categories/premium tags. Expected UX improvement: unified site feel.

## Estimated Effort
Medium

## Design Score
60/100

---

# Contact `/contact`

## Purpose
Let users contact the platform through form, email, or WhatsApp.

## Current Components
- Hero
- Info cards
- Contact form
- Email card
- WhatsApp card/button
- Trust decoration card

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 7 |
| Icons | 4 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Green-centered palette is consistent. Emoji icons reduce premium feel.

## Typography Review
Readable. Heading and body hierarchy work.

## UX Review
Multiple contact paths are good. The form should clearly show success/error and expected response time.

## Responsive Review
Inline style includes CSS media rule for two-column collapse; acceptable but brittle.

## Accessibility
Contact form needs field labels/error association. Emojis should be decorative or replaced.

## Animation Review
Framer Motion entrances are acceptable; not essential.

## Performance
Mostly static plus form. Fine.

## Design Consistency
Older marketing style; align with `/home`.

## Recommended Improvements

- High: Strengthen form states. Why it matters: support requests must feel received. Proposed solution: success receipt, error retry, disabled submit while sending. Expected UX improvement: confidence.
- Medium: Replace emoji cards with lucide icons. Why it matters: brand polish. Expected UX improvement: consistency.

## Estimated Effort
Medium

## Design Score
68/100

---

# Legal Terms `/legal/terms` and `/terms`

## Purpose
Present terms of service.

## Current Components
- Legal hero
- Updated date
- Numbered content cards
- Footer through main layout

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | N/A |
| Inputs | N/A |
| Icons | 5 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 8 |

## Color Review
Green accent and muted cards are consistent. Contrast appears generally safe, but legal body text should be tested.

## Typography Review
Readable long-form layout with good max width. Numbered section markers are acceptable here because legal sections are ordered.

## UX Review
Simple, understandable. Needs table of contents for longer legal content.

## Responsive Review
Single-column card stack is safe.

## Accessibility
Good semantic potential. Need heading order check.

## Animation Review
Animating every legal section may be unnecessary; reduce or remove for legal readability.

## Performance
Static and cacheable.

## Design Consistency
Legal layout is reusable and coherent.

## Recommended Improvements

- Medium: Add table of contents. Why it matters: long legal pages need navigation. Proposed solution: sticky/inline anchor list. Expected UX improvement: faster scanning.
- Low: Reduce motion. Why it matters: legal reading should be calm. Expected UX improvement: less distraction.

## Estimated Effort
Small

## Design Score
74/100

---

# Legal Privacy `/legal/privacy` and `/privacy`

## Purpose
Explain privacy policy.

## Current Components
- Shared LegalLayout
- Policy sections
- Updated date

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | N/A |
| Inputs | N/A |
| Icons | 5 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 8 |

## Color Review
Same as legal terms.

## Typography Review
Good readable long-form style.

## UX Review
Straightforward. Needs anchors for key sections and contact/privacy requests.

## Responsive Review
Good single-column.

## Accessibility
Mostly good; heading order and reduced motion need verification.

## Animation Review
Section entrance motion is optional.

## Performance
Static/cacheable.

## Design Consistency
Consistent with other legal pages.

## Recommended Improvements

- Medium: Add privacy action links. Why it matters: users need data request path. Proposed solution: contact link and request categories. Expected UX improvement: clearer compliance UX.

## Estimated Effort
Small

## Design Score
74/100

---

# Legal Cookies `/legal/cookies` and `/cookies`

## Purpose
Explain cookie usage.

## Current Components
- Shared LegalLayout
- Cookie policy sections
- Updated date

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | N/A |
| Inputs | N/A |
| Icons | 5 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 8 |

## Color Review
Consistent with LegalLayout.

## Typography Review
Readable.

## UX Review
Policy is present. If cookies beyond essential/localStorage are used, add preferences management.

## Responsive Review
Good.

## Accessibility
Good baseline; table of contents would help.

## Animation Review
Not needed.

## Performance
Static/cacheable.

## Design Consistency
Consistent legal pattern.

## Recommended Improvements

- Low: Add cookie preference path if non-essential cookies exist. Why it matters: compliance. Proposed solution: preferences component or support contact. Expected UX improvement: user control.

## Estimated Effort
Small

## Design Score
74/100

---

# Blocked `/blocked`

## Purpose
Explain account suspension/block status and provide support/sign-out actions.

## Current Components
- Centered status card
- Error icon
- Bilingual title/body
- Reason panel
- Support email
- Sign out button

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | N/A |
| Icons | 3 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Red error state is clear and appropriate. Hardcoded local theme.

## Typography Review
Bilingual text is readable, but mixing Arabic and English in one paragraph can be improved.

## UX Review
Clear enough. Needs reason-specific language and appeal/contact guidance.

## Responsive Review
Centered card is mobile-safe.

## Accessibility
Emoji icon should be hidden from assistive tech or replaced. Reason should be announced as important status.

## Animation Review
None.

## Performance
Lightweight.

## Design Consistency
Looks like older inline card, but acceptable for rare error state.

## Recommended Improvements

- High: Add reason-specific guidance. Why it matters: blocked users need next step. Proposed solution: map reason/status to support instructions. Expected UX improvement: fewer support escalations.
- Medium: Replace emoji with accessible icon. Why it matters: professional error state. Expected UX improvement: clearer severity.

## Estimated Effort
Small

## Design Score
68/100

---

# Admin Dashboard `/admin`

## Purpose
Give admins quick operational metrics.

## Current Components
- AdminShell
- Sidebar/topbar
- Dashboard cards for pending/approved/rejected/suspended/brands/bookings/reviews

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | N/A |
| Inputs | N/A |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 6 |
| Component spacing | 8 |

## Color Review
Status colors are meaningful. Multiple colors are acceptable in admin metrics.

## Typography Review
Compact and readable.

## UX Review
Good overview but shallow. Needs trends, pending moderation queues, and critical alerts.

## Responsive Review
Auto-fill grid should work. Sidebar behavior needs mobile audit.

## Accessibility
Metric cards need text labels; icon-only is supplementary. Good baseline.

## Animation Review
Minimal.

## Performance
Server fetched stats are efficient.

## Design Consistency
AdminShell creates a coherent back-office language.

## Recommended Improvements

- Medium: Add queue shortcuts. Why it matters: admins act on exceptions. Proposed solution: cards link to filtered tables. Expected UX improvement: faster moderation.
- Medium: Add trend/time context. Why it matters: raw totals lack urgency. Proposed solution: pending today/this week deltas. Expected UX improvement: better operations.

## Estimated Effort
Medium

## Design Score
78/100

---

# Admin Talents `/admin/talents`

## Purpose
Moderate talent profiles and manage approval/suspension/deletion.

## Current Components
- AdminShell
- Status filters
- Results count
- Talent table
- Avatar/name/verified
- Status badge
- View/edit/action icons
- Confirmation modal
- Reason textarea
- Pagination
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Status colors are clear. Inline styles differ from newer admin package CSS modules.

## Typography Review
Table typography is dense and appropriate. Long names/categories can overflow.

## UX Review
Core moderation actions are available. Missing search, bulk actions, and better destructive-action safeguards.

## Responsive Review
Horizontal scroll table is acceptable for admin, but mobile moderation remains cramped.

## Accessibility
Icon-only action buttons use `title`; should add `aria-label`. Table headers are semantic.

## Animation Review
Minimal.

## Performance
Client pagination over initial dataset. Could need server pagination.

## Design Consistency
Good admin pattern, but should share button/table primitives.

## Recommended Improvements

- High: Add search. Why it matters: admin lists grow quickly. Proposed solution: name/handle/category search. Expected UX improvement: faster moderation.
- High: Add accessible names to action buttons. Why it matters: icon-only controls. Expected UX improvement: WCAG progress.
- Medium: Add server pagination/filtering. Why it matters: performance at scale. Expected UX improvement: faster admin loads.

## Estimated Effort
Medium

## Design Score
74/100

---

# Admin Talent Editor `/admin/talents/[id]`

## Purpose
Let admins edit a talent profile directly.

## Current Components
- AdminShell
- Back button
- Basic info form
- Availability select
- Packages JSON textarea
- Social/extra JSON textarea
- Save bar
- JSON validation messages

## UI Review

| Item | Score |
|---|---:|
| Layout | 6 |
| Visual hierarchy | 6 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 5 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 6 |
| Icons | 6 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Consistent admin colors, local inline values.

## Typography Review
Readable. Monospace JSON is compact.

## UX Review
Functional but risky: editing packages/social links as raw JSON is an expert-only affordance and easy to break.

## Responsive Review
Two-column fields need mobile collapse. JSON textareas are usable but long.

## Accessibility
Inputs have labels. JSON errors are visible but should be linked to fields.

## Animation Review
None.

## Performance
Lightweight.

## Design Consistency
Much rougher than user profile package editor and admin packages editor.

## Recommended Improvements

- High: Replace raw JSON with structured editors. Why it matters: admins can corrupt public profiles. Proposed solution: reuse package/social field components. Expected UX improvement: safer support actions.
- Medium: Add preview link. Why it matters: admins need to verify public impact. Proposed solution: open `/talent/[handle]`. Expected UX improvement: faster QA.

## Estimated Effort
Large

## Design Score
60/100

---

# Admin Brands `/admin/brands`

## Purpose
Approve/reject brands and block/unblock accounts.

## Current Components
- AdminShell
- Status filters
- Brand table
- Tax document links
- Approval/account status badges
- Action icons
- Confirmation modal
- Reason fields
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Semantic statuses are clear. Good distinction between brand approval and account status.

## Typography Review
Dense admin typography works.

## UX Review
Core flow is present. Missing search, pagination, and tax-document preview safety.

## Responsive Review
Horizontal scroll table only; acceptable but not ideal.

## Accessibility
Icon-only action buttons need labels. External document links should have descriptive text.

## Animation Review
Minimal.

## Performance
Needs server pagination at scale.

## Design Consistency
Consistent with admin table family.

## Recommended Improvements

- High: Add search and pagination. Why it matters: brand list will grow. Proposed solution: server/query filters. Expected UX improvement: faster admin work.
- Medium: Improve document review. Why it matters: tax docs are sensitive. Proposed solution: clear secure preview/download labels and audit state. Expected UX improvement: safer moderation.

## Estimated Effort
Medium

## Design Score
74/100

---

# Admin Bookings `/admin/bookings`

## Purpose
Monitor and manually move bookings through the project pipeline.

## Current Components
- AdminShell
- Pipeline filters
- Booking table
- Status badges
- Prev/next/cancel actions
- Pagination
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | N/A |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Pipeline colors are clear but numerous. Need ensure status color does not carry meaning alone.

## Typography Review
Readable table labels. Amount uses `$` in code while product currency is EGP; design/copy inconsistency.

## UX Review
Manual stage movement is powerful but risky. Needs confirmation or audit text for destructive/cancel transitions.

## Responsive Review
Horizontal scroll table. Fine for desktop admins; mobile is cramped.

## Accessibility
Action icons need labels. Status labels include text, good.

## Animation Review
Opacity loading is acceptable.

## Performance
Client pagination; server pagination later.

## Design Consistency
Consistent admin table pattern.

## Recommended Improvements

- Critical: Fix currency display to EGP. Why it matters: product market/currency trust. Proposed solution: use configured currency and locale format. Expected UX improvement: avoids money confusion.
- High: Add transition confirmation/audit reason for cancel/manual moves. Why it matters: admin actions affect payments/bookings. Proposed solution: confirmation modal for backwards/cancel. Expected UX improvement: safer operations.

## Estimated Effort
Medium

## Design Score
70/100

---

# Admin Reviews `/admin/reviews`

## Purpose
Moderate reviews before they become public.

## Current Components
- AdminShell
- Status filters
- Reviews table
- Star display
- Proof link
- Comment truncation
- Approve/reject/delete actions
- Confirmation modal
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | N/A |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Gold stars and semantic moderation colors work.

## Typography Review
Table is readable; comment truncation prevents layout break but hides context.

## UX Review
Moderation basics are present. Needs full comment expansion and proof preview.

## Responsive Review
Horizontal table is acceptable for admin desktop.

## Accessibility
Star string should include accessible rating text. Icon actions need labels.

## Animation Review
Minimal.

## Performance
Fine for MVP; add pagination if large.

## Design Consistency
Consistent with admin tables.

## Recommended Improvements

- High: Add review detail/expand pattern. Why it matters: moderation requires context. Proposed solution: row expansion or detail panel. Expected UX improvement: safer decisions.
- Medium: Accessible star rating. Why it matters: screen readers need rating value. Proposed solution: `aria-label="4 out of 5"`. Expected UX improvement: WCAG progress.

## Estimated Effort
Medium

## Design Score
72/100

---

# Admin Verifications `/admin/verifications`

## Purpose
Review talent verification submissions.

## Current Components
- AdminShell
- Status filters
- Verification table
- Avatar/name/verified
- ID document link
- Selfie link
- Social proof link
- Approve/reject modal
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 7 |
| Buttons | 6 |
| Inputs | 6 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Semantic status colors are clear. Sensitive document links use blue; acceptable.

## Typography Review
Dense and readable.

## UX Review
Works for basic moderation, but document review should use secure preview with enough context rather than opening scattered links.

## Responsive Review
Horizontal table is desktop-oriented.

## Accessibility
Icon links need descriptive text. Verification icon needs label.

## Animation Review
Minimal.

## Performance
Fine for MVP.

## Design Consistency
Consistent admin table pattern.

## Recommended Improvements

- High: Add verification detail drawer. Why it matters: admins need compare ID/selfie/social proof together. Proposed solution: secure side panel with images and actions. Expected UX improvement: better moderation accuracy.
- Medium: Add rejection templates. Why it matters: clear user feedback. Proposed solution: common reason chips plus custom text. Expected UX improvement: faster admin responses.

## Estimated Effort
Medium

## Design Score
72/100

---

# Admin Packages `/admin/packages`

## Purpose
Create and manage platform subscription packages, plans, target categories, and features.

## Current Components
- AdminShell
- Package list panel
- Package editor panel
- Active toggle
- Target category chips
- Plan duration/price rows
- Feature key/value rows
- Save action
- Status messages

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 8 |
| Icons | 7 |
| Border radius | 8 |
| Shadows | 6 |
| Component spacing | 8 |

## Color Review
CSS module style is cleaner than older admin pages. Good active/inactive semantics.

## Typography Review
Good admin form hierarchy.

## UX Review
Clear two-panel editor. Feature keys are still technical; non-technical admins may struggle.

## Responsive Review
Two-panel layout needs mobile collapse; likely supported by module CSS but should be verified.

## Accessibility
Fields are labeled. Chips/toggles need selected state semantics.

## Animation Review
Minimal.

## Performance
Good local state. Admin private no-cache is correct.

## Design Consistency
One of the strongest admin CRUD screens.

## Recommended Improvements

- Medium: Make feature editing less technical. Why it matters: admins should not need internal keys. Proposed solution: feature picker with labels/descriptions. Expected UX improvement: fewer configuration mistakes.
- Medium: Add delete/duplicate package affordances if business needs. Why it matters: package lifecycle. Expected UX improvement: faster admin operations.

## Estimated Effort
Medium

## Design Score
82/100

---

# Admin Categories `/admin/categories`

## Purpose
Manage marketplace categories used by talents, brands, packages, and matching.

## Current Components
- AdminShell
- Category list panel
- Category editor
- Role type select
- Arabic/English labels
- Description
- Sort order
- Active toggle
- Save action
- Status message

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 8 |
| Icons | 6 |
| Border radius | 8 |
| Shadows | 6 |
| Component spacing | 8 |

## Color Review
Consistent with AdminPackages module.

## Typography Review
Clear form typography.

## UX Review
Good CRUD editor. Missing validation detail around ID format and role changes.

## Responsive Review
Two-panel layout needs mobile verification.

## Accessibility
Labels are present. Active list selection should expose state.

## Animation Review
Minimal.

## Performance
Good.

## Design Consistency
Strong admin form pattern.

## Recommended Improvements

- Medium: Add ID validation/help text. Why it matters: category IDs become API/data keys. Proposed solution: lowercase slug hint and validation. Expected UX improvement: fewer broken categories.
- Low: Add drag reorder. Why it matters: sort order is visual. Proposed solution: list drag handles or up/down buttons. Expected UX improvement: easier category ordering.

## Estimated Effort
Small

## Design Score
82/100

---

# Admin Notifications `/admin/notifications`

## Purpose
Let admins broadcast notifications to one user, multiple users, roles, categories, or everyone.

## Current Components
- AdminShell
- Audience mode segmented controls
- User search and selected recipients
- Role/category selectors
- Type selector
- Priority selector
- Arabic/English title/message fields
- Action URL
- Expiration
- Reach preview
- Notification preview
- Send action
- Send history
- Load more
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 7 |
| Alignment | 8 |
| Consistency | 7 |
| Card design | 8 |
| Buttons | 7 |
| Inputs | 8 |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 6 |
| Component spacing | 7 |

## Color Review
Priority colors are meaningful. Green send action is consistent. Dense form still needs clear error colors.

## Typography Review
Good admin form hierarchy; bilingual labels are explicit.

## UX Review
Feature-complete and operationally useful. Scheduling is not implemented beyond expiration; label should not imply scheduling. User search debounce is good.

## Responsive Review
Likely dense on mobile; admin notification composition benefits from desktop.

## Accessibility
Segmented controls/selectors need semantic selected state. Preview should be labelled. Error notice should be `role=alert`.

## Animation Review
Minimal.

## Performance
Debounced recipient search and paginated history are good.

## Design Consistency
Good admin utility surface. Should be converted to shared admin form components.

## Recommended Improvements

- High: Add explicit scheduling status. Why it matters: product requirement mentions scheduling if implemented; current UI supports expiration only. Proposed solution: either add schedule field or document “send now only.” Expected UX improvement: fewer admin mistakes.
- Medium: Add recipient count loading state. Why it matters: reach preview may lag. Proposed solution: small skeleton/spinner beside count. Expected UX improvement: clearer feedback.
- Medium: Add semantic selected states. Why it matters: accessibility. Expected UX improvement: keyboard/screen reader support.

## Estimated Effort
Medium

## Design Score
80/100

---

# Admin Trusted Brands `/admin/trusted-brands`

## Purpose
Manage homepage Trusted By marquee brands.

## Current Components
- AdminShell
- Brand list panel
- Drag handles
- Active/inactive status pills
- Brand editor panel
- Name field
- Logo URL field
- Cloudinary upload
- Website URL field
- Display order
- Active checkbox
- Preview
- Save/delete/toggle actions
- Status messages
- Empty state

## UI Review

| Item | Score |
|---|---:|
| Layout | 8 |
| Visual hierarchy | 8 |
| White space | 8 |
| Alignment | 8 |
| Consistency | 8 |
| Card design | 8 |
| Buttons | 8 |
| Inputs | 8 |
| Icons | 8 |
| Border radius | 8 |
| Shadows | 6 |
| Component spacing | 8 |

## Color Review
Consistent with newer admin CRUD pages. Preview supports dark logo use.

## Typography Review
Clear labels and concise helper text.

## UX Review
Complete CRUD flow. Drag-and-drop reorder works for pointer devices; mobile reorder fallback is missing.

## Responsive Review
Responsive module CSS is expected, but drag-and-drop on touch devices is weak.

## Accessibility
Native drag-and-drop is not keyboard-friendly. Need up/down buttons or reorder controls with labels.

## Animation Review
Minimal.

## Performance
Fine. Upload only on admin action. Public side is cached.

## Design Consistency
Strong admin CRUD pattern.

## Recommended Improvements

- High: Add keyboard/touch reorder fallback. Why it matters: drag-and-drop alone is inaccessible. Proposed solution: up/down buttons and `aria-live` reorder feedback. Expected UX improvement: accessible ordering.
- Medium: Add logo contrast checker/preview. Why it matters: marquee forces white logos. Proposed solution: preview on dark marquee background. Expected UX improvement: better homepage brand quality.

## Estimated Effort
Small

## Design Score
82/100

---

# Admin Settings `/admin/settings`

## Purpose
Let admins edit their own profile/avatar.

## Current Components
- AdminShell
- Profile card
- Avatar upload
- Full name
- Handle
- City
- Bio
- Email read-only note
- Save state

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 7 |
| Icons | 7 |
| Border radius | 7 |
| Shadows | 5 |
| Component spacing | 7 |

## Color Review
Consistent admin colors, inline styled.

## Typography Review
Readable, but uppercase labels with letter spacing are not ideal for Arabic.

## UX Review
Works for profile basics. Missing password/security, notification preferences, and audit info.

## Responsive Review
Single card is safe on mobile.

## Accessibility
Fields are labelled. Avatar upload button needs clear accessible name.

## Animation Review
None.

## Performance
Light.

## Design Consistency
Should use the same field components as admin package/category editors.

## Recommended Improvements

- Medium: Expand settings IA. Why it matters: admin account management needs security. Proposed solution: profile, security, notifications sections. Expected UX improvement: stronger admin control.
- Low: Convert to shared admin form styles. Why it matters: consistency. Expected UX improvement: less visual drift.

## Estimated Effort
Medium

## Design Score
70/100

---

# Admin Users

## Purpose
Expected general user management surface.

## Current Components
- No `/admin/users` page
- User status mutations exist via API and are surfaced through Admin Brands/Talents

## UI Review

| Item | Score |
|---|---:|
| Layout | 2 |
| Visual hierarchy | 2 |
| White space | 2 |
| Alignment | 2 |
| Consistency | 2 |
| Card design | 2 |
| Buttons | 2 |
| Inputs | 2 |
| Icons | 2 |
| Border radius | 2 |
| Shadows | 2 |
| Component spacing | 2 |

## Color Review
Missing dedicated UI.

## Typography Review
Missing.

## UX Review
Admins can manage talents/brands separately, but no cross-role user search exists.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Would reuse admin table pattern.

## Recommended Improvements

- Medium: Add unified user search if support needs it. Why it matters: admins need find-by-email/handle across roles. Proposed solution: `/admin/users` table with role/status filters. Expected UX improvement: faster support.

## Estimated Effort
Medium

## Design Score
20/100

---

# Admin Jobs

## Purpose
Expected admin job moderation surface.

## Current Components
- No `/admin/jobs` page
- Admin bookings and brand approvals exist
- Job migration/debug API routes exist

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
No admin job moderation UI. If jobs can be abused publicly, this is an operations gap.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should use admin table pattern.

## Recommended Improvements

- High: Add admin jobs moderation if jobs are public. Why it matters: public job board trust. Proposed solution: `/admin/jobs` with status, brand, report count, approve/close/remove. Expected UX improvement: safer marketplace.

## Estimated Effort
Medium

## Design Score
0/100

---

# Admin Reports

## Purpose
Expected reporting/abuse moderation surface.

## Current Components
- Missing route

## UI Review

| Item | Score |
|---|---:|
| Layout | 1 |
| Visual hierarchy | 1 |
| White space | 1 |
| Alignment | 1 |
| Consistency | 1 |
| Card design | 1 |
| Buttons | 1 |
| Inputs | 1 |
| Icons | 1 |
| Border radius | 1 |
| Shadows | 1 |
| Component spacing | 1 |

## Color Review
Missing.

## Typography Review
Missing.

## UX Review
No visible abuse/report handling UI.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should use admin moderation patterns.

## Recommended Improvements

- Medium: Add only if report model exists. Why it matters: avoid empty admin nav. Proposed solution: define reports table/events first. Expected UX improvement: purposeful admin IA.

## Estimated Effort
Large

## Design Score
0/100

---

# Admin CMS

## Purpose
Expected content management for marketing/blog/static content.

## Current Components
- No `/admin/cms` page
- Blog content is static in code
- Homepage system design media is partly localStorage/IndexedDB-based
- Trusted brands now have admin management

## UI Review

| Item | Score |
|---|---:|
| Layout | 2 |
| Visual hierarchy | 2 |
| White space | 2 |
| Alignment | 2 |
| Consistency | 2 |
| Card design | 2 |
| Buttons | 2 |
| Inputs | 2 |
| Icons | 2 |
| Border radius | 2 |
| Shadows | 2 |
| Component spacing | 2 |

## Color Review
Missing dedicated UI.

## Typography Review
Missing.

## UX Review
Trusted brands are admin-managed, but blog/home content is still code-managed or local-only. This limits non-engineer content updates.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Should follow admin CRUD two-panel patterns.

## Recommended Improvements

- Medium: Add CMS only after content model is defined. Why it matters: avoid ad-hoc localStorage design edits. Proposed solution: admin-managed hero media, testimonials, FAQs, blog posts. Expected UX improvement: safer content updates.

## Estimated Effort
Large

## Design Score
20/100

---

# Modals

## Purpose
Support protected actions, direct booking briefs, apply flow, confirmations, physical info editing, community question creation, and admin moderation.

## Current Components
- Auth modal via GuestGuard/ProtectedAction
- DirectBriefModal
- ApplyModal
- ConfirmationModal
- Physical info modal
- Reject reason modal
- Community ask modal

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 7 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 6 |
| Card design | 7 |
| Buttons | 7 |
| Inputs | 7 |
| Icons | 6 |
| Border radius | 7 |
| Shadows | 7 |
| Component spacing | 7 |

## Color Review
Mostly dark cards with green/gold/red actions. Some modals use CSS modules, others inline styles.

## Typography Review
Readable but inconsistent title/label sizes.

## UX Review
Protected action auth modal is a strong pattern. Confirmation modals are necessary for admin actions. Some form modals need better validation and success feedback.

## Responsive Review
Mobile modal fit and scroll containment need QA.

## Accessibility
Highest risk area: focus trap, Escape close, return focus, `aria-modal`, and labelled dialog must be verified for every modal.

## Animation Review
AnimatePresence use is fine if reduced-motion is honored.

## Performance
Mounted conditionally; acceptable.

## Design Consistency
Needs one modal component vocabulary.

## Recommended Improvements

- Critical: Standardize modal accessibility. Why it matters: modals can trap or lose keyboard users. Proposed solution: shared Dialog component with focus trap and labels. Expected UX improvement: WCAG compliance.
- High: Standardize modal sizes/actions. Why it matters: destructive and form flows need predictable controls. Proposed solution: small confirm, medium form, large workflow variants. Expected UX improvement: lower cognitive load.

## Estimated Effort
Medium

## Design Score
68/100

---

# Loading Screens

## Purpose
Show loading states for route transitions, data fetches, and server/client hydration.

## Current Components
- No App Router `loading.tsx` files
- Component-level loading text
- Package skeleton component
- Admin loading skeleton component
- Trusted Brands skeleton
- Notification loading state
- Community loading state

## UI Review

| Item | Score |
|---|---:|
| Layout | 4 |
| Visual hierarchy | 4 |
| White space | 5 |
| Alignment | 5 |
| Consistency | 3 |
| Card design | 4 |
| Buttons | N/A |
| Inputs | N/A |
| Icons | 4 |
| Border radius | 5 |
| Shadows | 4 |
| Component spacing | 4 |

## Color Review
Loading states inherit local palettes and are inconsistent.

## Typography Review
Many loading states are plain centered text; skeletons are better where used.

## UX Review
Missing route-level loading means slow server pages can feel blank. Component states vary.

## Responsive Review
Text loaders work but skeleton layout is better on mobile.

## Accessibility
Loading states should use `aria-busy` or `role=status` where appropriate.

## Animation Review
Skeletons should respect reduced motion.

## Performance
Skeletons improve perceived performance without extra requests.

## Design Consistency
Needs route and component loading standards.

## Recommended Improvements

- High: Add route-level loading for major dynamic routes. Why it matters: blank transitions feel broken. Proposed solution: `loading.tsx` for explore, jobs, bookings, chat, notifications, admin. Expected UX improvement: perceived speed.
- Medium: Standardize skeleton primitives. Why it matters: consistent loading UX. Proposed solution: `Skeleton`, `CardSkeleton`, `TableSkeleton`. Expected UX improvement: less jarring waits.

## Estimated Effort
Medium

## Design Score
42/100

---

# Empty States

## Purpose
Explain empty lists and guide users toward useful next actions.

## Current Components
- Admin `EmptyState`
- Bookings empty panel
- Notifications empty panel
- Packages empty state
- Community/blog empty states
- Profile portfolio/no media text

## UI Review

| Item | Score |
|---|---:|
| Layout | 7 |
| Visual hierarchy | 6 |
| White space | 7 |
| Alignment | 7 |
| Consistency | 5 |
| Card design | 6 |
| Buttons | 5 |
| Inputs | N/A |
| Icons | 5 |
| Border radius | 6 |
| Shadows | 5 |
| Component spacing | 6 |

## Color Review
Mostly muted text and green icons; acceptable but inconsistent.

## Typography Review
Usually readable. Some empty states are just one sentence and miss a next action.

## UX Review
Several empty states explain the absence well. Many do not include role-specific CTA.

## Responsive Review
Generally safe.

## Accessibility
Decorative icons should be hidden. Status should be announced when resulting from filtering.

## Animation Review
Minimal.

## Performance
No issue.

## Design Consistency
Needs one empty-state component with title, body, icon, and optional CTA.

## Recommended Improvements

- High: Add CTAs to high-value empty states. Why it matters: empty screens should activate users. Proposed solution: role-aware CTA for bookings, jobs, portfolio, favorites. Expected UX improvement: better conversion.
- Medium: Standardize empty-state component. Why it matters: consistency. Expected UX improvement: cleaner UI.

## Estimated Effort
Small

## Design Score
66/100

---

# Error Pages

## Purpose
Handle not found, route errors, and app failures gracefully.

## Current Components
- No `error.tsx`
- No `not-found.tsx`
- Some pages call `notFound()` but rely on Next default
- Inline error text/alerts in components
- `/blocked` custom account error state

## UI Review

| Item | Score |
|---|---:|
| Layout | 2 |
| Visual hierarchy | 2 |
| White space | 2 |
| Alignment | 2 |
| Consistency | 2 |
| Card design | 2 |
| Buttons | 2 |
| Inputs | N/A |
| Icons | 2 |
| Border radius | 2 |
| Shadows | 2 |
| Component spacing | 2 |

## Color Review
No consistent error palette beyond red inline usage.

## Typography Review
Default Next error pages will not match brand.

## UX Review
Critical gap for production. Users need branded 404, recoverable error, and route-specific retry paths.

## Responsive Review
Missing.

## Accessibility
Missing.

## Animation Review
Missing.

## Performance
N/A.

## Design Consistency
Unbranded default error surfaces break trust.

## Recommended Improvements

- Critical: Add global `not-found.tsx` and `error.tsx`. Why it matters: production users will hit bad links/errors. Proposed solution: branded recovery pages with home/explore/contact actions. Expected UX improvement: fewer dead ends.
- High: Replace component `alert()` with inline errors. Why it matters: consistency and accessibility. Expected UX improvement: smoother recovery.

## Estimated Effort
Medium

## Design Score
20/100

---

# Global Design System Audit

## Inconsistent Colors

Detected patterns:

- Token primary in `globals.css`: `--color-primary: #0f766e`.
- Legacy/token teal aliases: `#00C9B1`.
- De-facto component primary: `#00D26A`.
- Gold variants: `#FFB800`, `#F4B740`, `#d7a84f`.
- Background variants: `#050B12`, `#060d18`, `#070b10`, `#0A121C`, `#0D1623`, `#090e1a`.
- Error red variants: `#EF4444`, `#ef4444`, `#df3f4d`.
- Purple appears as page theme on Blog and premium packages but not consistently elsewhere.

Recommendation: define one canonical semantic palette and migrate page-local constants gradually.

## Inconsistent Spacing

Common values include 4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 28, 32, 36, 40, 48, 56, 60, 70, 80, 90, 100. The token scale exists but inline styles bypass it.

Recommendation: use `--space-*` for CSS modules and shared component props for inline legacy pages until migrated.

## Inconsistent Font Sizes

Inline pages use raw `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `20px`, `22px`, `26px`, `28px`, `32px`, and many `clamp()` values. Product UI should use fixed token sizes; marketing pages can use controlled display sizes.

## Inconsistent Shadows

Some buttons use glow shadows (`rgba(255,184,0,0.35)`), cards use soft shadows, many cards use no shadow. Border + large glow appears in older marketing pages.

## Inconsistent Border Radius

Radii range from 6 to 20+ on cards. Auth uses 6/8, product pages 10/12/14/16/18/20, pills use 20/100/999.

## Duplicated Components

- Listing pages: Explore, Jobs, Brands duplicate hero/search/filter/grid patterns.
- Admin tables: Talents, Brands, Reviews, Bookings, Verifications duplicate filter/table/action styles.
- Form pages: Profile, Create Job, Admin Settings, Admin Talent Editor duplicate field primitives.
- Modals: confirmation, apply, brief, ask question, physical info use separate implementations.
- Empty states and loading states are inconsistent.

## Duplicated CSS/UI Patterns

- Inline local color constants in many client components.
- Repeated card style: `backgroundColor: CARD`, `border`, `borderRadius: 16`, `padding`.
- Repeated pill tabs with active green/gold status.
- Repeated centered marketing hero with badge, large headline, gradient/accent word, subtitle.

---

# Proposed Unified Design System

## Typography

- Font family: `Cairo` for all UI and body.
- Display family: `Changa` only for marketing H1/H2, never admin/table/form labels.
- Product scale:
  - `xs`: 12px
  - `sm`: 13px
  - `base`: 14px
  - `md`: 16px
  - `lg`: 18px
  - `xl`: 22px
  - `2xl`: 28px
- Marketing scale:
  - Hero H1 max 60px desktop, 34px mobile
  - Section H2 max 36px desktop, 24px mobile
- Line height:
  - Labels: 1.3
  - UI/body: 1.5-1.7
  - Long prose: 1.8

## Color Palette

Use semantic tokens:

| Role | Dark | Light | Usage |
|---|---|---|---|
| Page | `#070B10` | `#F7F8F8` | body |
| Surface | `#101720` | `#FFFFFF` | panels |
| Card | `#141D27` | `#FFFFFF` | cards |
| Field | `#0C1219` | `#F8FAFC` | inputs |
| Border | `rgba(255,255,255,.10)` | `rgba(16,24,32,.10)` | dividers |
| Text | `#F7FAFC` | `#101820` | primary |
| Muted | `#C4CCD6` | `#40505F` | body secondary |
| Subtle | `#8996A5` | `#6C7A86` | metadata only |
| Primary | `#00D26A` | `#0F8A4A` | primary actions |
| Gold | `#FFB800` | `#B77900` | ratings/VIP |
| Info | `#60A5FA` | `#2563EB` | links/info |
| Warning | `#F4B740` | `#B77900` | caution |
| Error | `#EF4444` | `#DC2626` | destructive |
| Purple | `#8B5CF6` | `#6D28D9` | premium only |

Rules:

- Green is primary action and selected state.
- Gold is ratings and money-adjacent highlights only.
- Red is destructive/error only.
- Purple is premium/package only.
- Avoid green text smaller than 14px on white unless darkened.

## Spacing Scale

- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
- Cards: 16-24 internal padding
- Page shell: 24 desktop, 16 mobile
- Section rhythm: 64-80 marketing, 24-40 product/admin

## Border Radius Scale

- `xs`: 6px for small controls
- `sm`: 8px for inputs/buttons
- `md`: 12px for cards
- `lg`: 16px for prominent panels/modals
- `xl`: 20px only for hero/marketing feature panels
- `pill`: 999px for badges/chips

## Shadow Scale

- Product default: border-first, no shadow.
- Hover card: `0 14px 34px rgba(0,0,0,.22)` max.
- Modal: `0 24px 70px rgba(0,0,0,.32)`.
- Avoid pairing 1px border with large decorative glow except primary marketing CTAs.

## Container Widths

- Narrow content: 760-820px
- Detail pages: 900-960px
- Product shell: 1200px
- Marketplace listings: 1440px
- Marketing full sections: 1200-1280px inner
- Admin shell content: fluid with 24px padding, max only for forms

## Button Variants

- Primary: green fill, dark text, 8-10px radius, 44px min height.
- Secondary: transparent/surface fill, border, text primary.
- Quiet: no fill, muted text, hover surface.
- Destructive: red tint or red fill depending severity.
- Icon: 36-40px min desktop, 44px touch mobile, always `aria-label`.
- Loading: disabled with spinner/text, no layout shift.

## Input Variants

- Standard field: label, input, helper/error text.
- Search field: icon + input, clear button if populated.
- Textarea: min 120px, resize vertical.
- Select: consistent arrow and height.
- File upload: visible dropzone/button, accepted types, progress, error.

## Card Variants

- Listing card: image/avatar, title, metadata, proof, primary action.
- Info card: icon, heading, body.
- Admin row/card: dense, low shadow, strong alignment.
- Empty card: icon, title, body, optional CTA.
- Avoid nested cards unless the inner card is a real repeated item.

## Modal Style

- Shared Dialog with backdrop, focus trap, Escape close, return focus.
- Sizes: small confirm 420px, form 560px, workflow 720px.
- Header, body, footer structure.
- Destructive action on far end; cancel always visible.
- Mobile: full-width bottom sheet or 16px inset modal.

## Badge Style

- Pill radius.
- Text label required; color never alone.
- Status tone map: success, warning, error, info, neutral, premium.

## Alert Style

- Inline panel, not browser `alert()`.
- Roles: `status` for success/info, `alert` for errors.
- Include title, message, optional action.

## Avatar Style

- Circular user avatars, 32/40/48/64 sizes.
- Brand logos square-rounded, 12-14px radius.
- Use `next/image` where possible.
- Fallback initials with accessible name.

## Animation Rules

- Product/admin transitions: 150-220ms.
- Marketing reveal: 300-500ms max.
- Animate opacity/transform only.
- No decorative looping except marquee/status pulse.
- Always honor `prefers-reduced-motion`.
- Smooth scroll should disable under reduced motion.

## Dark Mode Rules

- Dark is default but light is first-class.
- No server page should hardcode dark-only visuals.
- Use tokens or `useSite()` for all public/private visible pages.

## RTL Rules

- Use logical properties or branch on `lang`.
- Directional icons flip.
- Avoid uppercase/letter spacing on Arabic labels.
- Keep numbers/prices LTR where needed.
- All visible and aria strings must be bilingual.

## Responsive Breakpoints

- Mobile: `< 640px`
- Tablet: `640-899px`
- Laptop: `900-1199px`
- Desktop: `1200px+`
- Large marketplace: `1440px` max grid

---

# Final Priority Roadmap

1. Error Pages
2. Forgot Password
3. Profile Management
4. Brand Details
5. Legacy Profile Details
6. Modals
7. Become Talent
8. Loading Screens
9. Admin Jobs
10. Dashboard
11. Payments
12. Jobs
13. Brands
14. Chat
15. Booking Details
16. Job Applications
17. Admin Bookings
18. Admin Talent Editor
19. Blog
20. Portfolio Management
21. Community Question Details
22. Notifications
23. Admin Talents
24. Admin Brands
25. Admin Reviews
26. Admin Verifications
27. Admin Notifications
28. Admin Settings
29. Contact
30. About
31. Explore
32. Landing
33. Packages
34. Admin Packages
35. Admin Categories
36. Admin Trusted Brands
37. Bookings
38. Legal Pages
39. Favorites
40. User Settings
41. Admin Users
42. Admin Reports
43. Admin CMS
44. Campaigns
45. Contests
46. Root/Alias Routes

## Final Priority Table

| Page | Current Score | Priority | Estimated Time |
|---|---:|---|---|
| Error Pages | 20 | Critical | 1-2 days |
| Forgot Password | 0 | Critical | 1-2 days |
| Profile Management `/profile/me` | 58 | Critical | 1-2 weeks |
| Brand Details `/brand/[id]` | 50 | Critical | 4-6 days |
| Legacy Profile `/profile/[username]` | 54 | Critical | 2-4 days |
| Modals | 68 | Critical | 3-5 days |
| Become Talent | 58 | Critical | 2-4 days |
| Loading Screens | 42 | High | 2-3 days |
| Admin Jobs | 0 | High | 3-5 days |
| Dashboard | 0 | High | 1-2 weeks |
| Payments | 0 | High | 1-2 weeks |
| Jobs `/jobs` | 72 | High | 2-4 days |
| Brands `/brands` | 70 | High | 2-4 days |
| Chat `/chat` | 70 | High | 3-5 days |
| Booking Details | 72 | High | 3-5 days |
| Job Applications | 72 | High | 2-4 days |
| Admin Bookings | 70 | High | 2-3 days |
| Admin Talent Editor | 60 | High | 4-7 days |
| Blog | 60 | Medium | 2-4 days |
| Portfolio Management | 62 | Medium | 3-5 days |
| Question Details | 68 | Medium | 2-3 days |
| Notifications | 80 | Medium | 1-2 days |
| Admin Talents | 74 | Medium | 2-3 days |
| Admin Brands | 74 | Medium | 2-3 days |
| Admin Reviews | 72 | Medium | 2-3 days |
| Admin Verifications | 72 | Medium | 3-5 days |
| Admin Notifications | 80 | Medium | 2-3 days |
| Admin Settings | 70 | Medium | 2-3 days |
| Contact | 68 | Medium | 2-3 days |
| About | 70 | Medium | 2-3 days |
| Explore | 84 | Medium | 2-4 days |
| Landing `/home` | 82 | Medium | 3-5 days |
| Packages | 82 | Medium | 2-3 days |
| Admin Packages | 82 | Low | 1-2 days |
| Admin Categories | 82 | Low | 1-2 days |
| Admin Trusted Brands | 82 | Low | 1-2 days |
| Bookings | 82 | Low | 1-2 days |
| Legal Pages | 74 | Low | 1-2 days |
| Favorites | 0 | Medium | 3-5 days |
| User Settings | 0 | Medium | 3-5 days |
| Admin Users | 20 | Medium | 3-5 days |
| Admin Reports | 0 | Medium | 1-2 weeks |
| Admin CMS | 20 | Medium | 1-2 weeks |
| Campaigns | 50 | Low | 1 day alias decision, 1 week if built |
| Contests | 0 | Low | 1-2 weeks after product definition |
| Root/Alias Routes | 78 | Low | 0.5 day |

