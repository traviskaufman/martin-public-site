import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const headings = [
  "Clarifying questions",
  "Problem understanding",
  "Code quality",
  "Testing and robustness",
];

function getComparisonSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

function getTerminal(page: Page): Locator {
  return page
    .getByRole("complementary", { name: "Terminal" })
    .getByRole("region");
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

function linesEndingInQuestionMark(text: string): number {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith("?")).length;
}

for (const heading of headings) {
  test(`the "${heading}" comparison shows one prompt above two labelled columns`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const section = getComparisonSection(page, heading);
    await scrollHeadingIntoTopThird(page, heading);

    const prompt = section.getByText("> Build me a personal CRM.", {
      exact: true,
    });
    await expect(prompt).toHaveCount(1);

    const vanillaArticle = section.locator("article");
    await expect(vanillaArticle).toHaveCount(1);
    await expect(vanillaArticle.getByRole("heading", { level: 3 })).toHaveText(
      "Vanilla Claude Code",
    );
    await expect(vanillaArticle.locator("pre")).not.toHaveText("");

    const promptBox = await prompt.boundingBox();
    const vanillaBox = await vanillaArticle.boundingBox();
    expect(promptBox!.y + promptBox!.height).toBeLessThanOrEqual(vanillaBox!.y);

    const terminal = getTerminal(page);
    await expect(terminal).toHaveAccessibleName("Martin");
    await expect(terminal.locator("pre")).not.toHaveText("");
    const terminalBox = await terminal.boundingBox();
    expect(terminalBox!.x).toBeGreaterThanOrEqual(
      vanillaBox!.x + vanillaBox!.width,
    );
  });
}

test("Martin asks more questions than vanilla Claude Code under Clarifying questions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const section = getComparisonSection(page, "Clarifying questions");
  await scrollHeadingIntoTopThird(page, "Clarifying questions");

  const terminal = getTerminal(page);
  await expect(terminal).toHaveAccessibleName("Martin");

  const vanillaText = await section.locator("article pre").innerText();
  const martinText = await terminal.locator("pre").innerText();

  expect(linesEndingInQuestionMark(martinText)).toBeGreaterThan(
    linesEndingInQuestionMark(vanillaText),
  );
});
