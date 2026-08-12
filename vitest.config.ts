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
      // MVP registration-scope repair: both additions are pure,
      // dependency-free logic/data (talent-types.ts, submit-outcome.ts) or
      // a fully-mocked route handler test — same rationale as the two globs
      // above, not a broader testing initiative.
      // Parens in a route-group folder name must be glob-escaped, or
      // fast-glob parses "(auth)" as a group and matches nothing.
      "app/\\(auth\\)/register/**/*.test.ts",
      "app/api/profile/**/*.test.ts",
    ],
  },
});
