import { test, expect, type Page, type Locator } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

const firstTranscriptEnding =
  "Who was it, what happened, and how did you find out?";

function getTerminal(page: Page): Locator {
  return page
    .getByRole("complementary", { name: "Terminal" })
    .getByRole("region");
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
  expect(body).toContain("Here is what you should know before paying.");
});

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the first transcript is readable", async ({ page }) => {
    await page.goto("/");

    const terminal = getTerminal(page);
    await expect(terminal.locator("p").first()).toHaveText(
      "> Build me a personal CRM.",
    );
    await expect(terminal).toContainText(firstTranscriptEnding);
  });
});

test("playback starts on its own once the script loads", async ({ page }) => {
  await page.goto("/");
  const terminal = getTerminal(page);
  await expect(
    terminal.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();

  await page.waitForTimeout(1000);

  await expect(terminal).not.toContainText(firstTranscriptEnding);
  await expect(
    terminal.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect(
    terminal.getByRole("button", { name: /Playback speed/ }),
  ).toHaveText("2×");
});

test("playback runs at 2× by default", async ({ page }) => {
  await page.goto("/");

  await expect(
    getTerminal(page).getByRole("button", { name: /Playback speed/ }),
  ).toHaveText("2×");
});

test("I can pause and resume", async ({ page }) => {
  await page.goto("/");
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

  const terminal = getTerminal(page);
  await expect(terminal).toContainText(firstTranscriptEnding);
  await expect(terminal.locator(".cursor")).toBeHidden();
});
