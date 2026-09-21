import { test, expect } from "@playwright/test";

const SITE_URL = "https://trymartin.dev";

const OG_TAGS: { property: string; content: string }[] = [
  {
    property: "og:title",
    content: "Martin — the senior software engineer for Claude Code",
  },
  {
    property: "og:image",
    content: `${SITE_URL}/og.png`,
  },
  {
    property: "og:url",
    content: `${SITE_URL}/`,
  },
  {
    property: "og:type",
    content: "website",
  },
];

for (const { property, content } of OG_TAGS) {
  test(`The page head carries og:${property.slice(3)}`, async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute(
      "content",
      content,
    );
  });
}

test("The page head asks for the large-image card", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("The preview image is the size messaging apps expect", async ({
  page,
}) => {
  const response = await page.request.get("/og.png");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");

  const body = await response.body();
  const width = body.readUInt32BE(16);
  const height = body.readUInt32BE(20);

  expect(width).toBe(1200);
  expect(height).toBe(630);
});
