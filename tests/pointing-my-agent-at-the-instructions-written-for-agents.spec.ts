import { test, expect } from "@playwright/test";

test("The page head names the markdown alternate", async ({ page }) => {
  await page.goto("/");

  const alternate = page.locator('link[rel="alternate"]');

  await expect(alternate).toHaveAttribute("type", "text/markdown");
  await expect(alternate).toHaveAttribute("href", "/llms.txt");
});
