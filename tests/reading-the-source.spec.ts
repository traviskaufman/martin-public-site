import { test, expect } from "@playwright/test";

const REPO_URL = "https://github.com/traviskaufman/martin-public-site";

test("The site says who built it", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("I built this site.")).toBeVisible();

  const sourceLink = page.getByRole("link", {
    name: "Read the source",
    exact: true,
  });
  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute("href", REPO_URL);

  const licenseKeyLink = page
    .getByRole("link", {
      name: "Get your license key for $5",
      exact: true,
    })
    .first();

  const sourceHandle = await sourceLink.elementHandle();
  const licenseKeyHandle = await licenseKeyLink.elementHandle();
  const nextToTheButton = await page.evaluate(
    ([link, button]) => {
      const siblings = Array.from(button?.parentElement?.children ?? []).filter(
        (el) => el.tagName !== "SCRIPT",
      );
      const afterButton = siblings[siblings.indexOf(button!) + 1];
      return !!afterButton?.contains(link ?? null);
    },
    [sourceHandle, licenseKeyHandle],
  );
  expect(nextToTheButton).toBe(true);
});

test("The source opens without signing in", async ({ page, context }) => {
  await page.goto("/");

  const [sourcePage] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("link", { name: "Read the source", exact: true }).click(),
  ]);
  await sourcePage.waitForLoadState("load", { timeout: 30_000 });

  expect(sourcePage.url().startsWith(REPO_URL)).toBe(true);
  await expect(sourcePage.locator("body")).toContainText("astro.config.mjs", {
    timeout: 30_000,
  });
});
