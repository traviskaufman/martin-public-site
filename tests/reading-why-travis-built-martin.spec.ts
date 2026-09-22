import { test, expect, type Page, type Locator } from "@playwright/test";

function getSection(page: Page, heading: string): Locator {
  return page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: heading, exact: true }),
  });
}

test("the thesis is stated", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "Why Travis built me");
  await section.scrollIntoViewIfNeeded();

  await expect(section).toContainText(
    "The skill gap is figuring out what code to write.",
  );

  const order = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section"));
    const zeroSlopSection = sections.find(
      (el) => el.querySelector("h2")?.textContent?.trim() === "Zero slop",
    );
    const whySection = sections.find(
      (el) =>
        el.querySelector("h2")?.textContent?.trim() === "Why Travis built me",
    );
    if (!zeroSlopSection || !whySection) {
      return null;
    }
    return !!(
      zeroSlopSection.compareDocumentPosition(whySection) &
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  expect(order).toBe(true);
});

test("the reader is told what goes wrong without Martin", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "Why Travis built me");
  await section.scrollIntoViewIfNeeded();

  await expect(section).toContainText(
    "Coding agents fall apart at non-trivial tasks",
  );
  await expect(section).toContainText("thin prototypes");
  await expect(section).toContainText("hours of loop engineering");
});

test("the reader is told who this is for", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "Why Travis built me");
  await section.scrollIntoViewIfNeeded();

  await expect(section).toContainText("Tired of drowning in slop");
  await expect(section).toContainText(
    "staring at /plan output until you go cross-eyed",
  );
  await expect(section).toContainText(
    "throwing hours of code and wasted tokens away",
  );
});

test("the fifteen years are stated", async ({ page }) => {
  await page.goto("/");

  const section = getSection(page, "Why Travis built me");
  await section.scrollIntoViewIfNeeded();

  await expect(section).toContainText(
    "Fifteen years championing clean code at some of the world's biggest companies",
  );
  await expect(section).toContainText(
    "distilled into a communication methodology",
  );
  await expect(section).toContainText("distilled into me");
});
