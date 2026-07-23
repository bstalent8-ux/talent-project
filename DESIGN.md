---
name: Talents
description: Arabic-first, RTL talent marketplace — dark by default, lit like a green room, built so the person is the brightest thing on screen.
colors:
  action-green: "#00D26A"
  action-green-dim: "#00A554"
  signal-gold: "#FFB800"
  signal-gold-soft: "#F4B740"
  alert-red: "#EF4444"
  info-blue: "#60A5FA"
  premium-violet: "#A78BFA"
  ink-base: "#050B12"
  ink-surface: "#0A121C"
  ink-card: "#0D1623"
  ink-elevated: "#111C35"
  ink-border: "#1E293B"
  ink-text: "#F1F5F9"
  ink-text-muted: "#A8B3C2"
  ink-divider: "#475569"
  paper-base: "#F1F5F9"
  paper-surface: "#FFFFFF"
  paper-elevated: "#E2E8F0"
  paper-border: "#CBD5E1"
  paper-text: "#0F172A"
  paper-text-muted: "#64748B"
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
  control-lg: "10px"
  card: "12px"
  card-lg: "16px"
  pill: "20px"
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
    backgroundColor: "{colors.action-green}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.control-lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "#00E878"
    textColor: "#000000"
  button-primary-disabled:
    backgroundColor: "{colors.action-green-dim}"
    textColor: "#000000"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.signal-gold-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.control-lg}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "rgba(244,183,64,0.08)"
    textColor: "{colors.signal-gold-soft}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.ink-surface}"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
  card-talent:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.card-lg}"
    padding: "14px 14px 16px"
  badge-status:
    backgroundColor: "rgba(0,210,106,0.12)"
    textColor: "{colors.action-green}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  badge-rating:
    backgroundColor: "rgba(244,183,64,0.10)"
    textColor: "{colors.signal-gold-soft}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  navbar:
    backgroundColor: "rgba(5,11,18,0.85)"
    textColor: "{colors.ink-text}"
    typography: "{typography.body}"
    height: "60px"
    padding: "0 24px"
---

# Design System: Talents

## 1. Overview

**Creative North Star: "The Green Room"**

A green room is the space backstage where talent waits before going on: dark, warm-lit,
unmistakably professional, and arranged entirely around the person in it. Nobody decorates a green
room. Everything in it either helps the performer get ready or gets out of the way. That is the
whole brief for this interface. Surfaces are deep and quiet, the chrome recedes, and the brightest
things on any screen are a person's face, their work, and the one action they can take next.

The system is dark by default and light by daylight — both modes are designed, never auto-inverted.
Depth comes from tinted borders and background steps rather than from stacked shadows, and colour is
spent, not sprinkled: a single neon green carries every action, a gold marks everything the platform
itself has verified or scored, and nothing else earns saturation. The one deliberate exception is
photography, which is allowed to be as loud as it wants.

This system explicitly rejects the four shapes named in PRODUCT.md. It is not the **freelance
bid-board** — no dense listing rows, no haggling chrome, no creator flattened to a rate. It is not
the **playful consumer social app** — no mascots, no sticker energy, no bouncing. It is not the
**generic SaaS template landing** — no gradient hero, no three identical icon cards, no tracked
uppercase eyebrow over every section. And it is not the **casting-agency portfolio site** — no thin
serif minimalism, no mostly-white gallery, because this is a place you transact, not a place you
enquire.

**Key Characteristics:**
- Dark near-black stage (`#050B12`), lit surfaces stepping up to `#0D1623`, photography as the light source
- One neon green for action, one gold for earned status, and a strict ban on anything else being saturated
- Cairo carries almost everything; hierarchy is built from weight, not from a zoo of fonts
- Flat at rest; shadow and glow are responses to state, never decoration
- 8–16px radii, dense but breathable padding, RTL as the native reading direction
- Every interactive element ships all seven states or it isn't finished

## 2. Colors

A near-black stage with two saturated voices — a neon green that means *act* and a gold that means
*proven* — over a cool slate neutral ramp that carries every mode.

### Primary
- **Stage Green** (`#00D26A`): The single action colour. Primary buttons, active nav and tab states,
  success confirmations, the price on a talent card, the scrollbar thumb, the "accepted" state in
  the booking pipeline. Used as a **fill with black text** (10.4:1) on emphasis, and as text only on
  dark surfaces (9.8:1 on `#050B12`). Roughly 130 usages across `app/` and `components/` — this is
  the real primary and everything else defers to it.
