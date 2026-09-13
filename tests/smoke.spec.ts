import { test, expect } from "@playwright/test";

test("the home page loads", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/.+/);
});
