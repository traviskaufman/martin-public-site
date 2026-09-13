import { test, expect, type Page, type Locator } from "@playwright/test";

const differentiators = [
  "I clarify by default",
  "I make minimal assumptions",
  "Zero slop",
];

const examples = [
  {
    comparison: "Clarifying questions",
    differentiator: "I clarify by default",
  },
  {
    comparison: "Problem understanding",
    differentiator: "I make minimal assumptions",
  },
  { comparison: "Code quality", differentiator: "Zero slop" },
  { comparison: "Testing and robustness", differentiator: "Zero slop" },
];

function getComparisonSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

test("the three differentiators head the comparisons", async ({ page }) => {
  await page.goto("/");

  const section = page.locator("section", {
    has: page.getByRole("heading", {
      level: 2,
      name: "What I do that vanilla Claude Code doesn't",
      exact: true,
    }),
  });
  await section.scrollIntoViewIfNeeded();

  const items = section.locator("ol > li");
  await expect(items).toHaveCount(3);

  for (const [index, text] of differentiators.entries()) {
    await expect(items.nth(index).locator("strong")).toHaveText(text);
  }

  const clarifyingQuestionsSection = getComparisonSection(
    page,
    "Clarifying questions",
  );
  const order = await page.evaluate(
    ([differentiatorsHeading, comparisonHeading]) => {
      const differentiatorsSection = Array.from(
        document.querySelectorAll("section"),
      ).find(
        (el) =>
          el.querySelector("h2")?.textContent?.trim() ===
          differentiatorsHeading,
      );
      const comparisonSection = Array.from(
        document.querySelectorAll("section"),
      ).find(
        (el) =>
          el.querySelector("h2")?.textContent?.trim() === comparisonHeading,
      );
      if (!differentiatorsSection || !comparisonSection) {
        return null;
      }
      return !!(
        differentiatorsSection.compareDocumentPosition(comparisonSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    },
    ["What I do that vanilla Claude Code doesn't", "Clarifying questions"],
  );

  expect(order).toBe(true);
  await expect(clarifyingQuestionsSection).toBeVisible();
});

for (const { comparison, differentiator } of examples) {
  test(`the "${comparison}" comparison is labelled "${differentiator}"`, async ({
    page,
  }) => {
    await page.goto("/");

    const section = getComparisonSection(page, comparison);
    await section.scrollIntoViewIfNeeded();

    const label = section.locator("p").first();
    await expect(label).toHaveText(differentiator);

    const labelBeforeHeading = await section.evaluate((sectionEl) => {
      const labelEl = sectionEl.querySelector("p");
      const headingEl = sectionEl.querySelector("h2");
      if (!labelEl || !headingEl) {
        return false;
      }
      return !!(
        labelEl.compareDocumentPosition(headingEl) &
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    expect(labelBeforeHeading).toBe(true);
  });
}
