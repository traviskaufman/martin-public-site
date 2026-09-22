import { test, expect } from "@playwright/test";

const sections = [
  {
    headline: "I clarify by default",
    byline:
      "I never assume you know exactly what you want before I build, because often you don't. Human ideas are messy; I turn yours into a rigorous specification first.",
  },
  {
    headline: "I make minimal assumptions",
    byline:
      "I will never go off and build a 40-file change you never asked for. I step back, reason, and plan before I touch code.",
  },
  {
    headline: "Zero slop",
    byline:
      "Vanilla agents pattern-match to their training data. I build a system around your idea, then layer on clean-code principles and tests that assert what a user sees, so you can hand the code off without drowning in tech debt.",
  },
];

const oldHeadings = [
  "What I do that vanilla Claude Code doesn't",
  "Clarifying questions",
  "Problem understanding",
  "Code quality",
  "Testing and robustness",
];

const headingOrder = [
  "Turn your coding agent into a Software Engineering agent",
  "I clarify by default",
  "I make minimal assumptions",
  "Zero slop",
  "Why Travis built me",
];

for (const { headline, byline } of sections) {
  test(`"${headline}" heads its own section`, async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", {
      level: 2,
      name: headline,
      exact: true,
    });
    await heading.scrollIntoViewIfNeeded();

    const textUnderHeadline = await heading.evaluate(
      (el) => el.nextElementSibling?.textContent?.trim() ?? "",
    );
    expect(textUnderHeadline).toBe(byline);
  });
}

for (const heading of oldHeadings) {
  test(`there is no heading "${heading}"`, async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toHaveCount(0);
  });
}

test("the sections follow the headline in order", async ({ page }) => {
  await page.goto("/");

  const headings = (await page.locator("h1, h2").allTextContents()).map(
    (text) => text.trim(),
  );

  for (const [index, heading] of headingOrder.slice(0, -1).entries()) {
    expect(headings[headings.indexOf(heading) + 1]).toBe(
      headingOrder[index + 1],
    );
  }
});
