# PRODUCT.md — Product Vision & Design System

> **Audience:** product, design, and anyone (human or AI) making user-facing decisions.
> **Status:** Documents the **product as actually built** as of 2026-07-21, and clearly separates
> shipped behaviour from intended-but-unbuilt strategy.
> **Companion doc:** [CLAUDE.md](./CLAUDE.md) — technical architecture, schema, conventions.

Sections marked **🚧 NOT BUILT** describe intent only. Do not present them to users as existing features.

---

## Register

product

The core loop is app UI — `/explore`, `/talent/[handle]`, `/profile/me`, `/bookings`, `/chat`, and the
`(admin)` back-office. Design serves the task: the user is mid-workflow, and consistency beats surprise.

The marketing surfaces (`/home`, `/become-talent`, `/brands`, `/about`, `/blog`) are the deliberate
exception and may be worked in the **brand** register — bigger typography, scroll-driven sections,
conversion-first. Name the register explicitly when working on those pages; everything else defaults to product.

## Platform

web

Next.js App Router on Cloudflare Pages. Responsive mobile web via `useIsMobile()`, not a native target —
there is no iOS or Android app, so HIG / Material 3 conventions do not apply.

---

# Part 1 — Product

## 1. Product Overview

**Talents** is an Arabic-first marketplace that connects **brands** with **creative talent** —
models, influencers, UGC creators, hosts, photographers, voice-over artists, and designers —
across Egypt and the wider Arab world.

**One-line positioning (as it appears on the homepage):**
> ربط البراندات بأفضل المواهب في العالم العربي — *Connect brands with top talents in the Arab world.*
> "منصة واحدة تجمع المؤثرين، الموديلز، صنّاع المحتوى والبراندات — تعاون حقيقي، نتائج قابلة للقياس."

**What makes it different from a freelance board:**
- Talent-first profile depth — portfolio, physical attributes, social reach, past brands, packages.
- Structured brief → accept → pay → deliver → review pipeline instead of loose messaging.
- Verification and moderation (ID verification, review moderation, brand approval) as trust signals.
- Built natively RTL/Arabic rather than translated after the fact.

**Currency:** EGP. **Primary market:** Egypt, expanding to Saudi Arabia and the UAE.

---

## 2. Target Users & Personas

### Persona A — "The Creator" (talent, primary)
Arabic-speaking creator, 18–35, phone-first, active on Instagram/TikTok. Has an audience or a
portfolio but no reliable pipeline of paid brand work; currently negotiates over DMs with no
contract, no clear pricing, and unreliable payment.
- **Wants:** real brands, to set their own prices, to get paid reliably, to build a reputation.
- **Fears:** unpaid work, hidden platform cuts, being undercut, uploading ID documents.
- **On-platform:** builds a profile, sets 3 packages, applies to jobs, receives briefs, delivers, gets reviewed.
- **Homepage promise to them:** "حوّل إبداعك إلى مصدر دخل حقيقي" · "أنت تحدد أسعارك. لا وسطاء، لا خصومات مخفية."

### Persona B — "The Brand Marketer" (brand, primary)
Marketing or social lead at an SME, agency, or e-commerce brand. Needs a steady supply of
content and faces from a fragmented, unvetted market.
- **Wants:** to find the right talent fast, see proof (portfolio, ratings, past brands), send a clear
  brief, and know the deliverables will arrive.
- **Fears:** paying up front to a stranger, inconsistent quality, no recourse.
- **On-platform:** browses `/explore`, posts jobs, sends direct briefs, confirms payment, approves deliverables, reviews.

### Persona C — "The Platform Admin" (internal)
Moderates the marketplace: approves talents and brands, reviews ID verifications, moderates reviews,
monitors the booking pipeline, and blocks bad actors.

### Secondary
Community participants (talents asking/answering questions in `/community`) and guests browsing
public profiles before signing up.

---

## 3. Main User Journeys

### 3.1 Talent — join and get booked *(shipped)*
```
/become-talent or /register  →  choose "موهبة / منشئ محتوى"
  → signup (30-second promise: name, email, phone, password)
  → /profile/me  →  ProfileCompletionCard walks through 11 weighted sections
       avatar · personal · bio · categories · social · portfolio ·
       physical · packages · usage rights · availability · (payment — coming soon)
  → profile is publicly live at /talent/[handle]
  → apply to jobs at /jobs, or receive a direct brief from a brand
  → accept the brief → brand confirms payment → deliver → get reviewed
```
Note: the multi-step onboarding wizard at `/onboarding` is **not live** (the file is fully
commented out). Profile building happens entirely on `/profile/me`.