- **Stage Green Dim** (`#00A554`): Disabled and in-flight states of a green control. Keeps the fill
  legible against black text while reading unmistakably inactive.

> **Deprecated:** `--color-teal` `#00C9B1` is a legacy token wired into `.btn-primary`,
> `.badge-teal`, and the glow variables in `globals.css`. Every one of those utilities has **zero
> usages** outside `globals.css` — they render nowhere. This is dead code, not a competing primary.
> Delete the utility block rather than retargeting it, and never introduce new teal.

### Secondary
- **Verified Gold** (`#FFB800`) and **Warm Gold** (`#F4B740`): Everything the platform itself
  vouches for — star ratings, verification badges, "featured", VIP and premium markers, the pending
  state in moderation. Warm Gold is the softer profile-surface variant; both read at 10:1+ on dark
  surfaces. Gold is also currently the CTA on `/login` and `/register`; that is a scoped auth-theme
  exception, not licence to use gold as an action colour elsewhere.

### Tertiary
- **Alert Red** (`#EF4444`): Errors, destructive confirmations, rejected states, sign-out. Never
  decorative.
- **Info Blue** (`#60A5FA`) and **Premium Violet** (`#A78BFA`): Narrow, specific roles only —
  informational system messages and the premium/creative marker respectively. If a screen needs a
  fourth accent, the screen is wrong, not the palette.

### Neutral
- **Stage Black** (`#050B12`): The page floor in dark mode. Everything sits on it.
- **Stage Surface** (`#0A121C`): Inputs, wells, and recessed regions — one step *down* in
  perceived depth even though it is lighter than the floor.
- **Stage Card** (`#0D1623`): The standing card and panel surface. The most common non-black
  background in the app.
- **Stage Elevated** (`#111C35`): Menus, dropdowns, and modals — the only surfaces allowed to float.
- **Stage Border** (`#1E293B`): Structural dividers and card edges in their resting state.
- **Stage Ink** (`#F1F5F9`) / **Stage Ink Muted** (`#A8B3C2`): Primary and secondary text on dark.
  Muted lands at 8.7:1 on `#0D1623` — comfortably AA, and it is the *only* approved muted text on dark.
- **Divider Slate** (`#475569`): Borders, rules, and disabled iconography **only**. It measures
  2.4:1 against `#0D1623` and is forbidden as text.
- **Paper** ramp for light mode: base `#F1F5F9`, surfaces `#FFFFFF`, elevated `#E2E8F0`, borders
  `#CBD5E1`, ink `#0F172A`, muted `#64748B` (4.8:1 on white — AA, with no headroom to lighten).

### Named Rules

**The One Action Rule.** Exactly one Stage Green fill per view. If a screen shows two green buttons,
one of them is not the primary action — demote it to the gold outline or the ghost variant. Green is
the answer to "what do I do here", and a second answer is a broken question.

**The Earned Gold Rule.** Gold marks what the *platform* asserts — a rating we computed, an identity
we verified, a placement we granted. It never marks what we want the user to click. Selling the look
of verification is the same failure as selling the badge.

**The Green-On-White Prohibition.** Stage Green as text on a white or `#F1F5F9` surface measures
2.0:1 and is forbidden at any size. In light mode, green appears as a *fill* with black text, or as
a border, or not at all. This is the single most likely contrast bug in this codebase.

**The Colour-Plus-Label Rule.** Booking status, moderation state, and verification never communicate
through hue alone. Every coloured chip carries a word or an icon, in both languages. The palette
leans green/gold/orange/red — precisely the band that collapses for red-green colour blindness.

## 3. Typography

**Display Font:** Changa (fallback Cairo, sans-serif) — marketing surfaces only
**Body Font:** Cairo 300–800 (fallback Inter, system-ui, sans-serif) — everything else
**Numeric Font:** JetBrains Mono 400/500 — figures that need to align or be read as data

**Character:** Cairo is a humanist Arabic/Latin face that stays legible at 11px and gains real
presence at 800 — which is why hierarchy here is built almost entirely from weight rather than from
size or family. Changa is heavier and more architectural; it exists for hero display on the
marketing surfaces and nowhere else. JetBrains Mono appears only where digits must line up.

