import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Scoped to features/profiles and components/profile — the layers with pure,
// unit-testable logic. Not a repo-wide testing initiative.
//
// No jsdom and no React renderer: the adapters split prop-building (pure) from
// rendering (JSX), and the tests target the pure half. That keeps the dev
// dependency to vitest alone.
//
// "server-only" is aliased to a local no-op stub: Next.js resolves that
// specifier through its own webpack alias, not a real npm package, so plain
// Node (what vitest runs under) has nothing to resolve it to otherwise. Lets
// a test import a service file guarded by `import "server-only"` — e.g.
// profile.service.ts — with dependency injection, exactly as
// createProfileService(overrides) is designed for.

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "features/profiles/**/*.test.ts",
      "components/profile/**/*.test.ts",
      // Sprint 1 (profile-category-foundation): both additions are pure,
      // dependency-free logic/data — same rationale as the two globs above,
      // not a broader testing initiative. app/(auth)/register/talent-types.ts
      // has zero React/CSS/Next imports by design, specifically so it is
      // safe to import here.
      "features/categories/**/*.test.ts",
      // Parens in a route-group folder name must be glob-escaped, or
      // fast-glob parses "(auth)" as a group and matches nothing.
      "app/\\(auth\\)/register/**/*.test.ts",
      "app/api/profile/**/*.test.ts",
    ],
  },
});