### 3.2 Brand — hire a talent *(shipped)*
```
/register as "براند / شركة"  →  /explore  (filter, browse talent cards)
  → open /talent/[handle]  (portfolio, packages, reviews, past brands, performance)
  → "Send brief" (DirectBriefModal): title, description, requirements, attachments, deadline
  → chat thread opens automatically with a system message
  → talent accepts  →  brand confirms payment  →  work in progress
  → talent submits deliverables  →  brand approves  →  brand leaves a review
```

### 3.3 Brand — post a job *(shipped)*
`/jobs/create` → title, description, category, budget range, dates, slots → talents apply →
`/jobs/[id]/applications` → accept an applicant → becomes a booking.

### 3.4 Community *(shipped)*
`/community` — talents and brands post questions, answer each other, tags and view counts.

### 3.5 Admin moderation *(shipped)*
`/admin` → talents · brands · bookings · reviews · verifications · settings.

---

## 4. Platform Goals

1. **Liquidity** — enough approved, complete talent profiles that any brand search returns credible options.
2. **Trust** — verification badges, moderated reviews, real ratings computed from completed bookings.
3. **Completion** — move bookings all the way to `completed` + reviewed, not abandoned in chat.
4. **Arabic-native experience** — RTL, Arabic-first copy, local pricing (EGP), local payment habits.
5. **Repeatability** — brands returning to the same talents; talents building durable reputations.

---

## 5. Core Features & Priority

| # | Feature | Status | Priority |
|---|---|---|---|
| 1 | Talent profiles (portfolio, packages, reviews, brands, physical attributes) | ✅ Shipped | P0 |
| 2 | Explore / discovery with filters | ✅ Shipped | P0 |
| 3 | Direct brief → accept → pay → deliver → review pipeline | ✅ Shipped | P0 |
| 4 | 1:1 chat with system messages tied to pipeline events | ✅ Shipped | P0 |
| 5 | Job board + applications | ✅ Shipped | P1 |
| 6 | Reviews & auto-computed ratings (DB trigger) | ✅ Shipped | P1 |
| 7 | Realtime notifications | ✅ Shipped | P1 |
| 8 | Admin back-office (talents, brands, bookings, reviews, verifications) | ✅ Shipped | P1 |
| 9 | Profile-completion scoring + gating thresholds | ⚠️ Scoring shipped, **gating not enforced** | P1 |
| 10 | Community Q&A | ✅ Shipped | P2 |
| 11 | Talent verification (ID + selfie + social proof) | ✅ Shipped | P1 |
| 12 | Company pages (about, blog, contact, legal) | ✅ Shipped | P2 |
| 13 | **Real payment gateway / escrow** | 🚧 NOT BUILT — payment is a manual status confirmation | P0 next |
| 14 | Multi-step onboarding wizard | 🚧 Written but disabled | P2 |
| 15 | Availability calendar, saved talents, advanced sort | 🚧 NOT BUILT | P2 |
| 16 | Email notifications | 🚧 NOT BUILT | P2 |
| 17 | **Platform subscription packages** | 🚧 NOT BUILT — see Part 3 | P1 |

---

## 6. Marketplace Logic

### Supply side (talents)
- Anyone can register as a talent; the profile is created immediately.
- Public visibility requires a `handle` and a `talent_profiles` row; the admin can approve/suspend.
- **Talents set their own prices.** The platform does not price the work. This is an explicit
  promise in the marketing copy: *"أنت تحدد أسعارك. لا وسطاء، لا خصومات مخفية."*
- Ranking signals available today: `avg_rating`, `total_reviews`, `total_bookings`, `profile_views`,
  `is_featured`, `is_verified`, and `starting_price` (derived as the minimum package price).

### Demand side (brands)
- Brands register, are approved (`brand_status`), and can post jobs or send direct briefs.
- Brands see a talent's packages, add-ons (usage rights), portfolio, ratings, and past brands.

### Matching
Two directions, both shipped: **brand → talent** (browse + direct brief) and
**talent → job** (job board + application). Everything converges on a `booking`.

