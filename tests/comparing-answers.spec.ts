import { test, expect, type Page, type Locator } from "@playwright/test";

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
    await page.goto("/");

    const section = getComparisonSection(page, heading);
    await section.scrollIntoViewIfNeeded();

    const blockquotes = section.locator("blockquote");
    await expect(blockquotes).toHaveCount(1);
    await expect(blockquotes).not.toHaveText("");

    const articles = section.locator("article");
    await expect(articles).toHaveCount(2);

    const vanillaArticle = articles.nth(0);
    const martinArticle = articles.nth(1);

    await expect(vanillaArticle.getByRole("heading", { level: 3 })).toHaveText(
      "Vanilla Claude Code",
    );
    await expect(martinArticle.getByRole("heading", { level: 3 })).toHaveText(
      "Martin",
    );

    await expect(vanillaArticle.locator("pre")).not.toHaveText("");
    await expect(martinArticle.locator("pre")).not.toHaveText("");

    const order = await section.evaluate((sectionEl) => {
      const blockquote = sectionEl.querySelector("blockquote");
      const articleEls = sectionEl.querySelectorAll("article");
      if (!blockquote || articleEls.length !== 2) {
        return null;
      }
      const [firstArticle, secondArticle] = articleEls;
      const blockquoteBeforeFirst = !!(
        blockquote.compareDocumentPosition(firstArticle) &
        Node.DOCUMENT_POSITION_FOLLOWING
      );
      const blockquoteBeforeSecond = !!(
        blockquote.compareDocumentPosition(secondArticle) &
        Node.DOCUMENT_POSITION_FOLLOWING
      );
      return { blockquoteBeforeFirst, blockquoteBeforeSecond };
    });

    expect(order).toEqual({
      blockquoteBeforeFirst: true,
      blockquoteBeforeSecond: true,
    });
  });
}

test("Martin asks more questions than vanilla Claude Code under Clarifying questions", async ({
  page,
}) => {
  await page.goto("/");

  const section = getComparisonSection(page, "Clarifying questions");
  await section.scrollIntoViewIfNeeded();

  const articles = section.locator("article");
  const vanillaText = await articles.nth(0).locator("pre").innerText();
  const martinText = await articles.nth(1).locator("pre").innerText();

  const vanillaQuestionLines = linesEndingInQuestionMark(vanillaText);
  const martinQuestionLines = linesEndingInQuestionMark(martinText);

  expect(martinQuestionLines).toBeGreaterThan(vanillaQuestionLines);
});
