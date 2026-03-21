import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { workspaceAliases } from "../../vite.workspace.mjs";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "..", "..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: workspaceAliases(monorepoRoot),
  },
  server: {
    port: 5173,
  },
});