### Money
Currently **off-platform and manual** — the brand confirms payment in the UI, which records a
`payments` row and advances the booking. No gateway, no escrow, and **no commission is taken today**.
The `profiles.balance` column exists as scaffolding for a future wallet.
The Terms page states that a service fee applies per transaction; the fee is **not implemented**.
**Any commission/escrow model must be treated as an unshipped decision.**

### Trust & safety
- Reviews are moderated (`pending|approved|rejected`); only approved reviews are public.
- Talent ID verification is a manual admin review of an ID document + selfie + social proof.
- Accounts can be blocked/suspended platform-wide (`account_status`) with a reason shown on `/blocked`.

---

# Part 2 — Theme & Design System

## 7. Brand Identity

**Name:** Talents · **Wordmark:** logo assets in `public/assets/` (`logo-light.png`, `logo-dark.png`).

**Personality:** confident, modern, credible, energetic — a professional marketplace, not a
playful social app. Dark, neon-accented "tech product" aesthetic that signals seriousness and
performance while staying visually exciting for a creative audience.

**Brand voice pillars:** direct · encouraging · concrete (numbers, not adjectives) · respectful.

### Anti-references — what Talents must NOT look like

Four failure modes, all confirmed. When a design decision drifts toward one of them, it is wrong
regardless of how well executed it is.

1. **The freelance bid-board (Upwork / Fiverr).** Commodity gig energy: dense listing rows, haggling,
   every creator flattened to a price and a star count. This directly contradicts the talent-first
   positioning and the *"أنت تحدد أسعارك"* promise. Talent cards must lead with the person and the
   work — portfolio, reach, past brands — not with a rate and a bid button.
2. **The playful consumer social app.** Rounded-everything, mascots, sticker energy, emoji-heavy
   chrome. A brand marketer spending real budget reads this as unserious. Emoji stay confined to
   pipeline system messages (📋 💳 ✅ ❌) where they act as scannable state markers, not as decoration.
3. **The generic SaaS template landing.** Gradient hero, three identical icon cards, big-number stat
   row, tiny uppercase tracked eyebrow over every section, numbered `01 / 02 / 03` scaffolding.
   Especially tempting on `/home` and `/become-talent`; it is the single most likely place this
   project produces something indistinguishable from every other landing page.
4. **The casting-agency / modeling-portfolio site.** Editorial fashion minimalism — thin serif type,
   mostly-white galleries, oversized whitespace. Beautiful, and wrong: it signals *agency* (we
   represent talent, call us) rather than *marketplace* (browse, brief, book, pay, review).

---

## 8. Design Philosophy

1. **Arabic first, RTL first.** The default document direction is RTL and the default language is
   Arabic. LTR/English is the secondary state, not the baseline.
2. **Dark by default, light as a first-class peer.** Both modes are fully designed, not
   auto-inverted.
3. **Depth through glass and glow.** Layered surfaces, translucent panels, soft coloured glows —
   never flat grey boxes.
4. **Motion with purpose.** Entrances, scroll reveals, and hover lifts are used to guide attention;
   nothing loops or distracts.
5. **Content is the hero.** Talent photography, portfolios, and numbers carry the page; chrome recedes.
6. **Mobile-first reality.** The audience is phone-first; `useIsMobile()` drives layout at
   the component level.

---

## 9. Color System

### Design tokens (`app/globals.css`, `:root`)

| Token | Hex | Role |
|---|---|---|
| `--color-teal` | `#00C9B1` | Primary action / success |
| `--color-blue` | `#1565C0` | Trust / links / secondary brand |
| `--color-orange` | `#FF6B2B` | CTA / alerts / attention |
| `--color-purple` | `#8B2FC9` | Premium / creative / highlight |
| `--color-gold` | `#FFB800` | Ratings / badges / VIP / featured |

Each accent has `-light`, `-dark`, and `-glow` variants (`rgba(..., 0.25)`) used for hover shadows.

### The colours actually used in components
The component layer has converged on a **neon-green + gold** pairing that is *not* in the token file.
By usage count across `app/` and `components/`:

| Hex | Uses | Meaning in practice |
|---|---:|---|
| `#00D26A` | ~130 | **The de-facto primary** — buttons, active states, success, scrollbar |
| `#FFB800` | ~45 | Gold — ratings, badges, "premium" |
| `#F4B740` | ~29 | Softer gold variant (profile pages) |
| `#00C9B1` | ~11 | Token teal — legacy/decorative |
| `#FF6B2B` | ~9 | Orange CTA |
| `#8B2FC9` | ~9 | Purple premium |
| `#1565C0` | ~3 | Blue |

