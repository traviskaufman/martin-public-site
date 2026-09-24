import { test, expect } from "@playwright/test";

const windows = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

for (const viewport of windows) {
  test.describe(`at ${viewport.width} pixels wide`, () => {
    test.use({ viewport });

    test("the page tells me where my key is and what to do next", async ({
      page,
    }) => {
      await page.goto("/thanks");

      await expect(page).toHaveURL(/\/thanks$/);
      await expect(page).toHaveTitle("Martin — your key is on its way");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Your key is on its way",
      );
      await expect(
        page.getByText(
          "Check your inbox for an email from support@trymartin.dev with your key and install instructions.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByText("Next steps:", { exact: true }),
      ).toBeVisible();

      const nextSteps = page.getByRole("main").getByRole("listitem");
      await expect(nextSteps).toHaveText([
        "Paste the install command from that email into your terminal. I install myself into Claude Code.",
        "Run claude --agent martin",
        "Say: Introduce Yourself",
      ]);

      await expect(
        page.getByText(
          "Questions or issues? Contact Support and a human will get in touch",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Contact Support", exact: true }),
      ).toHaveAttribute("href", "mailto:support@trymartin.dev");

      const scrollsSideways = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(scrollsSideways).toBe(false);
    });
  });
}

test("the page does not ask me to pay again", async ({ page }) => {
  await page.goto("/thanks");

  await expect(
    page.getByRole("heading", { level: 1, name: "Your key is on its way" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get your license key for $5" }),
  ).toHaveCount(0);
});
