import { coverageConfigDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Next.js's postcss.config.mjs uses Tailwind v4's string-based plugin
  // syntax, which only Next's own bundler understands — Vite (used by
  // Vitest) errors trying to load it directly. Tests don't need real CSS
  // processing, so we override with an empty, Vite-native postcss config
  // instead of letting Vite auto-discover the project's config file.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // The */repository.test.ts integration suites share one real database
    // and each does an unscoped db.delete(table) in afterEach (no WHERE
    // clause) rather than only removing rows it created — safe as long as
    // test files run one at a time, but Vitest's default file-level
    // parallelism lets two such files race on the same tables and delete
    // each other's fixtures mid-test. Confirmed: these tests are flaky when
    // run alongside each other and reliably pass in isolation.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Route-level page.tsx files, Navbar, and a couple of pure-wrapper
      // files carry no meaningful business logic of their own (auth-check +
      // redirect + call an already-tested service/repository function +
      // render) — they're validated by manual/browser walkthroughs, not
      // unit tests. Excluded so the 80% gate stays meaningful for actual
      // business logic instead of being diluted by ~20 thin wrappers.
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/app/**/page.tsx",
        "src/app/layout.tsx",
        "src/app/components/Navbar.tsx",
        "src/app/components/auth/sign-out-action.ts",
        "src/app/(auth)/oauth-actions.ts",
        "src/app/api/auth/[...nextauth]/route.ts",
        "src/server/auth/config.ts",
        "*.config.ts",
        "*.config.mjs",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
