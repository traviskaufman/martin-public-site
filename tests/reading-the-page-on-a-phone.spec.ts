import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const crmCommand = "> /martin:build me a personal CRM";

function getTerminals(page: Page): Locator {
  return page.getByRole("region", { name: "claude --agent martin" });
}

function getSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

const provenSections = [
  {
    heading: "I clarify by default",
    bylineStart: "I never assume you know exactly what you want",
    excerpt: "Before we talk about what the CRM should do",
  },
  {
    heading: "I make minimal assumptions",
    bylineStart: "I will never go off and build a 40-file change",
    excerpt: "Is that right? Is anything missing or off?",
  },
  {
    heading: "Zero slop",
    bylineStart: "Vanilla agents pattern-match to their training data",
    excerpt: "Write(tests/e2e/test_follow_ups.py)",
  },
  {
    heading: "Why Travis built me",
    bylineStart: "Coding agents fall apart at non-trivial tasks",
    excerpt: "Travis Kaufman is the engineer who built me.",
  },
];

test("nothing is pinned to the bottom of the window", async ({ page }) => {
  await page.goto("/");

  const terminals = getTerminals(page);
  await expect(terminals).toHaveCount(5);
  const before = await terminals.evaluateAll((elements) =>
    elements.map((el) => el.getBoundingClientRect().top),
  );

  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300);

  const after = await terminals.evaluateAll((elements) =>
    elements.map((el) => el.getBoundingClientRect().top),
  );
  expect(after).toEqual(before.map((top) => top - 300));
});

test("the hero terminal sits under the button and shows only my ask", async ({
  page,
}) => {
  await page.goto("/");

  const button = page
    .getByRole("link", { name: "Get your license key for $5", exact: true })
    .first();
  const terminal = getTerminals(page).first();

  const buttonBox = await button.boundingBox();
  const terminalBox = await terminal.boundingBox();
  expect(terminalBox!.y).toBeGreaterThanOrEqual(
    buttonBox!.y + buttonBox!.height,
  );
  await expect(terminal.locator("p").first()).toHaveText(crmCommand);
  await expect(terminal.locator("pre")).toHaveText("");
});

for (const { heading, bylineStart, excerpt } of provenSections) {
  test(`a terminal sits under "${heading}"`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const section = getSection(page, heading);
    await section.scrollIntoViewIfNeeded();

    const byline = section.getByText(bylineStart);
    const terminal = section.getByRole("region", {
      name: "claude --agent martin",
    });
    const bylineBox = await byline.boundingBox();
    const terminalBox = await terminal.boundingBox();
    expect(terminalBox!.y).toBeGreaterThanOrEqual(
      bylineBox!.y + bylineBox!.height,
    );

    await terminal.scrollIntoViewIfNeeded();
    await expect(terminal).toContainText(excerpt);
  });
}

for (const heading of ["What happens after you pay", "FAQ"]) {
  test(`"${heading}" has no terminal`, async ({ page }) => {
    await page.goto("/");

    const section = getSection(page, heading);
    await section.scrollIntoViewIfNeeded();

    await expect(section.getByRole("region")).toHaveCount(0);
  });
}

test("five terminals precede the closing prompt", async ({ page }) => {
  await page.goto("/");

  const closing = page.getByText("> ready to build?");
  await closing.scrollIntoViewIfNeeded();
  const closingBox = await closing.boundingBox();

  const terminals = getTerminals(page);
  await expect(terminals).toHaveCount(5);
  const tops = await terminals.evaluateAll((elements) =>
    elements.map((el) => el.getBoundingClientRect().top),
  );
  for (const top of tops) {
    expect(top).toBeLessThan(closingBox!.y);
  }
});
