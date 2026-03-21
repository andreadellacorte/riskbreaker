import { expect, test } from "@playwright/test";

/**
 * Minimal smoke: proves the browser launches and assertions run in CI.
 * Replace with app-driven flows once `apps/web` hosts a real URL (Harness 05+).
 */
test("network smoke — example.com responds", async ({ page }) => {
  const res = await page.goto("https://example.com/", { waitUntil: "domcontentloaded" });
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Example Domain/i);
});
