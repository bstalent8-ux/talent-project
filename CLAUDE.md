# Talents Engineering Notes

## Theme System

The global theme lives in `app/globals.css`.

The theme now uses semantic CSS variables instead of page-specific hardcoded color names. Core token groups:

- Brand: `--color-primary`, `--color-secondary`, `--color-accent`
- Status: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- Surfaces: `--bg-page`, `--bg-page-subtle`, `--bg-surface`, `--bg-card`, `--bg-card-muted`, `--bg-muted`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`
- Structure: `--border-subtle`, `--border-strong`, `--divider`
- Shape/elevation: `--radius-*`, `--shadow-*`
- Rhythm/motion: `--space-*`, `--duration-*`, `--ease-*`
- Typography: `--font-sans`, `--font-display`, `--text-*`

Both `[data-theme="dark"]` and `[data-theme="light"]` are supported. The existing `SiteProvider` and root initialization script continue to control `lang`, `dir`, and `data-theme`.

Backward-compatible aliases such as `--color-teal`, `--color-gold`, `--bg-base`, and `--bg-card` remain available so older pages can migrate incrementally without breaking.

## Landing Page Architecture

The landing page is composed from `app/(main)/home/_components/HomeClient.tsx`, which now delegates to:

- `app/(main)/home/_components/landing/LandingPage.tsx`
- `app/(main)/home/_components/landing/content.ts`
- `app/(main)/home/_components/landing/LandingPage.module.css`

`content.ts` owns editable landing content: Arabic/English copy, media URLs, categories, featured talent fallbacks, workflow steps, campaign moments, features, testimonials, pricing preview, and FAQ.

`LandingPage.tsx` owns the component structure and keeps the page behavior close to the existing route. It accepts the current server-provided featured talents and fills visual gaps with curated fallback content only when live data is missing.

`LandingPage.module.css` owns all landing-specific presentation. The goal is to keep the landing page editable without spreading inline styles across sections.

## Design Decisions

- The landing page uses a premium creator-marketplace direction: cinematic hero, real photographic media, compact search, trust metrics, category cards, talent cards, workflows, campaign proof, testimonials, pricing preview, FAQ, and final CTA.
- Motion uses Framer Motion only for first-viewport hero entrance and floating category chips. CSS includes a `prefers-reduced-motion` fallback.
- The page remains RTL-first and supports English through the existing language state.
- Pricing is intentionally a preview and does not alter billing, booking, API, auth, or Supabase flows.
- Remote photography is centralized in `content.ts` so production assets can replace it later without editing component logic.

## Future Maintenance

When redesigning the rest of the product, migrate hardcoded colors and inline style objects to the semantic tokens gradually. Preserve behavior first, then improve visual consistency page by page.