> ⚠️ **Known inconsistency:** `#00D26A` (component green) and `--color-teal` `#00C9B1` (token) are two
> different primaries living side by side. New work should use **`#00D26A`** for primary actions to
> match the majority of the UI, and this divergence should eventually be reconciled into the tokens.

### Surfaces

**Dark mode** (`[data-theme="dark"]`, and the `:root` default)
| Token | Hex |
|---|---|
| `--bg-base` | `#050B12` (an earlier `#030812` is also declared) |
| `--bg-surface` | `#090e1a` |
| `--bg-card` | `#0d1527` |
| `--bg-elevated` | `#111c35` |
| `--bg-border` | `#1e293b` |
| `--text-primary` | `#f1f5f9` |
| `--text-secondary` | `#94a3b8` |
| `--text-muted` | `#475569` |

Component-level dark values commonly used: card `#0D1623`, surface `#0A121C`,
muted text `#A8B3C2`, border `rgba(0,255,163,0.15)`.

**Light mode** (`[data-theme="light"]`)
| Token | Hex |
|---|---|
| `--bg-base` | `#f1f5f9` |
| `--bg-surface` / `--bg-card` | `#ffffff` |
| `--bg-elevated` | `#e2e8f0` |
| `--bg-border` | `#cbd5e1` |
| `--text-primary` | `#0f172a` |
| `--text-secondary` | `#475569` |
| `--text-muted` | `#64748b` |

Accent glows are reduced to ~10% opacity in light mode so the neon reads as accent, not glare.

---

## 10. Typography

Loaded from Google Fonts in `app/globals.css`:

| Family | Weights | Use |
|---|---|---|
| **Cairo** | 300–800 | Body and UI — the primary Arabic/Latin face (`html { font-family: 'Cairo', … }`) |
| **Changa** | 400–700 | Display / headline alternative |
| **JetBrains Mono** | 400, 500 | Numeric and code-like accents |

Conventions observed in components: base line-height `1.5`; section headings ~18px/800;
hero headlines scale up dramatically with `clamp`-like inline sizing; labels 13–14px/600;
muted metadata 12–13px. Arabic numerals are rendered with `toLocaleDateString("ar-EG", …)`
for dates on Arabic surfaces.

---

## 11. Component Style

- **Cards:** rounded, bordered, subtle background lift. Radius scale in use (by frequency):
  **10, 8, 16, 20, 12**, then 6/14; `100` for pills and avatars. Prefer 12–16 for content cards,
  8–10 for controls, 100 for pills.
- **Glass panels:** `.glass-panel` — `rgba(13,30,54,0.65)` + `blur(12px)` + a 1px white 8% border;
  `.glass-panel-hover` adds a −4px lift and a teal glow shadow.
- **Buttons:** `.btn-primary` (teal, black text, weight 700), `.btn-cta` (orange, white),
  `.btn-premium` (purple gradient). All 8px radius, all gain a coloured glow on hover.
  Most in-component buttons are inline-styled with `#00D26A` and follow the same shape.
- **Badges:** `.badge-gold` / `.badge-teal` / `.badge-purple` — 12–15% tinted background,
  accent-coloured text, 25–30% accent border. Gold = rating/VIP, teal = verified/status,
  purple = premium.
- **"Popular" package card:** green-tinted background (`rgba(0,210,106,0.06)`) with a full green
  border and a floating label — the one place the grid breaks symmetry deliberately.
- **Empty states:** always a centred muted sentence in both languages
  (e.g. "لا توجد باقات متاحة حالياً" / "No packages available yet"), never a blank region.
- **Admin UI** uses its own shell (`AdminShell`, `AdminSidebar`, `AdminTopbar`) with
  `StatusBadge`, `DashboardCard`, `EmptyState`, `LoadingSkeleton`, `Pagination`, `ConfirmationModal`
  — denser and more utilitarian than the marketing surface.

---

## 12. Dark Mode Behaviour

- **Default state.** `:root` tokens are the dark values; the `<html>` element carries
  `data-theme="dark|light"`.
- **First visit is time-based:** light between 06:00 and 18:00 local time, dark otherwise. Once the
  user toggles, the choice is stored in `localStorage` under `site_theme` and always wins.
