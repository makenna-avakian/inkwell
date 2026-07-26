import { defineConfig } from "vitest/config";
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
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
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
