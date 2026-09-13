import { test, expect } from "@playwright/test";

const REPO_URL = "https://github.com/traviskaufman/martin-public-site";

test("The company is named", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  await expect(footer).toContainText(
    "Copyright (c) 2026 Singularity Studios, LLC",
  );
});

test("The city is named", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  await expect(footer).toContainText("Made with ❤️ in NYC");
});

test("The footer links to the source", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  const sourceLink = footer.getByRole("link", {
    name: "View website source code",
    exact: true,
  });
  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute("href", REPO_URL);
});

test("The footer source link opens the repository", async ({
  page,
  context,
}) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  const [sourcePage] = await Promise.all([
    context.waitForEvent("page"),
    footer
      .getByRole("link", { name: "View website source code", exact: true })
      .click(),
  ]);
  await sourcePage.waitForLoadState("load", { timeout: 30_000 });

  expect(sourcePage.url().startsWith(REPO_URL)).toBe(true);
  await expect(sourcePage.locator("body")).toContainText("astro.config.mjs", {
    timeout: 30_000,
  });
});
