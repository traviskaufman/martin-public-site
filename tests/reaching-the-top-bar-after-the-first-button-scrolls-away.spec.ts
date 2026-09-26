import { test, expect, type Page, type Locator } from "@playwright/test";

function getBar(page: Page): Locator {
  return page.getByRole("banner");
}

async function scrollHeroButtonAboveTheWindow(page: Page): Promise<void> {
  await page
    .getByRole("link", { name: "Get your license key for $5", exact: true })
    .first()
    .evaluate((el) => {
      const bottom = el.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo(0, bottom + 40);
    });
}

test.describe("in a 1440px wide window", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("no top bar on load", async ({ page }) => {
    await page.goto("/");

    await expect(getBar(page)).toBeHidden();
  });

  test("the bar appears once the hero button is off screen", async ({
    page,
  }) => {
    await page.goto("/");

    await scrollHeroButtonAboveTheWindow(page);

    const bar = getBar(page);
    await expect(bar).toBeVisible();
    await expect.poll(async () => (await bar.boundingBox())!.y).toBe(0);
    expect(await bar.evaluate((el) => getComputedStyle(el).position)).toBe(
      "fixed",
    );

    await expect(bar).toContainText("martin");
    await expect(
      bar.getByRole("link", { name: "Read the source", exact: true }),
    ).toBeVisible();
    await expect(
      bar.getByRole("link", {
        name: "Get your license key for $5",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      bar.getByRole("button", { name: "Switch to light mode", exact: true }),
    ).toBeVisible();
  });

  test("the bar leaves when I scroll back up", async ({ page }) => {
    await page.goto("/");
    await scrollHeroButtonAboveTheWindow(page);
    await expect(getBar(page)).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));

    await expect(getBar(page)).toBeHidden();
  });

  test("the bar's button goes to checkout", async ({ page }) => {
    await page.goto("/");
    await scrollHeroButtonAboveTheWindow(page);
    await expect(getBar(page)).toBeVisible();

    await getBar(page)
      .getByRole("link", { name: "Get your license key for $5", exact: true })
      .click();
    await page.waitForURL(/buy\.stripe\.com/);

    await expect(page.getByTestId("product-summary-total-amount")).toHaveText(
      "$5.00",
    );
  });
});

test.describe("in a 390px wide window", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("on a phone the bar drops the source link", async ({ page }) => {
    await page.goto("/");

    await scrollHeroButtonAboveTheWindow(page);

    const bar = getBar(page);
    await expect(bar).toBeVisible();
    await expect(
      bar.getByRole("link", {
        name: "Get your license key for $5",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      bar.getByRole("button", { name: "Switch to light mode", exact: true }),
    ).toBeVisible();
    await expect(
      bar.getByRole("link", { name: "Read the source", exact: true }),
    ).toHaveCount(0);
  });

  test("on a phone the bar's button fits inside the window", async ({
    page,
  }) => {
    await page.goto("/");

    await scrollHeroButtonAboveTheWindow(page);

    await expect(
      getBar(page).getByRole("link", {
        name: "Get your license key for $5",
        exact: true,
      }),
    ).toBeInViewport({ ratio: 1 });
  });
});
