import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const examples = [
  {
    heading: "What I do that vanilla Claude Code doesn't",
    title: "claude --agent martin",
    command:
      "Mostly losing touch with people I meant to stay close to, and forgetting what we last talked about. Most recent: last month I ran into Dana at a conference…",
    excerpt: "Thanks, the Dana story helps a lot. Two follow-ups:",
  },
  {
    heading: "Clarifying questions",
    title: "Martin",
    command: "Build me a personal CRM.",
    excerpt: "2. Tell me about the most recent time it happened.",
  },
  {
    heading: "Problem understanding",
    title: "Martin",
    command: "Build me a personal CRM.",
    excerpt: "Is that right? Is anything missing or off?",
  },
  {
    heading: "Code quality",
    title: "Martin",
    command: "Build me a personal CRM.",
    excerpt: "class Every:",
  },
  {
    heading: "Testing and robustness",
    title: "Martin",
    command: "Build me a personal CRM.",
    excerpt: "def test_the_follow_up_reminds_me_on_its_due_date",
  },
  {
    heading: "Why Travis built me",
    title: "claude --agent martin",
    command:
      "Who is Travis? Fetch https://www.linkedin.com/in/traviskaufman-thedeveloper/ and tell me about the person who built you.",
    excerpt: "Travis Kaufman is the engineer who built me.",
  },
  {
    heading: "What happens after you pay",
    title: "claude --agent martin",
    command: "/plugin",
    excerpt: "martin",
  },
  {
    heading: "FAQ",
    title: "claude --agent martin",
    command:
      "What are your caveats? Be honest — what should I know before I pay for you?",
    excerpt: "Here is what you should know before paying.",
  },
];

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

test("the terminal is on screen before I scroll", async ({ page }) => {
  await page.goto("/");

  const terminal = getTerminal(page);
  await expect(terminal).toHaveAccessibleName("claude --agent martin");

  const headline = await page.locator("h1").boundingBox();
  const terminalBox = await terminal.boundingBox();
  expect(terminalBox!.x).toBeGreaterThan(headline!.x + headline!.width);

  await expect(terminal.locator("p").first()).toHaveText(
    "> Build me a personal CRM.",
  );
  await expect(terminal).toContainText(
    "Before we talk about what the CRM should do, I'd like to understand what's going wrong today.",
    { timeout: 15_000 },
  );
});

for (const { heading, title, command, excerpt } of examples) {
  test(`the terminal follows "${heading}"`, async ({ page }) => {
    await page.goto("/");

    await scrollHeadingIntoTopThird(page, heading);

    const terminal = getTerminal(page);
    await expect(terminal).toHaveAccessibleName(title);
    await expect(terminal.locator("p").first()).toHaveText(`> ${command}`, {
      timeout: 15_000,
    });
    await expect(terminal).toContainText(excerpt, { timeout: 15_000 });
  });
}

test("the terminal stays put while I scroll within a section", async ({
  page,
}) => {
  await page.goto("/");

  await scrollHeadingIntoTopThird(page, "Why Travis built me");
  const terminal = getTerminal(page);
  const before = await terminal.boundingBox();

  await page.mouse.wheel(0, 300);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before!.y);

  const after = await terminal.boundingBox();
  expect(after!.y).toBe(before!.y);
});

test("the terminal is the Martin column of a comparison", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const section = page.locator("section", {
    has: page.getByRole("heading", {
      level: 2,
      name: "Clarifying questions",
      exact: true,
    }),
  });
  await scrollHeadingIntoTopThird(page, "Clarifying questions");

  const prompt = section.getByText("> Build me a personal CRM.", {
    exact: true,
  });
  const vanilla = section.locator("article", {
    has: page.getByRole("heading", { level: 3, name: "Vanilla Claude Code" }),
  });
  await expect(prompt).toBeVisible();
  const promptBox = await prompt.boundingBox();
  const vanillaBox = await vanilla.boundingBox();
  expect(promptBox!.y + promptBox!.height).toBeLessThanOrEqual(vanillaBox!.y);

  const terminal = getTerminal(page);
  await expect(terminal).toHaveAccessibleName("Martin");
  const terminalBox = await terminal.boundingBox();
  expect(terminalBox!.x).toBeGreaterThanOrEqual(
    vanillaBox!.x + vanillaBox!.width,
  );

  const vanillaText = await vanilla.locator("pre").innerText();
  const martinText = await terminal.locator("pre").innerText();
  expect(linesEndingInQuestionMark(martinText)).toBeGreaterThan(
    linesEndingInQuestionMark(vanillaText),
  );
});
