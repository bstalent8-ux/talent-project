import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Scoped to features/profiles and components/profile — the layers with pure,
// unit-testable logic. Not a repo-wide testing initiative.
//
// No jsdom and no React renderer: the adapters split prop-building (pure) from
// rendering (JSX), and the tests target the pure half. That keeps the dev
// dependency to vitest alone.

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "features/profiles/**/*.test.ts",
      "components/profile/**/*.test.ts",
    ],
  },
});