- **No flash:** a blocking inline `<script>` in `app/layout.tsx` sets `data-theme`, `lang`, and `dir`
  before React hydrates.
- Deep near-black backgrounds (`#050B12` / `#0A121C`), neon green and gold accents, translucent
  borders, and coloured glow shadows carry hierarchy.

## 13. Light Mode Behaviour

- Cool slate greys (`#f1f5f9` base, white cards) rather than pure white everywhere.
- The same accents are retained but glows drop to ~10% opacity.
- Photographic heroes keep white text: `#talents-hero-banner` has explicit light-mode overrides so
  copy stays legible over imagery.
- **Legacy path:** `globals.css` also contains a `#talents-app-root.light-mode` override block that
  force-recolours Tailwind slate classes. It predates the `data-theme` system. **Do not extend it** —
  new components should read `dark` from `useSite()` and style both modes directly.

---

## 14. RTL Design Rules

1. `<html dir="rtl" lang="ar">` is the default; switching to English sets `dir="ltr"`.
2. Every component that renders text sets `direction: ar ? "rtl" : "ltr"` on its root when layout
   depends on it — do not rely on inheritance alone inside absolutely-positioned elements.
3. **Never hardcode `left`/`right`** for anything directional in a bilingual component; branch on
   `ar` or use logical properties.
4. Icons that imply direction (arrows, chevrons, "next") must flip with the language. Non-directional
   icons (star, check, camera) must not.
5. CTA arrows are written into the copy per language: `"إنشاء الحساب ←"` vs `"Create account →"`.
6. Numbers, prices, and Latin brand names stay LTR inside RTL text.
7. Every new string ships in **both** `ar` and `en` inside the component's `TX` object — an
   English-only string is a bug.

---

## 15. Animation Guidelines

Two systems coexist; both are legitimate.

**CSS (`app/globals.css`)**
- `.sr` + `.sr-left|right|up|scale` + `.sr-d1…d6` — scroll-reveal with staggered delays,
  `cubic-bezier(0.16, 1, 0.3, 1)`, 0.7s.
- `.card-hover` — scale 1.035–1.045 + −4px lift, spring-ish `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- `.pulse-glow` — 3s opacity/glow loop, reserved for status indicators.
- `.ld-*` — the branded loading screen sequence (logo in, title letter-spacing settle, progress bar, dots).
- `.glass-panel-hover` — background, border, lift, and glow together on hover.

**Framer Motion (components)**
- Standard entrance: `initial={{ opacity: 0, y: 12 }} → animate={{ opacity: 1, y: 0 }}`.
- List stagger: `transition={{ delay: i * 0.05 }}` (grids) or `i * 0.1` (cards).
- Hover: `whileHover={{ scale: 1.02 }}`.
- Modals use `AnimatePresence`.

**Rules:** durations 0.2–0.7s; nothing loops except deliberate status pulses; transforms and opacity
only (never animate layout properties); `will-change` is already set on the shared utility classes.

---

## 16. UX Principles

1. **Never a dead end.** Every empty list gets a bilingual empty state and, where possible, an action.
2. **Bilingual by construction.** Both languages ship together or the feature isn't done.
3. **State is always visible.** Loading, saving, saved (`تم الحفظ ✓`), and error states are explicit;
   buttons disable while in flight.
4. **Progressive profile building.** The completion card turns a long profile form into scored,
   bite-sized sections with a visible reward.
5. **Guests can browse.** Auth is requested at the moment of action, not at the door.
6. **The pipeline narrates itself.** Every booking transition writes a bilingual system message into
   the chat and a notification, so both sides always know what happened and what's next.
7. **Fail soft.** Notification failures, missing profiles, and stale sessions self-heal rather than
   blocking the user.
8. **Mobile parity.** Every screen is designed at phone width first.

---

## 17. Voice & Tone

**Arabic:** modern standard Arabic with light Egyptian warmth; second person, direct, encouraging.
Short sentences. Emoji used sparingly as section markers (📋 brief, 💳 payment, ✅ accepted, ❌ rejected).

**English:** concise, professional, sentence case; a peer translation, never a literal one.

**Do:**
- Lead with the user's benefit: *"حوّل إبداعك إلى مصدر دخل حقيقي"*.
- Be concrete: *"أنت على بُعد 30 ثانية"*, *"لا حاجة لبطاقة ائتمانية"*, *"1,000+ موهبة نشطة"*.
- Reassure about money and safety: *"لا وسطاء، لا خصومات مخفية"*.
- Write errors as plain guidance: *"الرجاء إكمال جميع الحقول"*, *"كلمتا المرور غير متطابقتين"*.

**Don't:**
- Use platform jargon in user-facing copy (no "escrow state machine").
- Promise features that aren't live (escrow, instant payouts, guarantees) — several marketing lines
  today lean on *"مدفوعات آمنة"* / *"نظام إيداع"* while payment is manual. **Tighten this copy
  before launch rather than shipping the claim.**
- Blame the user in error messages.

---

## 17.1 Accessibility & Inclusion

**Target: WCAG 2.1 level AA.** Not aspirational — treat a failure here as a bug, not a polish item.

**Contrast**
- Body text ≥ 4.5:1 against its actual background. Large text (≥18px, or bold ≥14px) ≥ 3:1.
- UI component boundaries and state indicators (input borders, focus rings, toggles, chart strokes) ≥ 3:1.
- Placeholder text is held to the same 4.5:1 as body text. The default muted gray is not exempt.
- **Known risk areas to verify whenever touched:** `--text-muted` `#475569` on `--bg-card` `#0d1527`
  (dark) and `#64748b` on `#ffffff` (light) are the thinnest ratios in the system; the neon
  `#00D26A` as *text* on dark surfaces is bright enough, but `#00D26A` as text on light
  `#ffffff` is not — use it as a fill with dark text, or darken it, never as small green-on-white copy.

