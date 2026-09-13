import { test, expect, type Page } from "@playwright/test";
import zlib from "node:zlib";

test.use({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
      configurable: true,
    });
    Object.defineProperty(navigator, "userAgentData", {
      get: () => ({
        brands: [
          { brand: "Not_A Brand", version: "8" },
          { brand: "Chromium", version: "130" },
          { brand: "Google Chrome", version: "130" },
        ],
        mobile: false,
        platform: "macOS",
      }),
      configurable: true,
    });
  });
});

function decodePosthogEvents(
  contentType: string | undefined,
  buffer: Buffer,
): Record<string, unknown>[] {
  const gunzipIfCompressed = (bytes: Buffer): Buffer =>
    bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
      ? zlib.gunzipSync(bytes)
      : bytes;

  let json: string;
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const data =
      new URLSearchParams(buffer.toString("utf-8")).get("data") ?? "";
    json = gunzipIfCompressed(Buffer.from(data, "base64")).toString("utf-8");
  } else {
    json = gunzipIfCompressed(buffer).toString("utf-8");
  }

  const parsed = JSON.parse(json);
  return Array.isArray(parsed.batch) ? parsed.batch : [parsed];
}

async function interceptPosthog(
  page: Page,
): Promise<Record<string, unknown>[]> {
  const events: Record<string, unknown>[] = [];
  await page.route("https://us.i.posthog.com/**", async (route) => {
    const request = route.request();
    const buffer = request.postDataBuffer();
    if (buffer) {
      events.push(
        ...decodePosthogEvents(request.headers()["content-type"], buffer),
      );
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
  return events;
}

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

  const button = page.getByRole("link", {
    name: "Get your license key for $5",
    exact: true,
  });

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
