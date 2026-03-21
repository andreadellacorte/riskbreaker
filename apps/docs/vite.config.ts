import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: appDir,
  server: {
    port: 5174,
  },
});
