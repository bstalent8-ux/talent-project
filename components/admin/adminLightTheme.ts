// ─── Admin light-mode palette — 2026-09-08 blue/white redesign ─────────────
// The admin back-office had no shared palette before this — every component
// declared its own `dark ? "#..." : "#..."` hex pair locally (CLAUDE.md §11
// rule 4). That's fine for a stable look, but this redesign needs the SAME
// new blue/white palette applied consistently across many admin components
// as they're migrated page by page — a single source avoids each file
// drifting to a slightly different blue.
//
// Admin-only, LIGHT MODE ONLY:
// - Dark mode is untouched by this redesign (per the 2026-09-08 decision) —
//   every touched component keeps its existing `dark ? <unchanged> : ...`
//   hex for the dark branch, only the light branch switches to these values.
// - These are NOT the site's global `--bg-card`/`--text-primary`/etc. CSS
//   tokens (app/globals.css) — those are shared with the public marketing
//   site (CLAUDE.md's "Landing Visual Foundation" tokens). Repointing this
//   redesign at literal hex here, the same way the rest of the admin already
//   works, keeps it from leaking into public pages.
// - `primary` replaces `var(--color-primary)` (the site's teal/brand accent)
//   for admin buttons/links/active-states in light mode specifically — for
//   the same "don't leak into the public site" reason. Dark mode keeps using
//   `var(--color-primary)` as it always has.

export const ADMIN_LIGHT = {
  pageBg:      "#EEF2FA",
  // Solid fallback (used behind the photo, and for anything that can't do a
  // background-image, e.g. the mobile overlay). The actual sidebar surface
  // is `sidebarPhotoBackground` below — a frosted-glass panel over a photo,
  // 2026-09-08.
  sidebarBg:   "#1D4FA0",
  sidebarPhotoBackground:
    'linear-gradient(180deg, rgba(13,42,105,0.90) 0%, rgba(20,55,130,0.55) 45%, rgba(10,28,75,0.94) 100%), url("/assets/auth-hero.avif") 50% 30% / cover no-repeat',
  // Glass pill for the active nav item — translucent white + backdrop-blur
  // (applied inline in AdminSidebar.tsx, CSS-in-object has no backdrop-
  // filter shorthand) so the photo still reads through it, not a flat fill.
  sidebarActiveBg:   "rgba(255,255,255,0.28)",
  sidebarActiveBorder: "rgba(255,255,255,0.35)",
  sidebarActiveText: "#FFFFFF",
  sidebarText:       "rgba(255,255,255,0.82)",
  sidebarHover:      "rgba(255,255,255,0.14)",
  card:        "#FFFFFF",
  border:      "#E3E9F5",
  text:        "#16213E",
  muted:       "#64748B",
  tableHead:   "#F6F9FC",
  inputBg:     "#F6F9FC",
  primary:     "#2F6FED",
  primaryDark: "#1D4FA0",
} as const;
