import { test, expect, type Page, type Locator } from "@playwright/test";

function getSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

test("the steps are listed in order", async ({ page }) => {
  await page.route("https://buy.stripe.com/**", (route) => route.abort());

  await page.goto("/");

  const section = getSection(page, "What happens after you pay");
  await section.scrollIntoViewIfNeeded();

  const steps = section.locator("ol > li");
  await expect(steps).toHaveCount(4);

  await expect(steps.nth(0)).toHaveText(
    "You get an email from support@trymartin.dev with your license key and setup instructions.",
  );
  await expect(steps.nth(1)).toHaveText(
    "Paste the install command from that email into your terminal. I install myself into Claude Code.",
  );
  await expect(steps.nth(2)).toHaveText("Run claude --agent martin");
  await expect(steps.nth(3)).toHaveText("Say: Introduce Yourself");

  const button = section.getByRole("link", {
    name: "Get your license key for $5",
    exact: true,
  });
  await expect(button).toBeVisible();

  const handOffState = await button.evaluate((el: HTMLElement) => {
    el.click();
    return { text: el.textContent };
  });

  expect(handOffState.text).toBe("Opening checkout…");
});

test("the install command is shown", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "What happens after you pay");
  await section.scrollIntoViewIfNeeded();

  await expect(section).toContainText(
    "curl -fsSL https://trymartin.dev/install.sh | MARTIN_API_KEY=<your key> bash",
  );
});

test("the alias I add is named", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "What happens after you pay");
  await section.scrollIntoViewIfNeeded();

  await expect(section).toContainText(
    "I also add a martin alias to your shell profile, so martin works as a drop-in replacement for claude.",
  );
});