**Motion**
- Every animation needs a `@media (prefers-reduced-motion: reduce)` alternative — a crossfade or an
  instant transition. This is non-negotiable and applies to both systems in §15: the `.sr-*`
  scroll-reveal classes and the framer-motion entrances.
- Scroll reveals must enhance an already-visible default. Never gate content visibility on a
  transition that may never fire.
- Nothing loops except the deliberate `.pulse-glow` status indicator.

**Keyboard & focus**
- Every interactive element is reachable and operable by keyboard, in a logical order that follows
  the RTL reading direction.
- A visible focus indicator on every focusable element, meeting the 3:1 boundary rule above.
  Never remove an outline without replacing it.
- Modals (`AnimatePresence`) trap focus while open, close on `Esc`, and return focus to the trigger.

**Colour independence**
- Never encode meaning in hue alone. Booking pipeline status, review moderation state, and
  verification badges must carry a label or an icon alongside the colour — the palette leans on
  green/gold/orange/purple, which is exactly the range that collapses for red-green colour blindness.

**Language & structure**
- `lang` and `dir` are set on `<html>` and must stay correct when the user toggles language.
- Semantic headings in order; landmarks (`nav`, `main`, `footer`) present on every page.
- Icon-only controls need an accessible name in both `ar` and `en` — an English-only `aria-label` is
  the same bug as an English-only visible string.

---

# Part 3 — Packages System

There are **two distinct things called "packages"**. Keep them separate in every discussion.

## 18. A) Talent Service Packages — ✅ SHIPPED

The tiered offers a talent sells to brands. This is the live system.

### Philosophy
The talent is the pricer. The platform provides the *shape* of an offer — a small number of
comparable tiers with explicit inclusions — so brands can compare talents on like-for-like terms
without the platform dictating rates.

### Data model
Stored as `talent_profiles.packages` (JSONB array):
```jsonc
[{ "id": "...", "name": "Starter", "price": "1500", "popular": false, "features": ["...", "..."] }]
```
Usage-rights add-ons live separately in `talent_profiles.social_links.usage_addons`:
```jsonc
[{ "key": "paid_ads_3m", "label": "حقوق الإعلانات المدفوعة — 3 شهور", "price": 800 }]
```
The intended tiering is **Starter / Growth / Premium**, with one card flagged `popular`.

### Behaviour
- Edited by the talent on `/profile/me` (and inside `ProfileCompletionCard`), saved through
  `PATCH /api/profile/complete` with `section: "packages"`.
- Rendered on `/talent/[handle]` by `PackagesSection`; the `popular` card gets a green highlight.
- Drives the `starting_price` shown on explore cards (minimum numeric package price).
- Contributes **10 points** to profile completion; usage rights contribute another **10**.
- **Selecting a package does not currently create a priced booking** — the brief flow is
  descriptive (title, description, requirements, deadline) and the amount is set on the booking
  separately. Wiring package selection → brief → booking amount is an open gap.

