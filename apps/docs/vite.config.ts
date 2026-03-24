import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

import { docsServerConfig } from "./docs-site.js";

const appDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: appDir,
  server: docsServerConfig(),
});
