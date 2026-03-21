import { expect, test } from "@playwright/test";

test.describe("apps/web mock session", () => {
  test("home loads and mock session shows manifest and inventory", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Riskbreaker", level: 1 })).toBeVisible();

    await page.getByRole("button", { name: /Load mock session \(Vagrant Story\)/i }).click();

    const manifestPanel = page.locator("section.panel").filter({
      has: page.getByRole("heading", { name: "Manifest" }),
    });
    await expect(manifestPanel.getByText("Vagrant Story")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Rusty Broadsword")).toBeVisible({
      timeout: 15_000,
    });
  });
});
