---
name: Talents
description: Arabic-first, RTL talent marketplace — dark by default, lit like a green room, built so the person is the brightest thing on screen.
colors:
  action-teal: "#0F766E"
  action-teal-strong: "#0B5F59"
  signal-gold: "#D7A84F"
  signal-gold-strong: "#B98422"
  accent-teal: "#16A3A3"
  status-success: "#1EA672"
  status-warning: "#D99822"
  status-error: "#DF3F4D"
  status-info: "#3A82F6"
  ink-page: "#070B10"
  ink-page-subtle: "#0C1219"
  ink-surface: "#101720"
  ink-card: "#141D27"
  ink-card-muted: "#192431"
  ink-text: "#F7FAFC"
  ink-text-muted: "#8996A5"
  paper-page: "#F7F8F8"
  paper-surface: "#FFFFFF"
  paper-card-muted: "#F1F4F5"
  paper-text: "#101820"
  paper-text-muted: "#6C7A86"
typography:
  display:
    fontFamily: "Changa, Cairo, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Cairo, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Cairo, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Cairo, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Cairo, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "Cairo, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  numeric:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  chip: "6px"
  control: "8px"
  control-lg: "12px"
  card: "16px"
  card-lg: "22px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.action-teal}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.action-teal-strong}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.signal-gold}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1.25rem"
  button-secondary-hover:
    backgroundColor: "rgba(215,168,79,0.14)"
    textColor: "{colors.signal-gold}"
  input:
    backgroundColor: "{colors.ink-card-muted}"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.6rem 1rem"
  card:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.card-lg}"
    padding: "1.5rem"
  badge-status:
    backgroundColor: "rgba(15,118,110,0.12)"
    textColor: "{colors.action-teal}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  badge-rating:
    backgroundColor: "rgba(215,168,79,0.14)"
    textColor: "{colors.signal-gold}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  navbar:
    backgroundColor: "rgba(7,11,16,0.85)"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    height: "60px"
    padding: "0 24px"
---

# Design System: Talents

## 1. Overview

**Creative North Star: "The Green Room"**

A green room is the space backstage where talent waits before going on: dark, unmistakably
professional, and arranged entirely around the person in it. Nobody decorates a green room.
Everything in it either helps the performer get ready or gets out of the way. That is still the
whole brief — the name describes the *backstage* metaphor, not a literal colour. The room is now
lit by a deep teal and a warm gold rather than a neon green; the professional, uncluttered,
person-first premise the name describes is unchanged.

The system is dark by default and light by daylight — both modes are designed, never
auto-inverted. Depth comes from tinted borders and background steps rather than from stacked
shadows, and colour is spent, not sprinkled: a single teal carries every action, a warm gold marks
everything the platform itself has verified or scored, and nothing else earns saturation. The one
deliberate exception is photography, which is allowed to be as loud as it wants.

This system explicitly rejects the four shapes named in PRODUCT.md. It is not the **freelance
bid-board** — no dense listing rows, no haggling chrome, no creator flattened to a rate. It is not
the **playful consumer social app** — no mascots, no sticker energy, no bouncing. It is not the
**generic SaaS template landing** — no gradient hero, no three identical icon cards, no tracked
uppercase eyebrow over every section. And it is not the **casting-agency portfolio site** — no thin
serif minimalism, no mostly-white gallery, because this is a place you transact, not a place you
enquire.

**Key Characteristics:**
- Dark near-black stage (`#070B10`), lit surfaces stepping up to `#141D27`, photography as the light source
- One teal for action, one warm gold for earned status, and a strict ban on anything else being saturated
- Cairo carries almost everything; hierarchy is built from weight, not from a zoo of fonts
- Flat at rest; shadow is a response to state, never decoration
- 8–16px radii on controls and cards (22px on hero-scale marketing cards), dense but breathable padding, RTL as the native reading direction
- Every interactive element ships all seven states or it isn't finished
- **Admin stays visibly the same product** — same colours, same typography, same control language —
  but denser: tighter padding, smaller type steps, data-table-first layout. Admin is not marketing
  copied into a dashboard.

## 2. Colors

A near-black stage with two deliberate voices — a teal that means *act* and a warm gold that means
*proven* — over a cool slate neutral ramp that carries every mode. **These are the canonical,
current values — see `app/globals.css` `:root` for the live tokens (`--color-primary`,
`--color-secondary`, etc.). Nothing below should ever drift from what's actually in that file.**

### Primary
- **Stage Teal** (`#0F766E`): The single action colour. Primary buttons, active nav and tab states,
  success-adjacent confirmations, the price on a talent card, the scrollbar thumb. Used as a fill
  with white text (5.47:1 on `#0F766E`), and as text only on dark surfaces. This is the real
  primary — every screen defers to it for its one action.
