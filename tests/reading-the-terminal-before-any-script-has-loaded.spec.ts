import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const crmCommand = "> /martin:build me a personal CRM";
const firstBeatEnding = "Who was it, what happened, and how did you find out?";

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

async function transcriptLength(terminal: Locator): Promise<number> {
  return (await terminal.locator("pre").innerText()).length;
}

test("the transcript is in the HTML", async ({ request }) => {
  const response = await request.get("/");
  const body = await response.text();

  expect(body).toContain(
    "Before we talk about what the CRM should do, I'd like to understand what's going wrong today.",
  );
  expect(body).toContain("Travis Kaufman is the engineer who built me.");
  expect(body).toContain(
    "I'm glad to lay these out. Here's what you should know before paying:",
  );
});

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole session is readable", async ({ page }) => {
    await page.goto("/");

    const terminal = getTerminal(page);
    await expect(terminal.locator("p").first()).toHaveText(crmCommand);
    await expect(terminal).toContainText(firstBeatEnding);
    await expect(terminal).toContainText(
      "Is that right? Is anything missing or off?",
    );
    await expect(terminal).toContainText(
      "def test_the_follow_up_reminds_me_on_its_due_date",
    );
  });
});

test("the session waits for me to scroll", async ({ page }) => {
  await page.goto("/");
  const terminal = getTerminal(page);
  await expect(
    terminal.getByRole("button", { name: /Playback speed/ }),
  ).toHaveText("2×");
  await expect(
    terminal.getByRole("button", { name: "Pause", exact: true }),
  ).toBeHidden();

  await scrollHeadingIntoTopThird(page, "I clarify by default");

  await expect(
    terminal.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
});

test("playback runs at 2× by default", async ({ page }) => {
  await page.goto("/");

  await expect(
    getTerminal(page).getByRole("button", { name: /Playback speed/ }),
  ).toHaveText("2×");
});

test("I can pause and resume", async ({ page }) => {
  await page.goto("/");
  await scrollHeadingIntoTopThird(page, "I clarify by default");
  const terminal = getTerminal(page);
  await expect(
    terminal.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect.poll(() => transcriptLength(terminal)).toBeGreaterThan(0);

  await terminal.getByRole("button", { name: "Pause", exact: true }).click();
  const paused = await transcriptLength(terminal);
  await page.waitForTimeout(500);
  expect(await transcriptLength(terminal)).toBe(paused);

  await terminal.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => transcriptLength(terminal)).toBeGreaterThan(paused);
});

test("reduced motion cuts instead of typing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await scrollHeadingIntoTopThird(page, "I clarify by default");

  const terminal = getTerminal(page);
  await expect(terminal).toContainText(firstBeatEnding);
  await expect(terminal.locator(".cursor")).toBeHidden();
});