### Hierarchy
- **Display** (Changa 700, 40px, 1.15, −0.01em): Marketing hero headlines on `/home`,
  `/become-talent`, `/brands`. May scale fluidly with `clamp()` on those pages only, with a hard
  ceiling of 4rem. Never appears inside the authenticated product.
- **Headline** (Cairo 800, 32px, 1.2): Page-level titles — auth headings, profile names, section
  openers. Fixed size; product headings do not scale with viewport.
- **Title** (Cairo 800, 18px, 1.3): Section and card-group headings. The workhorse heading of the app.
- **Body** (Cairo 400, 14px, 1.5): Default copy, form values, chat messages. Cap prose at 65–75ch;
  tables and dense panels may run wider.
- **Label** (Cairo 600, 13px, 1.4): Field labels, button text, nav items, tab labels.
- **Meta** (Cairo 500, 11–12px, 1.4): Timestamps, counts, helper text, card sub-lines.
- **Numeric** (JetBrains Mono 500, 13px): Prices, follower counts, IDs, analytics figures, table
  columns of digits.

### Named Rules

**The Weight-Not-Size Rule.** Emphasis is 600 → 700 → 800 at the same size before it is ever a
larger size. The scale between adjacent steps is deliberately tight (roughly 1.15–1.25); a product
this dense cannot afford dramatic type contrast without turning into noise.

**The One Family Rule.** Cairo carries headings, buttons, labels, body, and data. Reaching for a
second family inside the product surface is prohibited — including Changa. If a screen feels flat,
the fix is weight, spacing, or colour, never a new font.

**The Balanced Head Rule.** Every h1–h3 sets `text-wrap: balance`; long prose sets
`text-wrap: pretty`. Arabic headlines break badly by default and this is not optional.

## 4. Elevation

This system is **flat at rest**. Depth is expressed through background steps and tinted borders, not
through a shadow ramp: `#050B12` floor → `#0A121C` recessed → `#0D1623` card → `#111C35` floating.
Every value below is applied through inline styles and framer-motion `whileHover`, not through CSS
utility classes — the `globals.css` shadow and hover utilities are dead code (see Do's and Don'ts).
Borders do the separating work — `#1E293B` structurally, and a green- or gold-tinted 1px border
(`rgba(0,210,106,0.15)`, `rgba(244,183,64,0.20)`) where a surface carries state. Shadows and glows
exist, but only as a **response**: hover, focus, active, or genuine overlay. A card that is sitting
still casts nothing.

The practical test: screenshot any screen at rest and desaturate it. If you can still see where the
shadows are, there are too many.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 8px 32px rgba(0,210,106,0.12)`): Hover on a talent or content card
  in dark mode. Paired with `translateY(-4px)`. The light-mode equivalent drops the hue:
  `0 8px 24px rgba(0,0,0,0.10)`.
- **Panel float** (`box-shadow: 0 20px 40px -12px rgba(0,0,0,0.45)`): Dropdowns, menus, and modals —
  surfaces that genuinely sit above the page.
- **Focus ring** (`box-shadow: 0 0 0 3px rgba(0,210,106,0.35)`): The standard focus treatment on
  every interactive element. Always paired with a visible border shift so it never relies on glow alone.
- **Status pulse** (`.pulse-glow`, 3s): Reserved exclusively for live status indicators — online
  dots, in-progress markers. The only looping animation in the system.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces are flat until the user touches them. Any `box-shadow` in a
default (non-hover, non-focus, non-overlay) style is a bug.

**The Glass Is Rare Rule.** `backdrop-filter` is permitted on exactly two things: the sticky navbar
and true modal backdrops. The `.glass-panel` utility in `globals.css` is currently unused — leave it
that way. Decorative glass on content cards costs real GPU on the phones this audience actually
uses, and glassmorphism-by-default is the tell of a template.

**The Two-Step Rule.** No surface sits more than two background steps above its parent. Nested cards
are always wrong; if content needs its own container inside a card, use a divider or a background
tint, not another card.

## 5. Components

Buttons, cards, and inputs should feel **confident and instrumental** — solid fills, decisive
weights, fast state changes, nothing springy. This is a working tool that a marketer with a budget
and a creator with a deadline both need to trust on the first screen.

### Buttons
- **Shape:** Gently squared (10px radius on primary/secondary actions, 8px on compact and toolbar
  controls). Never fully pill-shaped — pills are for status, not for actions.
- **Primary:** Stage Green fill (`#00D26A`) with **black** text at weight 800, `12px 20px` padding.
  Black on green is deliberate: it is the highest-contrast pairing available (10.4:1) and it reads as
  a physical, pressable key rather than a link.