- **Stage Teal Strong** (`#0B5F59`): Hover/pressed state of a teal fill.

> **Superseded, not deprecated-and-dead:** the neon green `#00D26A` this document previously named
> as canonical was the product's actual majority colour for a long stretch (talent/brand profile,
> `/profile/me`, bookings, and admin still hardcode it in places pending Stage 2 of the ongoing UI
> consistency migration — see PRODUCT.md). It is not a legacy accident to purge silently; it is
> mid-migration. Retarget it to `var(--color-primary)` when you touch a file that has it, and never
> introduce a new neon-green literal.

### Secondary
- **Warm Gold** (`#D7A84F`) and **Warm Gold Strong** (`#B98422`): Everything the platform itself
  vouches for — star ratings, verification badges, "featured", VIP and premium markers, the pending
  state in moderation. Also the CTA colour on `/login` and `/register` — a scoped, intentional
  auth-theme choice, not licence to use gold as an action colour elsewhere.
- **Accent Teal** (`#16A3A3`): A narrow, lighter teal used for secondary emphasis in gradients and
  glows (e.g. the Home Page hero radial glow), never as a primary action fill.

### Status
- **Success** (`#1EA672`), **Warning** (`#D99822`), **Error** (`#DF3F4D`), **Info** (`#3A82F6`):
  Distinct from the brand teal/gold pair — reserved for booking pipeline states, moderation
  outcomes, and form validation. Never decorative.

### Neutral
- **Stage Page** (`#070B10`): The page floor in dark mode.
- **Stage Surface** (`#101720`): Inputs, wells, and recessed regions.
- **Stage Card** (`#141D27`): The standing card and panel surface.
- **Stage Card Muted** (`#192431`): Recessed fields inside a card (form inputs, secondary panels).
- **Stage Ink** (`#F7FAFC`) / **Stage Ink Muted** (`#8996A5`): Primary and secondary text on dark.
- **Paper** ramp for light mode: page `#F7F8F8`, surfaces/cards `#FFFFFF`, card-muted `#F1F4F5`,
  ink `#101820`, muted `#6C7A86`.

### Named Rules

**The One Action Rule.** Exactly one teal fill per view. If a screen shows two teal buttons, one of
them is not the primary action — demote it to the gold outline or the ghost variant.

**The Earned Gold Rule.** Gold marks what the *platform* asserts — a rating we computed, an identity
we verified, a placement we granted. It never marks what we want the user to click, except the one
scoped `/login`/`/register` exception above.

**The Colour-Plus-Label Rule.** Booking status, moderation state, and verification never communicate
through hue alone. Every coloured chip carries a word or an icon, in both languages.

**The Admin-Same-Language Rule.** Admin uses the same tokens, the same button/badge/card
vocabulary, and the same states as every other surface. It is allowed — expected — to be denser:
smaller padding, tighter row heights, a permanently-dark navigation rail regardless of `[data-theme]`
(the one intentional non-theme-reactive admin surface, matching the hero-band exception below). It
is not allowed to invent its own colours or components.

## 3. Typography

**Display Font:** Changa (fallback Cairo, sans-serif) — marketing surfaces only
**Body Font:** Cairo 300–800 (fallback Inter, system-ui, sans-serif) — everything else
**Numeric Font:** JetBrains Mono 400/500 — figures that need to align or be read as data

### Hierarchy
- **Display** (Changa 700, fluid up to 40px+): Marketing hero headlines on `/home`, `/explore`,
  `/become-talent`. May scale fluidly with `clamp()` on those pages, hard ceiling 4.5rem.
- **Headline** (Cairo 800, 32px, 1.2): Page-level titles — auth headings, profile names, section
  openers.
- **Title** (Cairo 800, 18px, 1.3): Section and card-group headings. The workhorse heading of the app.
- **Body** (Cairo 400, 14px, 1.5): Default copy, form values, chat messages.
- **Label** (Cairo 600, 13px, 1.4): Field labels, button text, nav items, tab labels.
- **Meta** (Cairo 500, 11–12px, 1.4): Timestamps, counts, helper text, card sub-lines.
- **Numeric** (JetBrains Mono 500, 13px): Prices, follower counts, IDs, analytics figures.

### Named Rules

**The Weight-Not-Size Rule.** Emphasis is 600 → 700 → 800 before it is ever a larger size.

**The One Family Rule.** Cairo carries headings, buttons, labels, body, and data. Changa is reserved
for marketing display type only.

**The Balanced Head Rule.** Every h1–h3 sets `text-wrap: balance`; long prose sets `text-wrap: pretty`.

## 4. Elevation

