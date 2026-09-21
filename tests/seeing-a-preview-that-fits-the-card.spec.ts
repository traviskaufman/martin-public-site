import { test, expect } from "@playwright/test";

const PREVIEW_TAGS: { property: string; content: string }[] = [
  { property: "og:site_name", content: "Martin" },
  {
    property: "og:description",
    content:
      "I ask before I build, plan before I code, and write the tests first. A Claude Code plugin for $5.",
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

test("The browser tab names Martin first", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Martin — a software engineer for Claude Code",
  );
});
