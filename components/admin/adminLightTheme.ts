// ─── Admin palette — 2026-09-24 brand rebrand ──────────────────────────────
// Was a blue/white light theme (2026-09-08). Now the Talents identity, the
// same one the auth pages use: Deep Teal #087F83 primary, Dark Chocolate
// #2B211D + Soft Teal #4FA7A3 secondary, Muted Peach #E7A58A accent, Vanilla
// Cream #F5EEDB page ground.
//
// The sidebar is a Dark Chocolate rail in BOTH themes (like the auth
// showcase card), with a Muted Peach active pill — the same accent the public
// navbar uses for its active link.
//
// Admin components still fork `dark ? <hex> : ADMIN_LIGHT.x` locally
// (CLAUDE.md §11 rule 4); their dark branches were remapped to the warm
// chocolate dark theme in app/globals.css in the same pass.

export const ADMIN_LIGHT = {
  pageBg:      "#F5EEDB",
  sidebarBg:   "#2B211D",
  sidebarPhotoBackground:
    "radial-gradient(120% 60% at 0% 0%, rgba(8,127,131,0.38) 0%, transparent 60%), radial-gradient(90% 50% at 100% 100%, rgba(231,165,138,0.18) 0%, transparent 65%), #2B211D",
  sidebarActiveBg:     "#E7A58A",
  sidebarActiveBorder: "rgba(231,165,138,0.6)",
  sidebarActiveText:   "#2B211D",
  sidebarText:         "rgba(245,238,219,0.78)",
  sidebarHover:        "rgba(245,238,219,0.08)",
  card:        "#FBF7EA",
  border:      "#E6DCC6",
  text:        "#2B211D",
  muted:       "#6E5F55",
  tableHead:   "#F1E8D2",
  inputBg:     "#FFFDF6",
  primary:     "#087F83",
  primaryDark: "#066A6D",
} as const;

/** Dark-mode counterparts, derived from Dark Chocolate (see globals.css). */
export const ADMIN_DARK = {
  pageBg:      "#1B1310",
  sidebarBg:   "#140E0B",
  card:        "#2B211D",
  border:      "#3A2E28",
  text:        "#F5EEDB",
  muted:       "#A99B8E",
  tableHead:   "#261C18",
  inputBg:     "#261C18",
} as const;
