import { test, expect } from "@playwright/test";

test("The page head carries the search description", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Martin turns Claude Code into an expert software engineer: describe an idea and get a production codebase in one shot. Get your license key for $5.",
  );
});
