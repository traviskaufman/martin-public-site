import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("the terminal docks into the page after the FAQ", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  await expect(
    page.getByRole("complementary", { name: "Terminal" }),
  ).toBeHidden();

  const closing = page.locator("section", { hasText: "> ready to build?" });
  await expect(closing).toBeVisible();
  const closingBox = await closing.boundingBox();
  const footerBox = await footer.boundingBox();
  expect(closingBox!.y + closingBox!.height).toBeLessThanOrEqual(footerBox!.y);

  const terminalBox = await closing
    .getByText("> ready to build?")
    .boundingBox();
  const buttonBox = await closing
    .getByRole("link", { name: "Get your license key for $5", exact: true })
    .boundingBox();
  expect(buttonBox!.y).toBeGreaterThan(terminalBox!.y + terminalBox!.height);
});

test("nothing sits between the FAQ and the docked terminal", async ({
  page,
}) => {
  await page.goto("/");

  const faq = page.locator("section", {
    has: page.getByRole("heading", { level: 2, name: "FAQ", exact: true }),
  });
  await faq.scrollIntoViewIfNeeded();
  await expect(faq.locator("dt")).toHaveCount(6);

  const nextSectionText = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section"));
    const faqIndex = sections.findIndex(
      (el) => el.querySelector("h2")?.textContent?.trim() === "FAQ",
    );
    return sections[faqIndex + 1]?.textContent ?? "";
  });

  expect(nextSectionText).toContain("> ready to build?");
});
