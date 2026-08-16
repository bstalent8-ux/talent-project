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
      "lib/**/*.test.ts",
      "app/api/profile/**/*.test.ts",
      "app/\\(auth\\)/register/**/*.test.ts",
    ],
  },
});