- **Hover / Focus:** Background lifts to `#00E878` over 180ms `ease-out`. Focus adds the 3px green
  focus ring plus a border shift; the ring is never removed without a replacement.
- **Active / Disabled / Loading:** Active darkens to `#00A554` with no transform. Disabled uses
  `#00A554` at 60% opacity with `cursor: not-allowed`. Loading swaps the label for a spinner and
  keeps the button's width fixed so the layout does not jump.
- **Secondary:** Transparent fill, 1.5px Warm Gold border (`#F4B740`), gold label at 800. Hover
  fills with `rgba(244,183,64,0.08)`. Used for the second-choice action beside a green primary.
- **Ghost:** No fill, no border, muted label. Hover raises the label to full ink and adds a subtle
  surface tint. For tertiary and destructive-adjacent actions.
- **Destructive:** Alert Red text on a `rgba(239,68,68,0.10)` fill with a matching 20% border. Always
  behind a confirmation.

### Chips & Badges
- **Style:** Pill (20px radius), `2–3px 8–10px` padding, 11–12px at weight 700, accent text on a
  10–15% tint of the same accent with a 20–33% border of that accent. One formula, four colours.
- **State mapping:** green = approved / accepted / active; gold = pending / featured / rated;
  red = rejected / blocked; slate = suspended / inactive.
- **Always labelled.** A bare coloured dot is never a status. See the Colour-Plus-Label Rule.

### Cards / Containers
- **Corner Style:** 16px on content and talent cards, 12px on compact list items and panels.
- **Background:** Stage Card `#0D1623` in dark, `#FFFFFF` in light.
- **Border:** 1px — `rgba(0,255,163,0.15)` in dark, `#E2E8F0` in light. The border, not a shadow,
  is what separates a card from the page.
- **Shadow Strategy:** None at rest. Card lift on hover only. See Elevation.
- **Internal Padding:** `14px 14px 16px` on media cards (slightly deeper at the bottom so the price
  row breathes), `16–24px` on content panels.
- **Media:** Square aspect via `padding-top: 100%`, image `object-fit: cover`, overlay chips pinned
  to the corners on a `rgba(0,0,0,0.7)` scrim so they stay legible over any photograph.

### Inputs / Fields
- **Style:** Recessed Stage Surface fill (`#0A121C`), 1px `#1E293B` border, 8px radius,
  `11px 14px` padding, 14px body text. Label above at 13px/600 in muted ink, 6px gap.
- **Focus:** Border shifts to Stage Green, plus the 3px green focus ring. `outline: none` alone is
  never acceptable.
- **Error:** Border and helper text in Alert Red, helper text at 13px directly below the field —
  never as a tooltip and never as colour alone.
- **Disabled:** 60% opacity, `cursor: not-allowed`, no focus ring.
- **Placeholder:** Must clear 4.5:1 like body text. The default browser grey does not.
- **Direction:** Email, password, phone, URL, and price fields set `direction: ltr` even inside the
  RTL document; everything else inherits.

### Navigation
- **Style:** 60px sticky bar, `rgba(5,11,18,0.85)` with `backdrop-filter: blur(12px)`, 1px bottom
  border. One of only two places blur is allowed.
- **Items:** 14px Cairo, weight 500 at rest and 700 when active, with a 2px gold underline pinned
  under the active item.
- **Mobile:** Collapses to a hamburger and a full-width stacked sheet at the same background, items
  at 15px with 1px dividers. Directional icons flip with language; the logo and non-directional
  icons do not.

### Signature: The Talent Card
The single most important component in the product, and the one that carries the anti-references.
Square photograph first at full card width, verified and featured chips pinned over the top corners,
rating chip bottom-left on a dark scrim. Below the image: name at 14px/800, then a green category
pill, then location in muted meta, then gold specialty chips. A divider, then the price row — label
in 10px muted, figure in **16px/900 Stage Green** — with the primary action to its side.

The photograph leads and the price follows. Invert that order and the card becomes the bid-board
this system exists to not be.

### Empty States
Never a blank region. Centred icon, a bilingual sentence explaining what would appear here, and
wherever possible the action that would fill it. An empty state teaches the interface; "no results"
alone is a dead end.

