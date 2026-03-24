import { defineConfig, devices } from "@playwright/test";

const defaultOrigin = "http://127.0.0.1:5173";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? defaultOrigin;
const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  ...(!skipWebServer
    ? {
        webServer: {
          command:
            "pnpm -w run ensure:pcsx-wasm && pnpm --filter @riskbreaker/web exec vite --host 127.0.0.1 --port 5173",
          url: defaultOrigin,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
