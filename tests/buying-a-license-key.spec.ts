import { test, expect } from "@playwright/test";

test("Martin pitches itself in the first person", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toHaveText(
    "Turn your coding agent into a Software Engineering agent",
  );

  const paragraph = page.locator("h1 + p");
  await expect(paragraph).toContainText("production codebase in one shot");
  await expect(paragraph).toContainText(/^I’m a Claude Code plugin/);
});

test("The price is on the button", async ({ page }) => {
  await page.goto("/");

  await expect(
    page
      .getByRole("link", {
        name: "Get your license key for $5",
        exact: true,
      })
      .first(),
  ).toBeVisible();
});

test("The button takes me to checkout", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("link", { name: "Get your license key for $5", exact: true })
    .first()
    .click();
  await page.waitForURL(/buy\.stripe\.com/);

  expect(page.url()).toContain("buy.stripe.com");
  await expect(page.locator('input[name="customUnitAmount"]')).toHaveValue(
    "$5.00",
  );
});
