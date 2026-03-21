import path from "node:path";

/**
 * Resolve `@riskbreaker/*` workspace packages to package `src/index.ts` so Vite/Vitest work
 * without a prior `pnpm -r build` (dist/ may be absent).
 * @param {string} monorepoRoot
 * @returns {Record<string, string>}
 */
export function workspaceAliases(monorepoRoot) {
  const pkg = (subdir, name) => path.join(monorepoRoot, subdir, name, "src/index.ts");
  return {
    "@riskbreaker/shared-types": pkg("packages", "shared-types"),
    "@riskbreaker/shared-utils": pkg("packages", "shared-utils"),
    "@riskbreaker/plugin-sdk": pkg("packages", "plugin-sdk"),
    "@riskbreaker/plugin-vagrant-story": pkg("plugins", "vagrant-story"),
    "@riskbreaker/psx-runtime": pkg("packages", "psx-runtime"),
    "@riskbreaker/state-engine": pkg("packages", "state-engine"),
    "@riskbreaker/domain-engine": pkg("packages", "domain-engine"),
    "@riskbreaker/command-engine": pkg("packages", "command-engine"),
    "@riskbreaker/asset-pipeline": pkg("packages", "asset-pipeline"),
    "@riskbreaker/ux-platform": pkg("packages", "ux-platform"),
    "@riskbreaker/save-service": pkg("packages", "save-service"),
    "@riskbreaker/devtools": pkg("packages", "devtools"),
    "@riskbreaker/app-shell": pkg("packages", "app-shell"),
  };
}
