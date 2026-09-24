import { test, expect } from "@playwright/test";
import {
  desktopChromeUserAgent,
  interceptPosthog,
  passBotDetection,
} from "./posthog";

test.use({ userAgent: desktopChromeUserAgent });

test("Opening the thank-you page sends nothing to analytics", async ({
  page,
}) => {
  await passBotDetection(page);
  const posthogRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://us.i.posthog.com/")) {
      posthogRequests.push(request.url());
    }
  });
  await interceptPosthog(page);

  await page.goto("/thanks");
  await page.waitForTimeout(3_000);

  expect(posthogRequests).toEqual([]);
  await expect(
    page.getByRole("heading", { level: 1, name: "Your key is on its way" }),
  ).toBeVisible();
});
