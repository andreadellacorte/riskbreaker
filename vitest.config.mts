import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/*/src/**/*.spec.ts",
      "plugins/*/src/**/*.test.ts",
      "plugins/*/src/**/*.spec.ts",
    ],
    passWithNoTests: true,
  },
});