Flat at rest. Depth is expressed through background steps and tinted borders, not a shadow ramp:
`#070B10` floor → `#101720` recessed → `#141D27` card → `#192431` recessed-in-card. Shadows exist
only as a **response**: hover, focus, active, or genuine overlay (dropdowns, modals). A card sitting
still casts nothing — `app/globals.css`'s `--shadow-*` tokens are applied on `:hover`/`:focus`
everywhere they're used correctly (see `.card-hover`, `components/ui/Card.module.css`).

### Named Exceptions (approved, do not "fix")
- **Dark photo-hero bands** (auth's `brandPane`, Explore's `heroBg`, Community's hero, Home's hero
  media) are deliberately NOT `[data-theme]`-reactive — a fixed cinematic dark backdrop under white
  text, regardless of the site theme. This is intentional, not a bug.
- **Admin's navigation rail** (`AdminSidebar`) stays a fixed dark navy shell regardless of theme, for
  the same reason — a persistent chrome element, not a themed content surface. Its accent/status
  colours still come from the canonical tokens.
- **Booking pipeline emoji markers** (📋 💳 ✅ ❌) are scannable state markers in chat/notification
  copy, not decoration — unaffected by any of the above.

### Named Rules

**The Flat-At-Rest Rule.** Any `box-shadow` in a default (non-hover, non-focus, non-overlay) style
is a bug.

**The Two-Step Rule.** No surface sits more than two background steps above its parent. Nested cards
are always wrong; use a divider or a background tint.

## 5. Components

Buttons, cards, and inputs feel **confident and instrumental** — solid fills, decisive weights, fast
state changes. **`components/ui/**` is the canonical primitive set** (Button, Input/Select/Textarea,
Checkbox/Radio, Card, Badge, Modal, Tabs, EmptyState/ErrorState/LoadingState) — new work should
import from there rather than re-styling inline. Legacy pages that still hardcode their own button/
card/input styling are tracked for Stage 2 migration, not a pattern to copy.

### Buttons
- **Shape:** Gently squared, `--radius-sm` (8px). Never fully pill-shaped — pills are for status.
- **Primary:** Teal fill, white text at weight 800.
- **Secondary:** Transparent fill, gold border and label.
- **Ghost:** No fill, no border, muted label.
- **Destructive:** Error-red text on a tinted fill, always behind a confirmation.
- All variants ship hover, focus (2px gold ring), active, disabled, and loading states — see
  `components/ui/Button.tsx`.

### Chips & Badges
Pill radius, tinted background at 10–15% of the accent, matching border at 20–34%. State mapping:
success (approved/accepted/active) · warning (pending/featured/rated) · error (rejected/blocked) ·
neutral (suspended/inactive). Always labelled — see `components/ui/Badge.tsx`.

### Cards / Containers
16px radius on content cards, `#141D27` dark / `#FFFFFF` light background, 1px `--border-subtle`
border. Flat at rest, lift + border tint on hover only if interactive.

### Inputs / Fields
Recessed `--bg-card-muted` fill, 1px `--border-subtle` border, `--radius-sm`. Focus shifts border to
gold plus the 3px gold focus ring (`--shadow-focus`). Error state uses `--color-error` on the border
and helper text below the field, never a tooltip.

### Empty States
Never a blank region. Centred icon, a bilingual sentence, and wherever possible the action that
would fill it.

## 6. Do's and Don'ts

### Do:
- **Do** use the canonical teal (`var(--color-primary)`) for every primary action, one per view.
- **Do** ship all seven states for every interactive element.
- **Do** pair every coloured status with a word or an icon, in both `ar` and `en`.
- **Do** give every animation a `prefers-reduced-motion` alternative.
- **Do** use skeletons that mirror the real layout for loading, not a bare spinner.
- **Do** branch on `ar` for anything directional — logical properties or an explicit branch.
- **Do** keep Admin on the same tokens and component language as the rest of the product, denser only.

### Don't:
- **Don't** ship the freelance bid-board, the playful consumer social app, the generic SaaS template
  landing, or the casting-agency portfolio site — see PRODUCT.md's anti-references.
- **Don't** introduce a new neon-green literal anywhere. If you find `#00D26A`/`#FFB800`/`#F4B740`
  in a file you're touching, retarget it to the matching token (`--color-primary`/
  `--color-secondary`) as part of that change.
- **Don't** use `background-clip: text` with a gradient.
- **Don't** apply a `border-left`/`border-right` wider than 1px as a coloured accent stripe.
- **Don't** nest a card inside a card.
- **Don't** use gold as an action colour outside the `/login`/`/register` auth exception.
- **Don't** force marketing-scale spacing or hero-scale type into Admin's data tables.
- **Don't** animate layout properties. Transform and opacity, plus blur/mask/clip-path where they
  materially improve an effect.
- **Don't** add a fourth accent colour. If a screen seems to need one, the screen's hierarchy is
  wrong, not the palette.
