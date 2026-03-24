import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

const rootDir = import.meta.dirname;

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "bins/**",
      ".groove/**",
      ".agents/**",
      ".cursor/**",
      "vitest.config.mts",
      "**/.turbo/**",
      "**/coverage/**",
      "apps/web/public/pcsx-wasm/**",
      "packages/pcsx-wasm-shell/shims/**",
      // PCSX-wasm fork artifacts + Emscripten glue are generated/minified and
      // are not authored app code. Exclude from lint noise.
      "packages/pcsx-wasm-core/runtime/**",
      "packages/pcsx-wasm-core/js/**",
      "packages/pcsx-wasm-core/pcsx_worker.js",
      "packages/pcsx-wasm-core/pcsx_ww.js",
      "third_party/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        /** `page.evaluate` callbacks are browser-side; ESLint parses them in this file. */
        document: "readonly",
        localStorage: "readonly",
        performance: "readonly",
        globalThis: "readonly",
        setTimeout: "readonly",
      },
    },
  },
  {
    files: ["packages/pcsx-wasm-shell/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: rootDir,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
);
