import { test, expect } from "@playwright/test";

const PREVIEW_TAGS: { property: string; content: string }[] = [
  { property: "og:site_name", content: "Martin" },
  {
    property: "og:description",
    content: "Turns Claude Code into an expert software engineer",
  },
];

for (const { property, content } of PREVIEW_TAGS) {
  test(`The page head carries ${property}`, async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute(
      "content",
      content,
    );
  });
}

test("The browser tab is titled with the headline alone", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Turn your coding agent into a Software Engineering agent",
  );
});
