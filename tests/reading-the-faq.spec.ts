import { test, expect, type Page, type Locator } from "@playwright/test";

const examples = [
  {
    question: "How are you different from Claude Code?",
    answer: "I'm a plugin on top of Claude Code. Not a replacement for it.",
  },
  {
    question: "What are the drawbacks?",
    answer:
      "Longer sessions and more tokens than vanilla Claude Code. Run me with --model sonnet to spend less. I'm still in beta.",
  },
  {
    question: "Do you work with Codex or Pi?",
    answer:
      "I'm optimized for Claude Code. Email support@trymartin.dev if you need something else.",
  },
  {
    question: "Do I get updates?",
    answer: "Free for life with your license key.",
  },
  {
    question: "What do you log?",
    answer:
      "Zero telemetry. The only thing kept is the email you bought with. It's encrypted at rest and humans read the inbox.",
  },
  {
    question: "What license am I buying?",
    answer:
      "Polyform Internal Use 1.0.0. Use me and modify me. Don't distribute me. One key per seat at $5 each.",
  },
];

function getSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

for (const { question, answer } of examples) {
  test(`the answer to "${question}" is visible without a click`, async ({
    page,
  }) => {
    await page.goto("/");

    const section = getSection(page, "FAQ");
    await section.scrollIntoViewIfNeeded();

    const term = section.locator("dt", { hasText: question });
    await expect(term).toHaveText(question);

    const description = term.locator("xpath=following-sibling::dd[1]");
    await expect(description).toHaveText(answer);
    await expect(description).toBeVisible();
  });
}

test("exactly 6 questions are shown", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "FAQ");
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator("dt")).toHaveCount(6);
  await expect(section.locator("details")).toHaveCount(0);
  await expect(section.locator("summary")).toHaveCount(0);
});
