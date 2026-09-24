import { test, expect } from "@playwright/test";
import {
  desktopChromeUserAgent,
  interceptPosthog,
  passBotDetection,
} from "./posthog";

test.use({ userAgent: desktopChromeUserAgent });

test.beforeEach(async ({ page }) => {
  await passBotDetection(page);
});

test("Opening the homepage counts one page view", async ({ page, context }) => {
  const events = await interceptPosthog(page);

  await page.goto("/");

  await expect
    .poll(() => events.some((event) => event.event === "$pageview"), {
      timeout: 10_000,
    })
    .toBe(true);

  expect(await context.cookies()).toEqual([]);
});

test("Clicking the purchase button counts one event", async ({ page }) => {
  const events = await interceptPosthog(page);
  await page.route("https://buy.stripe.com/**", () => {});

  await page.goto("/");

  const button = page
    .getByRole("link", {
      name: "Get your license key for $5",
      exact: true,
    })
    .first();

  const handOffState = await button.evaluate((el: HTMLElement) => {
    el.click();
    return {
      text: el.textContent,
      ariaDisabled: el.getAttribute("aria-disabled"),
    };
  });

  expect(handOffState.text).toBe("Opening checkout…");
  expect(handOffState.ariaDisabled).toBe("true");

  await expect
    .poll(() => events.some((event) => event.event === "get_license_key"), {
      timeout: 10_000,
    })
    .toBe(true);
});
