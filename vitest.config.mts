import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { workspaceAliases } from "./vite.workspace.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));

/** First-party sources (e2e/ excluded — Playwright). */
const coverageInclude = [
  "packages/*/src/**/*.ts",
  "plugins/*/src/**/*.ts",
  "apps/web/src/**/*.{ts,tsx}",
  "apps/docs/**/*.ts",
];

const coverageExclude = [
  "**/*.test.ts",
  "**/*.test.mjs",
  "**/*.spec.ts",
  "**/*.d.ts",
  /** Config entry only; not loaded by Vitest (would run side effects). */
  "apps/docs/vite.config.ts",
  /** Browser IIFE bundles — not runnable in a Node/happy-dom test environment. */
  "plugins/vagrant-story/src/vs-fullscreen-menu.ts",
  "plugins/vagrant-story/src/emulator-overlay-panel.ts",
];

export default defineConfig({
  resolve: { alias: workspaceAliases(root) },
  test: {
    environment: "node",
    environmentMatchGlobs: [["packages/pcsx-wasm-shell/src/**/*.test.ts", "happy-dom"]],
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/*/src/**/*.spec.ts",
      "plugins/*/src/**/*.test.ts",
      "plugins/*/src/**/*.spec.ts",
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
      "scripts/**/*.test.mjs",
      "apps/docs/**/*.test.ts",
      "apps/web/**/*.test.ts",
    ],
    passWithNoTests: true,
    /** Vite `createServer` in multiple files can race dep-scan under load; keep integration tests stable. */
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: coverageInclude,
      exclude: coverageExclude,
      /** Whole-repo aggregate; raise as tests land. */
      thresholds: {
        // apps/web vite plugins + PSX bridge are in coverageInclude but thinly tested;
        // keep floors ~1pt under last aggregate (2026-03): ~44 stmts / ~40 branches / ~55 funcs / ~46 lines.
        lines: 45,
        functions: 54,
        branches: 39,
        statements: 42,
      },
    },
  },
});
