import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const crmCommand = "> /martin:build me a personal CRM";
const martinOpening = "Before we talk about what the CRM should do";

function getTerminal(page: Page): Locator {
  return page
    .getByRole("complementary", { name: "Terminal" })
    .getByRole("region");
}

function commandLine(terminal: Locator): Locator {
  return terminal.locator("p").first();
}

function transcript(terminal: Locator): Locator {
  return terminal.locator("pre");
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

async function firstLineInView(terminal: Locator): Promise<string> {
  return transcript(terminal).evaluate((pre) => {
    const pane = pre.parentElement!;
    const paneStyle = getComputedStyle(pane);
    const rect = pane.getBoundingClientRect();
    const x = rect.left + parseFloat(paneStyle.paddingLeft) + 2;
    const y = rect.top + parseFloat(paneStyle.paddingTop) + 2;
    const caret = document.caretRangeFromPoint(x, y);
    if (!caret || !pre.contains(caret.startContainer)) {
      return "";
    }
    const text = caret.startContainer.textContent ?? "";
    const start = text.lastIndexOf("\n", caret.startOffset - 1) + 1;
    const end = text.indexOf("\n", caret.startOffset);
    return text.slice(start, end === -1 ? undefined : end);
  });
}

test("the session opens with my ask and nothing else", async ({ page }) => {
  await page.goto("/");

  const terminal = getTerminal(page);
  await expect(terminal).toHaveAccessibleName("claude --agent martin");
  await expect(commandLine(terminal)).toHaveText(crmCommand);
  await expect(transcript(terminal)).toHaveText("");
});

test("the first section continues the session", async ({ page }) => {
  await page.goto("/");
  await scrollHeadingIntoTopThird(page, "I clarify by default");

  const terminal = getTerminal(page);
  await expect(commandLine(terminal)).toHaveText(crmCommand);
  await expect(transcript(terminal)).toContainText(martinOpening, {
    timeout: 15_000,
  });
});

test("the session accumulates instead of starting over", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await scrollHeadingIntoTopThird(page, "I make minimal assumptions");

  const terminal = getTerminal(page);
  await expect(transcript(terminal)).toContainText(martinOpening);
  await expect(transcript(terminal)).toContainText(
    "Is that right? Is anything missing or off?",
  );
  await expect.poll(() => firstLineInView(terminal)).toBe("You:");
});

test("the session ends at the code", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await scrollHeadingIntoTopThird(page, "Zero slop");

  const terminal = getTerminal(page);
  await expect(transcript(terminal)).toContainText(
    "Write(src/personal_crm/people.py)",
  );
  await expect(transcript(terminal)).toContainText(
    "Write(tests/e2e/test_follow_ups.py)",
  );
  await expect(transcript(terminal)).toContainText(
    "def test_the_follow_up_reminds_me_on_its_due_date",
  );
});

test("scrolling back up trims the session to where I am", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const terminal = getTerminal(page);

  await scrollHeadingIntoTopThird(page, "Zero slop");
  await expect(transcript(terminal)).toContainText(
    "Write(src/personal_crm/people.py)",
  );

  await scrollHeadingIntoTopThird(page, "I clarify by default");
  await expect(transcript(terminal)).toContainText(martinOpening);
  await expect(transcript(terminal)).not.toContainText(
    "Write(src/personal_crm/people.py)",
  );
});

test("Why Travis built me opens a new session", async ({ page }) => {
  await page.goto("/");
  await scrollHeadingIntoTopThird(page, "Why Travis built me");

  const terminal = getTerminal(page);
  await expect(commandLine(terminal)).toHaveText(
    "> Who is Travis? Fetch https://www.linkedin.com/in/traviskaufman-thedeveloper/ and tell me about the person who built you.",
    { timeout: 15_000 },
  );
  await expect(transcript(terminal)).not.toContainText(martinOpening);
  await expect(transcript(terminal)).toContainText(
    "Travis Kaufman is the engineer who built me.",
    { timeout: 15_000 },
  );
});

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

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole session is readable before any script runs", async ({
    page,
  }) => {
    await page.goto("/");

    const terminal = getTerminal(page);
    await expect(commandLine(terminal)).toHaveText(crmCommand);
    await expect(transcript(terminal)).toContainText(martinOpening);
    await expect(transcript(terminal)).toContainText(
      "Is that right? Is anything missing or off?",
    );
    await expect(transcript(terminal)).toContainText(
      "def test_the_follow_up_reminds_me_on_its_due_date",
    );
  });
});

test("nothing flashes before the script takes over", async ({ page }) => {
  await page.route("**/_astro/*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.goto("/", { waitUntil: "commit" });
  const terminal = getTerminal(page);

  await expect(transcript(terminal)).toContainText(martinOpening);
  await expect(transcript(terminal)).toBeHidden();
  await expect(commandLine(terminal)).toHaveText(crmCommand);

  await page.waitForTimeout(1000);
  await expect(transcript(terminal)).toContainText(martinOpening);
  await expect(transcript(terminal)).toBeHidden();

  await expect(transcript(terminal)).toHaveText("", { timeout: 10_000 });
});