## 6. Do's and Don'ts

### Do:
- **Do** use `#00D26A` for every primary action, and exactly one per view.
- **Do** put black text on green fills (10.4:1) and black text on gold fills (12.1:1). These are the
  system's two highest-contrast pairings and they read as physical keys.
- **Do** use `#A8B3C2` for muted text on dark and `#64748B` for muted text on light. These are the
  only two approved muted text values.
- **Do** reserve `#475569` for borders, dividers, and disabled icons — it fails body-text contrast at
  2.4:1 on `#0D1623`.
- **Do** ship all seven states for every interactive element: default, hover, focus, active,
  disabled, loading, error. Half a component is not a component.
- **Do** keep transitions in the 150–250ms band inside the product. Users are mid-task.
- **Do** pair every coloured status with a word or an icon, in both `ar` and `en`.
- **Do** give every animation a `prefers-reduced-motion` alternative. There are currently **zero**
  occurrences of `prefers-reduced-motion` in the codebase against 34 files using framer-motion —
  this is the largest open accessibility gap in the system.
- **Do** let scroll reveals enhance already-visible content. Content must never be invisible until a
  transition fires.
- **Do** use skeletons that mirror the real layout for loading, not a centred spinner in a content well.
- **Do** branch on `ar` for anything directional. Logical properties or an explicit branch — never a
  hardcoded `left`/`right`.

### Don't:
- **Don't** ship the **freelance bid-board**. No dense listing rows, no bid-and-haggle framing, no
  talent card that leads with a rate instead of a face and a body of work.
- **Don't** ship the **playful consumer social app**. No mascots, no sticker energy, no bouncing or
  elastic easing, no emoji in chrome. Emoji stay confined to pipeline system messages (📋 💳 ✅ ❌)
  where they act as scannable state markers.
- **Don't** ship the **generic SaaS template landing**. No gradient hero, no three identical icon
  cards, no big-number stat row, no tiny uppercase tracked eyebrow above every section, no
  `01 / 02 / 03` numbered scaffolding. This trap lives on `/home` and `/become-talent`.
- **Don't** ship the **casting-agency portfolio site**. No thin serif display, no mostly-white
  gallery, no oversized editorial whitespace. This is a marketplace, not an agency.
- **Don't** use `#00D26A` as text on white or `#F1F5F9` — it measures 2.0:1. Fill or border only in
  light mode.
- **Don't** use `background-clip: text` with a gradient. `.text-gradient` in `globals.css` is an
  unused legacy utility; delete it rather than reach for it.
- **Don't** revive the dead utility layer in `globals.css`. `.glass-panel`, `.btn-primary`,
  `.btn-cta`, `.btn-premium`, `.badge-teal/gold/purple`, `.card-hover`, `.brand-gradient`,
  `.text-gradient`, every `.sr-*` scroll-reveal, and every `.ld-*` loading class have zero usages
  outside that file. The live system is inline styles plus framer-motion. Delete the block; don't
  extend it, and don't reach for a class that renders nowhere.
- **Don't** apply a `border-left` or `border-right` wider than 1px as a coloured accent stripe on
  cards, list items, or alerts. Use a full border, a background tint, or nothing.
- **Don't** nest a card inside a card. Use a divider or a background tint.
- **Don't** use `.glass-panel` decoratively. Blur belongs to the navbar and modal backdrops, nowhere else.
- **Don't** introduce `#00C9B1` teal. It is the deprecated token primary; retarget `.btn-primary`
  and `.badge-teal` to green when you touch them.
- **Don't** use gold as an action colour outside the `/login` and `/register` auth theme. Gold means
  earned, not clickable.
- **Don't** extend the `#talents-app-root.light-mode` override block in `globals.css`. It predates
  `data-theme`, force-recolours Tailwind slate classes with `!important`, and is applied to nothing.
  New components read `dark` from `useSite()` and style both modes directly.
- **Don't** animate layout properties. Transform and opacity, plus blur/mask/clip-path where they
  materially improve an effect.
- **Don't** loop any animation except `.pulse-glow` on a live status indicator.
- **Don't** add a fourth accent colour. If a screen seems to need one, the screen's hierarchy is
  wrong, not the palette.
- **Don't** let a heading overflow its container. Test hero and card headings at 360px, 768px, and
  1440px in both Arabic and English — Arabic strings run materially longer.
