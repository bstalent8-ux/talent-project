// Vitest-only stub for the "server-only" package. Next.js resolves that
// specifier via its own webpack alias, not a real npm dependency — it has no
// runtime effect there beyond a build-time guard, so an empty module is a
// faithful stand-in for tests, which run in plain Node, not the Next build.
export {};
