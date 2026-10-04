import { defineConfig } from "vitest/config";

// API tests only (tests/api): they talk to a running app on the dev branch — see tests/api/api.test.ts.
// scripts/*.test.mjs run with `node --test` (npm test); tests/regression.js with Playwright.
export default defineConfig({
  test: { include: ["tests/api/**/*.test.ts"], testTimeout: 20_000, hookTimeout: 60_000, fileParallelism: false },
});
