import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const dark = "rgb(0, 43, 54)";
const light = "rgb(253, 246, 227)";

async function openWithTheBarShowing(page: Page): Promise<void> {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Get your license key for $5", exact: true })
    .first()
    .evaluate((el) => {
      const bottom = el.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo(0, bottom + 40);
    });
  await expect(page.getByRole("banner")).toBeVisible();
}

function pageBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test("the page is dark whatever my system prefers", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openWithTheBarShowing(page);

  expect(await pageBackground(page)).toBe(dark);
});

test("switching to light", async ({ page }) => {
  await openWithTheBarShowing(page);
  expect(await pageBackground(page)).toBe(dark);

  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();

  await expect.poll(() => pageBackground(page)).toBe(light);
  await expect(
    page.getByRole("button", { name: "Switch to dark mode", exact: true }),
  ).toBeVisible();
});

test("my choice survives a reload", async ({ page }) => {
  await openWithTheBarShowing(page);
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect.poll(() => pageBackground(page)).toBe(light);

  await page.reload();

  expect(await pageBackground(page)).toBe(light);
});

test("switching back", async ({ page }) => {
  await openWithTheBarShowing(page);
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect.poll(() => pageBackground(page)).toBe(light);

  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();

  await expect.poll(() => pageBackground(page)).toBe(dark);
});
