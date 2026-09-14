import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

function getSheet(page: Page): Locator {
  return page.getByRole("complementary", { name: "Terminal" });
}

test("the terminal is a sheet at the bottom", async ({ page }) => {
  await page.goto("/");

  const sheet = getSheet(page);
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate((el) => getComputedStyle(el).position)).toBe(
    "fixed",
  );

  const box = await sheet.boundingBox();
  expect(box!.y + box!.height).toBe(844);
  expect(box!.height).toBe(112);

  await expect(sheet.getByText("> Build me a personal CRM.")).toBeVisible();
});

test("expanding the sheet", async ({ page }) => {
  await page.goto("/");
  const sheet = getSheet(page);

  await sheet.getByRole("button", { name: "Expand the terminal" }).click();

  await expect
    .poll(async () => (await sheet.boundingBox())!.height)
    .toBeGreaterThanOrEqual(320);
  await expect(
    sheet.getByText("Before we talk about what the CRM should do"),
  ).toBeVisible({ timeout: 15_000 });
});

test("the sheet is the Martin column", async ({ page }) => {
  await page.goto("/");

  const section = page.locator("section", {
    has: page.getByRole("heading", {
      level: 2,
      name: "Clarifying questions",
      exact: true,
    }),
  });
  await page
    .getByRole("heading", { name: "Clarifying questions", exact: true })
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight * 0.2);
    });

  const vanilla = section.locator("article", {
    has: page.getByRole("heading", { level: 3, name: "Vanilla Claude Code" }),
  });
  await expect(vanilla).toBeInViewport({ ratio: 1 });
  await expect(
    section.getByText("Martin's reply plays in the terminal below ↓"),
  ).toBeVisible();
  await expect(getSheet(page).getByRole("region")).toHaveAccessibleName(
    "Martin",
  );
});
