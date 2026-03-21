/// <reference types="vite/client" />

declare module "*vite.workspace.mjs" {
  export function workspaceAliases(monorepoRoot: string): Record<string, string>;
}