### Admin management
Admins can edit a talent's profile (including packages) via
`/admin/talents/[id]` → `PATCH /api/admin/talents/[id]/profile`. Admins do **not** set prices as
policy — this is a support/correction capability.

---

## 19. B) Platform Subscription Packages — 🚧 NOT BUILT

**Nothing in the codebase implements platform plans, entitlements, feature gating by plan, or
billing.** There is no `plans`/`subscriptions` table, no plan field on `profiles`, and no billing
provider. Everything below is **intended strategy**, recorded so future work stays coherent.

### Intended philosophy
Free must be genuinely useful — supply liquidity depends on talents joining without friction
("ابدأ الآن مجاناً · لا حاجة لبطاقة ائتمانية" is a live promise on `/become-talent` and must not be
broken). Paid tiers should sell **visibility, volume, and speed**, never basic access or basic trust.

### Intended free vs paid split
| | Free | Paid |
|---|---|---|
| Profile, portfolio, packages | ✅ Full | ✅ Full |
| Appear in explore/search | ✅ (subject to completion threshold) | ✅ + boosted placement |
| Receive & respond to briefs | ✅ | ✅ |
| Chat | ✅ | ✅ |
| Reviews & ratings | ✅ | ✅ |
| Job applications | Limited per month | Higher / unlimited |
| Featured placement (`is_featured`) | — | ✅ |
| Analytics depth | Basic views | Full performance breakdown |
| Support | Standard | Priority |

### Intended differences by user type
- **Talent plans** monetize *being found* — featured slots, more job applications, richer analytics,
  profile boosts.
- **Brand plans** monetize *hiring throughput* — concurrent open jobs, number of direct briefs,
  team seats, advanced filters, campaign reporting.
- **Admin** has no plan.

### Intended feature-access model
Two orthogonal gates, one of which already exists:
1. **Profile completion gate — already coded, not enforced** (`lib/profile-completion.ts`):
   apply to jobs ≥ 50, appear in search ≥ 60, receive briefs ≥ 70, become verified ≥ 80.
   **Enforcing these is a prerequisite for any plan gating** — otherwise plans would sell access to
   a marketplace full of empty profiles.
2. **Plan entitlement gate — not built.** Would need a `plan` on `profiles` (or a `subscriptions`
   table), a central `can(user, capability)` helper, and enforcement in the same API routes that
   already do role checks. Never gate on the client alone.

Verification (`is_verified`) must stay **earned, not purchased** — selling the trust badge would
undermine the platform's core value proposition.

### Intended admin management flow
Admin sets/overrides a user's plan and expiry from `/admin/talents/[id]` or `/admin/brands`;
plan changes are audited; comps and trials are admin-grantable. Until a billing provider exists,
plans would be manually assigned.

### Related unbuilt money mechanics
- **Commission / service fee** — the Terms page mentions a per-transaction service fee; it is not
  implemented and no percentage is defined in code.
- **Wallet** — `profiles.balance` exists and is displayed in admin, but nothing credits or debits it.
- **Payouts** — no provider, no flow.

---

## 20. Maintaining This Document

Update **PRODUCT.md** whenever you change:
- what a feature does for the user, or its priority;
- copy tone, personas, or journeys;
- colours, typography, radii, motion, RTL rules, or component conventions;
- anything about packages, pricing, plans, or fees.

Update **CLAUDE.md** for the technical counterpart (schema, routes, auth, conventions).

**Rule:** when a 🚧 item ships, move it out of the "NOT BUILT" framing in the same PR — stale
aspirational documentation is exactly how `SYSTEM_DESIGN.md` became misleading.

---

## Landing Page Strategy Update - 2026-07-23

The `/home` landing page now follows a premium creator-marketplace direction inspired by LinkedIn, Fiverr, Upwork, Contra, Collancer, CreatorHubb, and the approved generated reference.

The page narrative is: cinematic hero, search, trust metrics, brand proof, categories, featured talents, brand/talent workflows, campaign moments, platform features, testimonials, pricing preview, FAQ, and final CTA.

Design principles:

- Arabic-first and RTL-native, with English content support.
- Premium but practical: real media, clear search, visible proof, and booking-oriented cards.
- Motion is subtle and professional, using Framer Motion only where it supports attention and trust.
- Pricing remains a preview and does not imply a completed billing system.
- Remote imagery is centralized in content data so production photos or video assets can replace it later without changing component structure.
