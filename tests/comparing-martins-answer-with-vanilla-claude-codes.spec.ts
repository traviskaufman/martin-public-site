import { test, expect, type Page, type Locator } from "@playwright/test";

const martinOpening = "Before we talk about what the CRM should do";
const vanillaOpening = "I built a personal CRM that runs on your own computer.";

function getSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

async function scrollHeadingIntoTopThird(
  page: Page,
  heading: string,
): Promise<void> {
  await page
    .getByRole("heading", { name: heading, exact: true })
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight * 0.2);
    });
}

function visibleText(area: Locator, text: string): Locator {
  return area.getByText(text).filter({ visible: true });
}

function linesEndingInQuestionMark(text: string): number {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith("?")).length;
}

const viewports = [
  {
    width: 1440,
    height: 900,
    comparison: (page: Page) =>
      page.getByRole("complementary", { name: "Terminal" }),
  },
  {
    width: 390,
    height: 844,
    comparison: (page: Page) => getSection(page, "I clarify by default"),
  },
];

for (const { width, height, comparison } of viewports) {
  test.describe(`at ${width} pixels wide`, () => {
    test.use({ viewport: { width, height } });

    test("Martin's side shows first", async ({ page }) => {
      await page.goto("/");
      await scrollHeadingIntoTopThird(page, "I clarify by default");

      const area = comparison(page);
      await expect(
        area.getByRole("tab", { name: "With Martin" }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        area.getByRole("tab", { name: "Without Martin" }),
      ).toHaveAttribute("aria-selected", "false");
      await expect(visibleText(area, martinOpening)).toBeVisible({
        timeout: 15_000,
      });
      await expect(visibleText(area, vanillaOpening)).toHaveCount(0);
    });

    test("vanilla's side opens with the ask it was given", async ({ page }) => {
      await page.goto("/");
      await scrollHeadingIntoTopThird(page, "I clarify by default");

      const area = comparison(page);
      await area.getByRole("tab", { name: "Without Martin" }).click();

      await expect(
        visibleText(area, "> Build me a personal CRM."),
      ).toBeVisible();
      await expect(visibleText(area, vanillaOpening)).toBeVisible();
      await expect(
        area
          .getByRole("button", { name: "Show more" })
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(visibleText(area, martinOpening)).toHaveCount(0);
    });
  });
}

test.describe("at 1440 pixels wide", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Martin asks before it builds", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await scrollHeadingIntoTopThird(page, "I clarify by default");

    const area = page.getByRole("complementary", { name: "Terminal" });
    await expect(visibleText(area, martinOpening)).toBeVisible();
    const martinText = await area
      .getByRole("tabpanel", { name: "With Martin" })
      .innerText();

    await area.getByRole("tab", { name: "Without Martin" }).click();
    const vanillaText = await area
      .getByRole("tabpanel", { name: "Without Martin" })
      .innerText();

    expect(linesEndingInQuestionMark(martinText)).toBeGreaterThan(
      linesEndingInQuestionMark(vanillaText),
    );
  });

  test("Zero slop shows both of vanilla's files", async ({ page }) => {
    await page.goto("/");
    await scrollHeadingIntoTopThird(page, "Zero slop");

    const area = page.getByRole("complementary", { name: "Terminal" });
    await area.getByRole("tab", { name: "Without Martin" }).click();

    await expect(
      visibleText(area, "server.py (716 lines), lines 36–73:"),
    ).toBeVisible();
    await expect(
      visibleText(
        area,
        "test_server.py, lines 15–45 (15 tests; they import server.py and call its Store class directly):",
      ),
    ).toBeVisible();
  });

  test("the tabs appear only beside a comparison", async ({ page }) => {
    await page.goto("/");
    const area = page.getByRole("complementary", { name: "Terminal" });
    const withMartin = area.getByRole("tab", { name: "With Martin" });

    await scrollHeadingIntoTopThird(page, "Why Travis built me");
    await expect(withMartin).toBeHidden();

    await scrollHeadingIntoTopThird(page, "I make minimal assumptions");
    await expect(withMartin).toBeVisible();
  });

  test("my choice follows me to the next comparison", async ({ page }) => {
    await page.goto("/");
    const area = page.getByRole("complementary", { name: "Terminal" });

    await scrollHeadingIntoTopThird(page, "I clarify by default");
    await area.getByRole("tab", { name: "Without Martin" }).click();

    await scrollHeadingIntoTopThird(page, "I make minimal assumptions");
    await expect(
      area.getByRole("tab", { name: "Without Martin" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(visibleText(area, vanillaOpening)).toBeVisible();
  });
});
